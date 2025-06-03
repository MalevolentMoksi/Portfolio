// This script handles the sticky header and back-to-top button functionality, as well as the animation of blocks when they come into view.
// Pages/script.js

document.addEventListener('DOMContentLoaded', () => {
  // ======== 1. Define track file names and figure out correct path prefix ========
  const trackFiles = ['deepstone.m4a', 'browser.m4a', 'wildriver.m4a'];

  // Determine whether the current page is inside /Pages/ or not, to set the path to Music/
  // If the pathname contains '/Pages/', we need '../Music/<filename>'. Otherwise 'Music/<filename>'.
  const pathPrefix = window.location.pathname.includes('/Pages/')
    ? '../Music/'
    : 'Music/';

  // Build full URLs for each track
  const trackURLs = trackFiles.map(name => pathPrefix + name);

  // ======== 2. localStorage keys and state defaults ========
  const STORAGE_KEYS = {
    TRACK_INDEX: 'music-currentTrack',
    CURRENT_TIME: 'music-currentTime',
    IS_PAUSED: 'music-isPaused'
  };

  // Get saved state or default to first track, time=0, not paused
  let currentTrackIndex = parseInt(localStorage.getItem(STORAGE_KEYS.TRACK_INDEX), 10);
  if (isNaN(currentTrackIndex) || currentTrackIndex < 0 || currentTrackIndex >= trackURLs.length) {
    currentTrackIndex = 0;
  }
  let savedTime = parseFloat(localStorage.getItem(STORAGE_KEYS.CURRENT_TIME));
  if (isNaN(savedTime) || savedTime < 0) {
    savedTime = 0;
  }
  let isPaused = localStorage.getItem(STORAGE_KEYS.IS_PAUSED) === 'true';

  // ======== 3. Create audio element and load metadata ========
  const audio = new Audio();
  audio.preload = 'metadata';
  audio.src = trackURLs[currentTrackIndex];

  // Once metadata is loaded, set the last known time, and decide whether to play
  audio.addEventListener('loadedmetadata', () => {
    // If savedTime is beyond the duration (e.g. because track changed), clamp to 0
    if (savedTime >= audio.duration) {
      savedTime = 0;
    }
    audio.currentTime = savedTime;
    if (!isPaused) {
      audio.play().catch(() => {
        // Autoplay might be blocked; we leave it paused
      });
    }
  });

  // Update localStorage whenever time updates (debounce throttle)
  let progressThrottle = 0;
  audio.addEventListener('timeupdate', () => {
    progressThrottle++;
    if (progressThrottle % 2 === 0) { // roughly every 20ms
      localStorage.setItem(STORAGE_KEYS.CURRENT_TIME, audio.currentTime.toString());
      updateProgressBar();
    }
  });

  // When user pauses/plays, store that state
  audio.addEventListener('pause', () => {
    isPaused = true;
    localStorage.setItem(STORAGE_KEYS.IS_PAUSED, 'true');
    updatePlayPauseButton();
  });
  audio.addEventListener('play', () => {
    isPaused = false;
    localStorage.setItem(STORAGE_KEYS.IS_PAUSED, 'false');
    updatePlayPauseButton();
  });

  // When track ends, automatically switch to next
  audio.addEventListener('ended', () => {
    switchToNextTrack();
  });

  // ======== 4. Read metadata (title, artist, album art) for all tracks ========
  // We’ll store an array of objects: { title, artist, pictureDataURL }
  const trackMeta = trackURLs.map(() => ({
    title: 'Loading...',
    artist: '',
    pictureDataURL: '' // fallback blank
  }));

  trackURLs.forEach((url, idx) => {
    // Build an absolute URL so jsmediatags can reliably XHR it:
    const absoluteURL = window.location.origin + '/' + url;

    new jsmediatags.Reader(absoluteURL)
      .setTagsToRead(["title", "artist", "picture"])
      .read({
        onSuccess: tag => {
          const tags = tag.tags;
          trackMeta[idx].title = tags.title || 'Unknown Title';
          trackMeta[idx].artist = tags.artist || 'Unknown Artist';

          if (tags.picture && tags.picture.data && tags.picture.format) {
            const { data, format } = tags.picture;
            const byteArray = new Uint8Array(data);
            let binaryString = '';
            byteArray.forEach(b => {
              binaryString += String.fromCharCode(b);
            });
            const base64String = window.btoa(binaryString);
            trackMeta[idx].pictureDataURL = `data:${format};base64,${base64String}`;
          } else {
            trackMeta[idx].pictureDataURL = '';
          }

          // If this is the current track, display right away:
          if (idx === currentTrackIndex) {
            updateTrackInfoDisplay();
          }
        },
        onError: error => {
          console.warn(`jsmediatags error for ${absoluteURL}:`, error);
          trackMeta[idx].title = trackFiles[idx];
          trackMeta[idx].artist = '';
          trackMeta[idx].pictureDataURL = '';
          if (idx === currentTrackIndex) {
            updateTrackInfoDisplay();
          }
        }
      });
  });

  // ======== 5. Build & insert the player’s HTML structure ========
  const playerContainer = document.createElement('div');
  playerContainer.id = 'music-player';
  playerContainer.innerHTML = `
    <img class="album-art" src="" alt="Album Art" />
    <div class="track-info">
      <div class="text-wrapper">
        <span class="title"></span>
      </div>
      <div class="text-wrapper">
        <span class="artist"></span>
      </div>
    </div>

    <div class="controls">
      <button id="play-pause-btn" title="Play/Pause">❚❚</button>
      <button id="next-btn" title="Next Track">»</button>
    </div>
    <div class="progress-container">
      <div class="progress"></div>
    </div>
  `;
  document.body.appendChild(playerContainer);

  // Grab references to dynamic parts
  const albumArtEl = playerContainer.querySelector('img.album-art');
  const titleEl = playerContainer.querySelector('.track-info .title');
  const artistEl = playerContainer.querySelector('.track-info .artist');
  const playPauseBtn = playerContainer.querySelector('#play-pause-btn');
  const nextBtn = playerContainer.querySelector('#next-btn');
  const progressBar = playerContainer.querySelector('.progress');

  // ======== 6. Functions to update UI elements ========
  function updateTrackInfoDisplay() {
  const meta = trackMeta[currentTrackIndex];

  // 1) Update text
  titleEl.textContent = meta.title || trackFiles[currentTrackIndex];
  artistEl.textContent = meta.artist;

  // 2) Update album art
  if (meta.pictureDataURL) {
    albumArtEl.src = meta.pictureDataURL;
  } else {
    albumArtEl.src = '';
  }

  // 3) Now check for overflow & apply scroll animation if needed
  applyScrollIfOverflow(titleEl);
  applyScrollIfOverflow(artistEl);
}


  /**
 * If the <span>’s scrollWidth > its container’s clientWidth, enable scrolling.
 * Otherwise, remove any scroll animation.
 *
 * @param {HTMLElement} spanEl   The <span> element containing text.
 */
  function applyScrollIfOverflow(spanEl) {
    // The parent of spanEl is .text-wrapper, which has overflow:hidden and fixed width
    const container = spanEl.parentElement;
    // Reset any old inline vars / classes
    spanEl.classList.remove('scrolling');
    spanEl.style.removeProperty('--scroll-distance');

    // Must wait one tick so the browser renders the updated textContent
    // (if updateTrackInfoDisplay just changed it). We can use requestAnimationFrame:
    window.requestAnimationFrame(() => {
      const scrollW = spanEl.scrollWidth;
      const clientW = container.clientWidth;
      if (scrollW > clientW + 1) {
        // Compute how many pixels we need to shift left
        const distance = scrollW - clientW;
        // Set the CSS custom property:
        spanEl.style.setProperty('--scroll-distance', distance + 'px');
        // Add the class that triggers @keyframes scroll-text
        spanEl.classList.add('scrolling');
      }
    });
  }


  function updatePlayPauseButton() {
    if (audio.paused) {
      playPauseBtn.textContent = '►';
    } else {
      playPauseBtn.textContent = '❚❚';
    }
  }

  function updateProgressBar() {
    if (!audio.duration || audio.duration === Infinity) return;
    const percent = (audio.currentTime / audio.duration) * 100;
    progressBar.style.width = percent + '%';
  }

  // ======== 7. Handle user interactions ========
  playPauseBtn.addEventListener('click', () => {
    if (audio.paused) {
      audio.play().catch(() => {
        // Might fail if autoplay is blocked; nothing special required
      });
    } else {
      audio.pause();
    }
  });

  nextBtn.addEventListener('click', () => {
    switchToNextTrack();
  });

  // ======== 8. Switch to next track logic ========
  function switchToNextTrack() {
    // Advance index
    currentTrackIndex = (currentTrackIndex + 1) % trackURLs.length;
    localStorage.setItem(STORAGE_KEYS.TRACK_INDEX, currentTrackIndex.toString());

    // Reset savedTime for new track
    savedTime = 0;
    localStorage.setItem(STORAGE_KEYS.CURRENT_TIME, '0');

    // Change audio source and load
    audio.src = trackURLs[currentTrackIndex];
    updateTrackInfoDisplay();
    updatePlayPauseButton();

    // If user was playing before switching, autostart; otherwise remain paused
    if (!isPaused) {
      audio.play().catch(() => { /* ignore */ });
    }
  }

  // ======== 9. Initialize display once ========
  updateTrackInfoDisplay();
  updatePlayPauseButton();
  updateProgressBar();

  // If the user leaves/refreshes, save current time immediately
  window.addEventListener('beforeunload', () => {
    localStorage.setItem(STORAGE_KEYS.CURRENT_TIME, audio.currentTime.toString());
    localStorage.setItem(STORAGE_KEYS.IS_PAUSED, audio.paused.toString());
    localStorage.setItem(STORAGE_KEYS.TRACK_INDEX, currentTrackIndex.toString());
  });
});


const blocks = document.querySelectorAll('.presentation-block');

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, { threshold: 0.2 });

blocks.forEach(block => {
  observer.observe(block);
});

// --- Curvy Golden Cursor Trail with Fading using Canvas ---

// Create the canvas element and style it
const canvas = document.createElement('canvas');
canvas.id = 'cursor-canvas';
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
canvas.style.position = 'fixed';
canvas.style.top = '0';
canvas.style.left = '0';
canvas.style.pointerEvents = 'none';
canvas.style.zIndex = '9999';
document.body.appendChild(canvas);

const ctx = canvas.getContext('2d');
const trailPoints = [];
const maxTrailPoints = 10; // Adjust for longer/shorter trail

// Update canvas size on window resize
window.addEventListener('resize', () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});

// Helper function to convert a hex color to rgba string with given alpha
function hexToRGBA(hex, alpha) {
  hex = hex.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Capture mouse movements
document.addEventListener('mousemove', (e) => {
  // Add current mouse position to the trail array
  trailPoints.push({ x: e.clientX, y: e.clientY });
  if (trailPoints.length > maxTrailPoints) {
    trailPoints.shift();
  }
});

function drawTrail() {
  // Clear the canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (trailPoints.length < 2) {
    requestAnimationFrame(drawTrail);
    return;
  }

  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = 4;

  // Get the golden color from CSS variable
  const primaryColor = getComputedStyle(document.documentElement)
    .getPropertyValue('--primary-color').trim();

  // Define minimum and maximum opacities
  const minAlpha = 0.1;
  const maxAlpha = 1.0;

  // Draw each segment individually with fading opacity
  for (let i = 0; i < trailPoints.length - 1; i++) {
    const current = trailPoints[i];
    const next = trailPoints[i + 1];
    // Calculate midpoint for a smooth quadratic curve
    const midX = (current.x + next.x) / 2;
    const midY = (current.y + next.y) / 2;

    // Compute alpha so older segments are more transparent
    let t = i / (trailPoints.length - 1);
    let alpha = minAlpha + (maxAlpha - minAlpha) * t;

    ctx.strokeStyle = hexToRGBA(primaryColor, alpha);
    ctx.beginPath();
    ctx.moveTo(current.x, current.y);
    ctx.quadraticCurveTo(current.x, current.y, midX, midY);
    ctx.stroke();
  }

  requestAnimationFrame(drawTrail);
}

drawTrail();

// Initialize particles.js
particlesJS('particles-js', {
  "particles": {
    "number": {
      "value": 80,
      "density": { "enable": true, "value_area": 800 }
    },
    "color": { "value": "#d4af37" },
    "shape": {
      "type": "circle",
      "stroke": { "width": 0, "color": "#000000" }
    },
    "opacity": {
      "value": 0.5,
      "random": true,
      "anim": { "enable": false }
    },
    "size": {
      "value": 3,
      "random": true,
      "anim": { "enable": false }
    },
    "line_linked": {
      "enable": true,
      "distance": 150,
      "color": "#d4af37",
      "opacity": 0.4,
      "width": 1
    },
    "move": {
      "enable": true,
      "speed": 2,
      "direction": "none",
      "random": false,
      "straight": false,
      "out_mode": "out",
      "bounce": false
    }
  },
  "interactivity": {
    "detect_on": "canvas",
    "events": {
      "onclick": { "enable": true, "mode": "push" },
      "resize": true
    },
    "modes": {
      "push": { "particles_nb": 4 }
    }
  },
  "retina_detect": true
});

// Parallax on the full-screen background image (now more pronounced)
const bg = document.getElementById('background');
if (bg) {
  // target offsets and current positions
  let mouseX = 0, mouseY = 0, posX = 0, posY = 0;
  const friction = 1 / 12;    // lower = slower/easing; tweak as you like
  const depth = 0.06;         // ↑ 0.06 → about 36px shift if screen is 1200px wide

  // track cursor displacement relative to center
  window.addEventListener('mousemove', e => {
    const x = e.clientX - window.innerWidth / 2;
    const y = e.clientY - window.innerHeight / 2;
    mouseX = x * depth;
    mouseY = y * depth;
  });

  // smooth‐step each frame
  function updateParallax() {
    posX += (mouseX - posX) * friction;
    posY += (mouseY - posY) * friction;
    // ↑ bump zoom from 1.1 → 1.15 for extra impact
    bg.style.transform = `scale(1.15) translate(${posX}px, ${posY}px)`;
    requestAnimationFrame(updateParallax);
  }
  updateParallax();
}


// Typing effect pour le h1, curseur disparaît à la fin
document.addEventListener("DOMContentLoaded", function () {
  const el = document.getElementById("main-title");
  if (!el) return;

  const fullText = el.textContent;
  el.textContent = "";
  el.classList.add("typing"); // Ajoute la classe qui active le curseur

  let i = 0;
  function typeLetter() {
    if (i <= fullText.length) {
      el.textContent = fullText.slice(0, i);
      i++;
      setTimeout(typeLetter, 50);
    } else {
      el.classList.remove("typing"); // Enlève le curseur après
    }
  }
  typeLetter();
});




// ===== Mini "glitch" animé en JS pur ===============================
document.addEventListener("DOMContentLoaded", () => {
  const target = document.querySelector(".local-part");
  if (!target) return;

  const GLITCH_LENGTH = 10;            // nombre de caractères fictifs
  const GLITCH_CHARS = "█▓▒░";         // jeu de symboles
  const INTERVAL = 400;            // ms entre 2 frames

  // génère une chaine aléatoire de longueur n
  const randomString = (n) =>
    Array.from({ length: n }, () =>
      GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)]
    ).join("");

  // boucle d'animation
  setInterval(() => {
    target.textContent = randomString(GLITCH_LENGTH);
  }, INTERVAL);
});

document.addEventListener("DOMContentLoaded", () => {
  // On récupère toutes les vidéos “hover-play” de la page
  const hoverVideos = document.querySelectorAll(".hover-play");

  hoverVideos.forEach(video => {
    // Pour chaque vidéo, on va récupérer la DIV .progress associée
    // Celle-ci se trouve dans le même .video-item :
    const progressBar = video
      .closest(".video-item")
      .querySelector(".progress");

    // Lorsque la souris entre dans le conteneur vidéo, on lance la lecture
    video.addEventListener("mouseenter", () => {
      // video.play() renvoie une promesse ; on peut l’ignorer si elle échoue
      video.play().catch(_ => { });
    });

    // Lorsque la souris sort, on met en pause (on ne change PAS currentTime)
    video.addEventListener("mouseleave", () => {
      video.pause();
    });

    // À chaque ‘timeupdate’ (c-à-d quand currentTime évolue),
    // on recalcule le pourcentage lu
    video.addEventListener("timeupdate", () => {
      if (!video.duration) return; // au cas où la vidéo n’est pas encore chargée
      const pourcentage = (video.currentTime / video.duration) * 100;
      // On ajuste dynamiquement la largeur de .progress
      progressBar.style.width = `${pourcentage}%`;
    });

    // Quand les métadonnées sont chargées, on peut éventuellement
    // initialiser la barre à 0 (inutile si c'est déjà 0, mais c’est plus sûr)
    video.addEventListener("loadedmetadata", () => {
      progressBar.style.width = "0%";
    });

    // Si la vidéo “boucle” (loop = true), on veut que la barre reparte à 0
    // dès qu’elle atteint la fin (finished). L’événement ‘ended’ n’est pas
    // déclenché si loop=true, donc on peut écouter “timeupdate” et
    // détecter quand currentTime + petit epsilon >= duration :
    video.addEventListener("timeupdate", () => {
      if (video.currentTime >= video.duration - 0.05) {
        // on remet strictement à 0 pour éviter un clignotement tardif
        progressBar.style.width = "0%";
      }
    });
  });
});


document.addEventListener('DOMContentLoaded', function () {
  // Native View Transition API for Chrome/Edge
  if (document.startViewTransition) {
    document.addEventListener('click', function (e) {
      const a = e.target.closest('a');
      if (!a) return;
      const url = new URL(a.href, location);
      // Only handle same-origin, not anchors, not new tabs/windows
      if (
        url.origin !== location.origin ||
        a.target === '_blank' ||
        a.href.includes('#') ||
        e.ctrlKey || e.metaKey || e.shiftKey || e.altKey
      ) return;
      e.preventDefault();
      document.startViewTransition(() => {
        window.location = a.href;
      });
    });
  }
});
