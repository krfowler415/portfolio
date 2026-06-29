/* =====================================================================
 * § 1  THEME SYSTEM
 * ──────────────────────────────────────────────────────────────────── */

function applyTheme(theme, shouldSave = true) {
    document.documentElement.setAttribute('data-theme', theme);

    if (shouldSave) {
      localStorage.setItem('kf-theme', theme);
    }

    const isLight = theme === 'light';

    // Update toggle button attributes
    const themeToggle = document.querySelector('.theme-toggle');
    if (themeToggle) {
        themeToggle.setAttribute('aria-pressed', String(!isLight));
        themeToggle.setAttribute(
          'aria-label',
          isLight ? 'Switch to dark theme' : 'Switch to light theme'
        );
    }

    // Swap terrain and favicon when theme changes
    swapTerrain(theme);
    swapFavicon(theme);
}

function getCurrentTheme() {
  return document.documentElement.getAttribute('data-theme') || 'dark';
}

// Initialize theme on load
document.addEventListener('DOMContentLoaded', () => {
  applyTheme(getCurrentTheme(), false);
});

/* ── Theme Toggle Event Listener ──────────────────────────────────── */
const systemTheme = window.matchMedia('(prefers-color-scheme: dark)');
systemTheme.addEventListener('change', event => {
  const savedTheme = localStorage.getItem('kf-theme');

  if (!savedTheme) {
    const newTheme = event.matches ? 'light' : 'dark';
    applyTheme(newTheme, false);
    swapTerrain(newTheme);
    swapFavicon(newTheme);
  }
});

/* =====================================================================
 * § 2  THEME WIPE ANIMATION
 * ──────────────────────────────────────────────────────────────────── */

let wipeIsActive = false;

function playThemeWipe(nextTheme, onMidpoint) {
  if (wipeIsActive) return;
  wipeIsActive = true;

  const svgEl = document.querySelector('.shape-overlays');
  const paths = document.querySelectorAll('.shape-overlays__path');

  if (!svgEl || paths.length === 0) {
    onMidpoint();
    wipeIsActive = false;
    return;
  }

  /* ── Update gradient colours for incoming theme ── */
  const stops = {
    stop1a: document.querySelector('.wipe-stop1a'),
    stop1b: document.querySelector('.wipe-stop1b'),
    stop2a: document.querySelector('.wipe-stop2a'),
    stop2b: document.querySelector('.wipe-stop2b'),
  };

  // Update gradient stops with new theme colors
  Object.values(stops).forEach(stop => {
    if (stop) {
      stop.style.background = nextTheme === 'light' 
        ? '#5F259F38' 
        : '#0AC39A22';
    }
  });

  // Animate wipe paths with GSAP
  const tl = gsap.timeline({ onComplete: () => { wipeIsActive = false; } });
  
  tl.to(paths, {
    attr: { d: 'M0,0 L100%,0' }, // Placeholder - replace with actual path animation
    duration: 1.5,
    ease: 'power2.inOut'
  })
  .to(paths, {
    opacity: 0,
    duration: 0.3
  });

  onMidpoint();
}

/* =====================================================================
 * § 3  VIEWPORT & CANVAS HANDLERS
 * ──────────────────────────────────────────────────────────────────── */

function setViewportHeight() {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
  
  // Update terrain dimensions for automatic adjustment
  document.documentElement.style.setProperty('--terrain-width', '116vw');
  document.documentElement.style.setProperty('--terrain-bottom', '-6vh');
}

function resizeCanvas() {
  const canvas = document.querySelector('#stars');
  if (canvas) {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
}

function initStarField() {
  // Initialize star particle system
  const canvas = document.querySelector('#stars');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  
  // Create stars array
  const stars = [];
  for (let i = 0; i < 100; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 2 + 1,
      opacity: Math.random() * 0.5 + 0.3
    });
  }

  // Animation loop
  function animateStars() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    stars.forEach(star => {
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
      ctx.fill();
    });

    requestAnimationFrame(animateStars);
  }

  animateStars();
}

/* =====================================================================
 * § 4  RESIZE & ORIENTATION HANDLERS
 * ──────────────────────────────────────────────────────────────────── */

function initResizeHandlers() {
  window.addEventListener('resize', () => {
    setViewportHeight();
    resizeCanvas();
    initStarField();
    ScrollTrigger.refresh();
  });

  window.addEventListener('orientationchange', () => {
    setTimeout(() => {
      setViewportHeight();
      resizeCanvas();
      initStarField();
      ScrollTrigger.refresh();
    }, 100);
  });
}

/* =====================================================================
 * § 5  SCROLL TRIGGERS & ANIMATIONS
 * ──────────────────────────────────────────────────────────────────── */

function initBeamUp() {
  const beamUp = document.getElementById('beamUp');
  const beamStreak = document.getElementById('beam-streak');
  const beamFlash = document.getElementById('beam-flash');

  if (!beamUp) return;

  ScrollTrigger.create({
    trigger: '#hero',
    start: 'top+=69% top',
    onEnter: () => beamUp.classList.add('visible'),
    onLeaveBack: () => beamUp.classList.remove('visible'),
  });
}

/* =====================================================================
 * § 6  CASE STUDY STRIP (Horizontal Scroll)
 * ──────────────────────────────────────────────────────────────────── */

function initCaseStudyStrip() {
  const strip = document.getElementById('csStrip');
  const progress = document.getElementById('csProgress');
  const prevBtn = document.getElementById('csPrev');
  const nextBtn = document.getElementById('csNext');

  if (!strip) return;

  const getCardWidth = () => (strip.querySelector('.cs-card')?.offsetWidth || 0) + 24;

  let snapTimeout;
  let isSnapping = false;

  strip.addEventListener('scroll', () => {
    const max = strip.scrollWidth - strip.clientWidth;
    if (progress) {
      progress.style.width = (max > 0 ? (strip.scrollLeft / max) * 100 : 0) + '%';
    }

    if (!isSnapping) {
      clearTimeout(snapTimeout);
      snapTimeout = setTimeout(() => {
        const cardWidth = getCardWidth();
        if (!cardWidth) return;
        isSnapping = true;
        strip.scrollTo({ 
          left: Math.round(strip.scrollLeft / cardWidth) * cardWidth, 
          behavior: 'smooth' 
        });
        setTimeout(() => { isSnapping = false; }, 500);
      }, 150);
    }
  }, { passive: true });

  // Mouse drag support
  let isDown = false;
  let startX = 0;
  let scrollLeft = 0;
  let hasDragged = false;

  strip.addEventListener('mousedown', e => {
    e.preventDefault();
    isDown = true;
    hasDragged = false;
    startX = e.pageX - strip.offsetLeft;
    scrollLeft = strip.scrollLeft;
  });

  strip.addEventListener('mouseleave', () => { isDown = false; });
  
  strip.addEventListener('mouseup', () => { isDown = false; });

  strip.addEventListener('mousemove', e => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - strip.offsetLeft;
    const walk = (x - startX) * 2; // Scroll speed
    strip.scrollLeft = scrollLeft + walk;
  });

  prevBtn?.addEventListener('click', () => {
    const cardWidth = getCardWidth();
    if (!cardWidth) return;
    strip.scrollTo({ 
      left: Math.max(0, strip.scrollLeft - cardWidth), 
      behavior: 'smooth' 
    });
  });

  nextBtn?.addEventListener('click', () => {
    const cardWidth = getCardWidth();
    if (!cardWidth) return;
    strip.scrollTo({ 
      left: Math.min(strip.scrollWidth - strip.clientWidth, strip.scrollLeft + cardWidth), 
      behavior: 'smooth' 
    });
  });
}

/* =====================================================================
 * § 7  INITIALIZATION ORDER (Run After DOM Ready)
 * ──────────────────────────────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', () => {
  
  /* ── 1. Theme System ──────────────────────────────────────── */
  applyTheme(getCurrentTheme(), false);
  
  systemTheme.addEventListener('change', event => {
    const savedTheme = localStorage.getItem('kf-theme');

    if (!savedTheme) {
      const newTheme = event.matches ? 'light' : 'dark';
      applyTheme(newTheme, false);
      swapTerrain(newTheme);
      swapFavicon(newTheme);
    }
  });

  /* ── 2. Resize & Orientation Handlers ─────────────────────── */
  initResizeHandlers();

  /* ── 3. Scroll Triggers (After Viewport Height is Stable) ──── */
  initBeamUp();
  initCaseStudyStrip();

  /* ── 4. Theme Wipe Animation Setup ────────────────────────── */
  // Attach to theme toggle click event
  const themeToggle = document.querySelector('.theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const currentTheme = getCurrentTheme();
      const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';

      themeToggle.setAttribute('aria-pressed', nextTheme === 'dark' ? 'true' : 'false');

      playThemeWipe(nextTheme, () => {
        applyTheme(nextTheme);
        swapTerrain(nextTheme);
        swapFavicon(nextTheme);
      });
    });
  }

});

/* =====================================================================
 * § 8  UTILITY FUNCTIONS (Swap Terrain & Favicon)
 * ──────────────────────────────────────────────────────────────────── */

function swapTerrain(theme) {
  const terrainDark = document.querySelector('.terrain-img--dark');
  const terrainLight = document.querySelector('.terrain-img--light');

  if (!terrainDark || !terrainLight) return;

  if (theme === 'light') {
    terrainDark.style.opacity = '0';
    terrainLight.style.opacity = '1';
  } else {
    terrainDark.style.opacity = '1';
    terrainLight.style.opacity = '0';
  }
}

function swapFavicon(theme) {
  const faviconDark = document.querySelector('link[rel="icon"][href*="dark"]');
  const faviconLight = document.querySelector('link[rel="icon"][href*="light"]');

  if (!faviconDark || !faviconLight) return;

  if (theme === 'light') {
    faviconDark.setAttribute('disabled', '');
    faviconLight.removeAttribute('disabled');
  } else {
    faviconLight.setAttribute('disabled', '');
    faviconDark.removeAttribute('disabled');
  }
}
