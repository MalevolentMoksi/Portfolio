# Portfolio Archive - Legacy HTML Pages

## Overview

This directory contains the original portfolio website built with pure **HTML, CSS, and JavaScript** (no framework dependencies). This is a snapshot of the portfolio before it was migrated to a React SPA.

## How to Use

### Opening the Portfolio Locally

You have two options:

#### Option 1: Direct File Opening (Quick & Simple)
1. Open `index.html` in your web browser
   - **Windows**: Right-click `index.html` → "Open with" → your browser
   - **Mac/Linux**: Double-click `index.html` or drag it to your browser
   
This works for basic viewing but note:
- Music player may not work due to browser cross-origin restrictions
- Some JavaScript features may have limited functionality

#### Option 2: Local Web Server (Recommended)
To avoid browser security issues and experience the full functionality:

```bash
# Using Python 3
python -m http.server 8000

# Using Python 2
python -m SimpleHTTPServer 8000

# Using Node.js (if installed)
npx http-server

# Using Ruby
ruby -run -ehttpd . -p8000
```

Then open: **`http://localhost:8000`**

## Directory Structure

```
old-pages/
├── index.html                    # Landing page / Home
├── projets.html                  # Academic projects listing
├── projets-personnels.html       # Personal projects listing
├── projet-MEGASAE.html          # Project detail: Banquet Management App
├── projet-SAE12.html            # Project detail: Algorithm comparison
├── projet-SAE3.html             # Project detail: Linux Setup
├── projet-SAE4.html             # Project detail: (Project 4)
├── projet-SAE56.html            # Project detail: Web Development
│
├── style.css                     # All styling (golden theme, animations)
├── script.js                     # All JavaScript (music player, effects, UI)
│
├── Images/                       # All portfolio images
│   ├── drawings/               # Hand-drawn sketches
│   ├── *.webp, *.jpg, *.png   # Project screenshots
│   └── favicon.svg
│
├── Music/                        # Background music tracks
│   ├── deepstone.m4a
│   ├── browser.m4a
│   └── wildriver.m4a
│
└── Pages/                        # (Legacy directory - nested page versions)
    └── (Contains duplicate structure from older build)
```

## Features Included

### Visual Effects
- **Particle.js animation** - Gold particles in the background
- **Parallax scrolling** - Background image depth effect
- **Typing animation** - Main title text appears letter-by-letter
- **Email glitch effect** - Animated text glitch on email/contact
- **Cursor trail** - Visual feedback for mouse movement

### Music Player
- **Persistent player** - Continues playing across page navigation
- **3 background tracks** - Deepstone, Browser, Wildriver (M4A format)
- **LocalStorage** - Remembers play state, current track, and playback time
- **Track switching** - Click to change background music
- **Volume control** - Adjust playback volume

### Interactive UI
- **Back-to-top button** - Appears when scrolled down
- **Responsive gallery** - Images with lightbox zoom effect
- **Smooth animations** - Fade-ins and transitions throughout
- **Dark golden theme** - Accessibility-friendly dark mode with gold accents (#d4af37)

### Navigation
- **Simple menu** - Home, Academic Projects, Personal Projects
- **Project links** - Click "En savoir plus" to view detailed project pages
- **Footer links** - GitHub, Email, GitLab profile links
- **Live clock** - Footer displays current time

## Browser Compatibility

Works on all modern browsers:
- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers

**Important**: 
- Some browsers may block autoplay of audio (especially muted)
- First page load may require a click to start the music player
- External CDN resources (icons, fonts) require internet connection

## What's Different from the React Version?

This version is **NOT** the current portfolio. Improvements since then:

| Feature | HTML/CSS/JS | React Version |
|---------|-------------|---------------|
| **Architecture** | Traditional | Single-Page App (SPA) |
| **Page Loading** | Full reload | Instant (client-side routing) |
| **Bundle Size** | Lightweight | Larger (React framework) |
| **Development** | Static files | Component-based |
| **Build Process** | None needed | Vite build required |
| **Module System** | Plain JS | ES6 Modules + React Hooks |

## Notes

- **Asset Paths**: All paths are relative (working from file:// or http://)
- **External Dependencies**: Loads particles.js and jsmediatags from CDN
- **No Build Required**: Ready to use immediately - no npm install needed
- **Archive Status**: This is a historical snapshot; the current version is in React

## Troubleshooting

### Music not playing?
- Ensure you're using a local web server (not direct file:// opening)
- Check browser console for CORS errors
- Try clicking anywhere on the page to trigger autoplay

### Images not loading?
- Verify `Images/` folder contains the image files
- Check browser console for 404 errors
- Ensure you're in the correct directory

### Styling looks broken?
- Verify `style.css` is in the root directory
- Check browser cache (Ctrl+Shift+R to hard refresh)
- Open console to check for CSS loading errors

---

**Created**: February 2026  
**Language**: French (content) + English (this README)  
**Portfolio Owner**: Enzo Morello
