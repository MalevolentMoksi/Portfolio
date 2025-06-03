// This script handles the sticky header and back-to-top button functionality, as well as the animation of blocks when they come into view.
document.addEventListener('DOMContentLoaded', function() {
    const header = document.querySelector('header');
    const backToTopBtn = document.getElementById('back-to-top');
    
    window.addEventListener('scroll', () => {
      if (window.scrollY > 100) {
        header.classList.add('sticky');
        backToTopBtn.style.display = 'block';
      } else {
        header.classList.remove('sticky');
        backToTopBtn.style.display = 'none';
      }
    });
    
    backToTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
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

// Parallax on the full-screen background image
const bg = document.getElementById('background');
if (bg) {
  // target offsets and current positions
  let mouseX = 0, mouseY = 0, posX = 0, posY = 0;
  const friction = 1 / 10;      // lower = slower, more easing
  const depth = 0.02;           // motion multiplier

  // track cursor displacement relative to center
  window.addEventListener('mousemove', e => {
    const x = e.clientX - window.innerWidth  / 2;
    const y = e.clientY - window.innerHeight / 2;
    mouseX = x * depth;
    mouseY = y * depth;
  });

  // smooth-step each frame
  function updateParallax() {
    posX += (mouseX - posX) * friction;
    posY += (mouseY - posY) * friction;
    bg.style.transform = `scale(1.1) translate(${posX}px, ${posY}px)`;
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
  const INTERVAL     = 400;            // ms entre 2 frames

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
      video.play().catch(_ => {});
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
