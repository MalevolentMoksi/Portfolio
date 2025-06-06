// This script handles the sticky header and back-to-top button functionality, as well as the animation of blocks when they come into view.
// Pages/script.js

// Pages/script.js

document.addEventListener('DOMContentLoaded', () => {
  // ======== 1. Define track file names and figure out correct path prefix ========
  const trackFiles = ['deepstone.m4a', 'browser.m4a', 'wildriver.m4a'];

  // At the very top of script.js (before you build trackURLs), insert:
  const pathParts = window.location.pathname.split('/');
  // Example for GitHub Pages: pathname might be "/P2.01-Portfolio/Pages/projets.html"
  // so pathParts[1] === "P2.01-Portfolio"
  const repoName = pathParts[1] || '';

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

  // ─── Safe Autoplay Integration Starts Here ───
  // Attempt a muted autoplay on load (browsers allow muted play).
  // We’ll only unmute if the user has not explicitly paused last session (isPaused === false).

  audio.muted = true;

  audio.addEventListener('loadedmetadata', () => {
    // If savedTime is beyond the duration (e.g. because track changed), clamp to 0
    if (savedTime >= audio.duration) {
      savedTime = 0;
    }
    audio.currentTime = savedTime;

    // Only attempt play/unmute if user did not manually pause last session
    if (!isPaused) {
      audio.play()
        .then(() => {
          // After a tiny delay, unmute so the user hears sound
          setTimeout(() => {
            audio.muted = false;
          }, 150);
        })
        .catch(() => {
          // Autoplay (even muted) may be blocked in rare cases; 
          // we’ll wait for a user click instead
        });
    }
  });

  // If the audio remains paused (and isPaused === false), 
  // unmute & play on first user interaction
  document.addEventListener('click', () => {
    if (!isPaused && audio.paused) {
      audio.play().then(() => {
        audio.muted = false;
      }).catch(() => {
        // If still blocked, do nothing. Another click can try again.
      });
    }
  });

  // ======== 4. Persist time and paused state ========
  audio.addEventListener('timeupdate', () => {
    // Every time the audio’s currentTime changes, store it
    localStorage.setItem(STORAGE_KEYS.CURRENT_TIME, audio.currentTime.toString());
    updateProgressBar();
  });

  // When user pauses, record that so we don’t auto‐play next page load
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

  // On unload, save everything one more time
  window.addEventListener('beforeunload', () => {
    localStorage.setItem(STORAGE_KEYS.CURRENT_TIME, audio.currentTime.toString());
    localStorage.setItem(STORAGE_KEYS.IS_PAUSED, audio.paused.toString());
    localStorage.setItem(STORAGE_KEYS.TRACK_INDEX, currentTrackIndex.toString());
  });
  // ─── Safe Autoplay Integration Ends Here ───


  // ======== 5. Read metadata (title, artist, album art) for all tracks ========
  // (unchanged except for using trackFiles rather than trackURLs)
  const trackMeta = trackFiles.map(() => ({
    title: 'Loading...',
    artist: '',
    pictureDataURL: '' // fallback blank
  }));

// === 0) Trouver la racine du projet ===
// window.location.pathname donne par ex. "/index.html" ou "/Pages/projets.html" en local
// ou "/P2.01-Portfolio/Pages/projets.html" sur GitHub Pages.

let basePath = "";
const pathName = window.location.pathname;

// Si on est sur GitHub Pages (ex. "/P2.01-Portfolio/Pages/projets.html"), 
//   on veut extraire "/P2.01-Portfolio".
if (pathName.includes("/Pages/")) {
  basePath = pathName.split("/Pages/")[0];
} else {
  // Cas local (= pas de “/Pages/” dans l’URL) ou page à la racine (index.html)
  // On retire simplement le dernier segment ("/index.html", ou "/projets.html", etc.)
  const lastSlashIndex = pathName.lastIndexOf("/");
  basePath = pathName.substring(0, lastSlashIndex);
  // Exemple : pathName="/index.html" → lastSlashIndex=0 → basePath=""
  //           pathName="/projets-personnels.html" → lastSlashIndex=0 → basePath=""
  //           pathName="/Pages/test.html" n’arrive pas ici car le if l’attrape avant.
}

// Optionnel : si on veut s’assurer qu’il n’y a pas de slash final, on peut faire
// basePath = basePath.replace(/\/$/, "");
// Mais dans nos exemples, basePath vaut "" ou "/P2.01-Portfolio", sans slash en fin.

// Pour vérifier : 
console.log("🚀 basePath déterminé = ", basePath);


  // === Boucle de lecture des tags ===
trackFiles.forEach((filename, idx) => {
  // Construire l’URL finale vers Music/<filename>
  //  → window.location.origin   = "http://127.0.0.1:5500" ou "https://malevolentmoksi.github.io"
  //  → basePath                 = "" (local) ou "/P2.01-Portfolio" (GitHub)
  //  → on ajoute "/Music/" + filename
  const absoluteURL = window.location.origin + basePath + "/Music/" + filename;

  // Affiche dans la console pour debug
  console.log(`🔍 Lecture tags pour ${filename} à l’adresse →`, absoluteURL);

  new jsmediatags.Reader(absoluteURL)
    .setTagsToRead(["title", "artist", "picture"])
    .read({
      onSuccess: tag => {
        console.log(`✅ jsmediatags tags pour ${filename}:`, tag.tags);

        // Titre (fallback sur filename)
        trackMeta[idx].title = tag.tags.title || filename;
        trackMeta[idx].artist = tag.tags.artist || "";

        // Extraction et conversion de la pochette en DataURL
        if (tag.tags.picture) {
          const { data, format } = tag.tags.picture;
          let binary = "";
          data.forEach(byte => {
            binary += String.fromCharCode(byte);
          });
          const base64String = window.btoa(binary);
          trackMeta[idx].pictureDataURL = `data:${format};base64,${base64String}`;
        } else {
          trackMeta[idx].pictureDataURL = "";
        }

        // Si c’est la piste en cours, on affiche immédiatement
        if (idx === currentTrackIndex) {
          updateTrackInfoDisplay();  // votre fonction existante pour titre/artiste
          updateAlbumArtDisplay();   // voir juste après
        }
      },
      onError: error => {
        console.warn(`❌ jsmediatags error pour ${absoluteURL}:`, error);
        trackMeta[idx].title = filename;
        trackMeta[idx].artist = "";
        trackMeta[idx].pictureDataURL = "";
        if (idx === currentTrackIndex) {
          updateTrackInfoDisplay();
          updateAlbumArtDisplay();
        }
      }
    });
});

  // ======== 6. Build & insert the player’s HTML structure ========
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

  // ======== 7. Functions to update UI elements ========
  function updateTrackInfoDisplay() {
    const meta = trackMeta[currentTrackIndex];
    titleEl.textContent = meta.title || trackFiles[currentTrackIndex];
    artistEl.textContent = meta.artist;
    if (meta.pictureDataURL) {
      albumArtEl.src = meta.pictureDataURL;
    } else {
      albumArtEl.src = '';
    }

    // Check if we need to scroll title/artist (overflow) …
    applyScrollIfOverflow(titleEl);
    applyScrollIfOverflow(artistEl);
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

  // ======== 8. Handle user interactions ========
    playPauseBtn.addEventListener('click', () => {
    if (audio.paused) {
      audio.play().then(() => {
        audio.muted = false;
      }).catch(() => {
        // If still blocked, we leave it paused and wait for a click.
      });
    } else {
      // Mark as paused immediately so the document-level click handler
      // doesn't auto-resume the playback before the "pause" event fires
      isPaused = true;
      localStorage.setItem(STORAGE_KEYS.IS_PAUSED, 'true');
      audio.pause();
    }
  });

  nextBtn.addEventListener('click', () => {
    switchToNextTrack();
  });

  // ======== 9. Switch to next track logic ========
  function switchToNextTrack() {
    // Advance index
    currentTrackIndex = (currentTrackIndex + 1) % trackURLs.length;
    localStorage.setItem(STORAGE_KEYS.TRACK_INDEX, currentTrackIndex.toString());

    // Reset savedTime for new track
    savedTime = 0;
    localStorage.setItem(STORAGE_KEYS.CURRENT_TIME, '0');

    // Change audio source and load
    audio.src = trackURLs[currentTrackIndex];
    // Keep muted-while-loading if user had not paused
    if (!isPaused) {
      audio.muted = true;
    }
    updateTrackInfoDisplay();
    updatePlayPauseButton();

    // If user was playing before switching, autostart (muted), then unmute
    if (!isPaused) {
      audio
        .play()
        .then(() => {
          setTimeout(() => {
            audio.muted = false;
          }, 150);
        })
        .catch(() => {
          // Will wait for next click if blocked
        });
    }
  }

  // ======== 10. Scrolling overflow helper ========
  function applyScrollIfOverflow(spanEl) {
    const container = spanEl.parentElement;
    spanEl.classList.remove('scrolling');
    spanEl.style.removeProperty('--scroll-distance');
    window.requestAnimationFrame(() => {
      const scrollW = spanEl.scrollWidth;
      const clientW = container.clientWidth;
      if (scrollW > clientW + 1) {
        const distance = scrollW - clientW;
        spanEl.style.setProperty('--scroll-distance', distance + 'px');
        spanEl.classList.add('scrolling');
      }
    });
  }

  // ======== 11. Initialize display once ========
  updateTrackInfoDisplay();
  updatePlayPauseButton();
  updateProgressBar();

  // --------------------------
// Return‐to‐Top Button Logic
// --------------------------
const backToTopBtn = document.getElementById('back-to-top');
if (backToTopBtn) {
  // On scroll: toggle classes + inline display
  window.addEventListener('scroll', () => {
    if (window.scrollY > 100) {
      if (!backToTopBtn.classList.contains('show')) {
        backToTopBtn.classList.remove('hide');
        backToTopBtn.style.display = 'block';   // ← clear any previous inline "display:none"
        backToTopBtn.classList.add('show');
      }
    } else {
      if (backToTopBtn.classList.contains('show')) {
        backToTopBtn.classList.remove('show');
        backToTopBtn.classList.add('hide');
        // After the fade‐out transition, hide it completely
        setTimeout(() => {
          if (backToTopBtn.classList.contains('hide')) {
            backToTopBtn.style.display = 'none';
          }
        }, 300); // must match your CSS transition duration
      }
    }
  });

  // On click: scroll smoothly to top
  backToTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // If page loads already scrolled down, make sure the button is visible
  if (window.scrollY > 100) {
    backToTopBtn.style.display = 'block';
    backToTopBtn.classList.add('show');
  }
}
// --------------------------
// End Return‐to‐Top Button Logic
// --------------------------

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


