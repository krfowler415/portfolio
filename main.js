/**
 * =====================================================================
 *  SONORAN COSMOS — MAIN.JS
 *  Kevin Fowler | UX Portfolio | krfowler415.github.io/portfolio
 * =====================================================================
 *
 *  Dependencies: GSAP 3.12.5 + ScrollTrigger (CDN)
 *
 *  Architecture: Each feature is an isolated init function.
 *  All init functions are called from the Boot Sequence (§ 14).
 *  Execution order in the boot sequence is intentional — see § 14.
 *
 *  FILE STRUCTURE
 *  ─────────────────────────────────────────────────────────────────
 *  § 1   Constants & DOM References
 *  § 2   Viewport Height
 *  § 3   Intro Overlay
 *  § 4   Star Field Canvas
 *  § 5   Terrain Image Loading
 *  § 6   UFO Scroll Animation
 *  § 7   Navigation
 *  § 8   Custom Cursor
 *  § 9   Click Ripple
 *  § 10  Case Study Strip
 *  § 11  Scroll Reveal
 *  § 12  Card Tilt
 *  § 13  Resize & Orientation Handlers
 *  § 14  Beam Me Up
 *  § 15  Boot Sequence
 * =====================================================================
 */


/* =====================================================================
 * § 1  CONSTANTS & DOM REFERENCES
 * ===================================================================== */

const isTouchDevice = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const introX   = window.innerWidth / 2 - 100;
const introY   = window.innerHeight * 0.12;
const introXvw = (introX / window.innerWidth) * 100;
const introYvh = 12;

let ufoIntroComplete = false;
let minTimeDone      = false;
let assetsDone       = false;
let introFired       = false;
let scanTween        = null;

const heroUfo        = document.getElementById('heroUfo');
const ufoBeam        = document.getElementById('ufoBeam');
const heroPin        = document.querySelector('.hero-pin');
const introEl        = document.getElementById('intro');
const introWrap      = document.getElementById('intro-ufo-wrap');
const iBeam          = document.getElementById('iBeam');
const iScan          = document.getElementById('iScan');
const introPts       = document.getElementById('intro-pts');
const introGlow      = document.getElementById('intro-glow');
const introScanlines = document.getElementById('intro-scanlines');


/* =====================================================================
 * § 2  VIEWPORT HEIGHT
 * ===================================================================== */

function setViewportHeight() {
  document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
}


/* =====================================================================
 * § 3  INTRO OVERLAY
 * ===================================================================== */

function spawnParticles(count, speedMult) {
  for (let i = 0; i < count; i++) {
    const pt    = document.createElement('div');
    pt.className = 'ipt';

    const size  = 1.5 + Math.random() * 4;
    const left  = 5   + Math.random() * 90;
    const btm   = 2   + Math.random() * 85;
    const dur   = (1.4 + Math.random() * 2.2) / speedMult;
    const delay = (Math.random() * 2.5) / speedMult;
    const drift = (Math.random() - 0.5) * 60;
    const rise  = 70  + Math.random() * 30;

    pt.style.cssText = [
      `width:${size}px`,
      `height:${size}px`,
      `left:${left}%`,
      `bottom:${btm}%`,
      `animation-duration:${dur}s`,
      `animation-delay:-${delay}s`,
      `--drift:${drift}px`,
      `--rise:-${rise}vh`
    ].join(';');

    introPts.appendChild(pt);
  }
}

function runScan() {
  scanTween = gsap.fromTo(
    iScan,
    { attr: { y1: 38, y2: 38 }, opacity: 0.9 },
    { attr: { y1: 560, y2: 560 }, opacity: 0, duration: 1.8, ease: 'power1.in', onComplete: runScan }
  );
}

function tryStartOutro() {
  if (minTimeDone && assetsDone && !introFired) {
    introFired = true;
    playIntroOutro();
  }
}

function playIntroOutro() {
  if (scanTween) scanTween.kill();
  gsap.killTweensOf(introWrap);
  gsap.set(introWrap, { transformOrigin: '50% 48%' });
  gsap.set(iScan, { opacity: 0 });

  const flash = document.getElementById('intro-flash');

  spawnParticles(90, 6);

  const tl = gsap.timeline({
    onComplete() {
      document.body.style.overflow = '';
      ScrollTrigger.refresh();
    }
  });

  tl
    .to(iBeam, { opacity: 1, duration: 0.2, ease: 'power2.in' })
    .to(introEl, {
      keyframes: [
        { x: -5, y: -2, duration: 0.06 },
        { x:  4, y:  3, duration: 0.06 },
        { x: -6, y: -1, duration: 0.06 },
        { x:  5, y:  2, duration: 0.06 },
        { x: -3, y: -3, duration: 0.06 },
        { x:  0, y:  0, duration: 0.06 },
      ]
    }, '+=0.05')
    .to(introWrap, { scale: 4.2, duration: 0.75, ease: 'power3.in' })
    .to(introGlow, { opacity: 0.95, duration: 0.3 }, '<')
    .to(introEl, {
      keyframes: [
        { x: -7,  skewX:  2, filter: 'hue-rotate(90deg) saturate(4) brightness(1.7)',  duration: 0.07 },
        { x:  10, skewX: -3, filter: 'hue-rotate(210deg) saturate(3) brightness(0.6)', duration: 0.07 },
        { x: -5,  skewX:  1, filter: 'hue-rotate(320deg) saturate(5) brightness(2.1)', duration: 0.06 },
        { x:  12, skewX: -2, filter: 'hue-rotate(50deg) saturate(4) brightness(1.4)',  duration: 0.06 },
        { x: -9,  skewX:  3, filter: 'hue-rotate(175deg) saturate(3) brightness(0.5)', duration: 0.07 },
        { x:  7,  skewX: -1, filter: 'hue-rotate(270deg) saturate(6) brightness(2.3)', duration: 0.06 },
        { x: -4,  skewX:  1, filter: 'hue-rotate(90deg) saturate(3) brightness(1.6)',  duration: 0.06 },
        { x:  0,  skewX:  0, filter: 'none',                                           duration: 0.06 },
      ]
    })
    .to(introScanlines, { opacity: 1, duration: 0.04 }, '<')
    .to(introScanlines, { opacity: 0, duration: 0.18 }, '>')
    .to(flash, { opacity: 1, duration: 0.1 })
    .add(() => {
      introEl.style.display = 'none';
      gsap.set(heroUfo, { x: introX, y: introY, opacity: 1, force3D: false });
    })
    .to(flash, {
      opacity: 0,
      duration: 1.1,
      ease: 'power2.out',
      onComplete: () => {
        ufoIntroComplete = true;
        sessionStorage.setItem('introPlayed', 'true');
      }
    }, '+=0.05');
}

function initIntro() {
  if (document.documentElement.getAttribute('data-theme') === 'light') {
    if (introEl) introEl.style.display = 'none';
    ufoIntroComplete = true;
    return;
  }

  if (sessionStorage.getItem('introPlayed')) {
    introEl.style.display = 'none';
    gsap.set(heroUfo, { x: introX, y: introY, opacity: 1, force3D: false });
    ufoIntroComplete = true;
    return;
  }

  if (reducedMotion) {
    introEl.style.display = 'none';
    gsap.set(heroUfo, { x: introX, y: introY, opacity: 1, force3D: false });
    ufoIntroComplete = true;
    return;
  }

  document.body.style.overflow = 'hidden';

  gsap.set(heroUfo, { x: introX, y: -200, opacity: 0, force3D: false });

  gsap.set(introWrap, { opacity: 1 });
  gsap.to(introWrap, { y: -10, duration: 2.2, ease: 'sine.inOut', repeat: -1, yoyo: true });

  gsap.to(iBeam,     { opacity: 1, duration: 0.65, ease: 'power2.out', delay: 0.4 });
  gsap.to(introGlow, { opacity: 1, duration: 0.9, delay: 0.4 });
  gsap.to(iBeam,     { opacity: 0.65, duration: 1.4, ease: 'sine.inOut', repeat: -1, yoyo: true, delay: 1.1 });

  setTimeout(() => runScan(), 400);

  spawnParticles(35, 1);

  setTimeout(() => {
    if (introFired) return;
    spawnParticles(55, 2.5);
    gsap.to(introGlow, { opacity: 0.8, duration: 1.2 });
  }, 1200);

  setTimeout(() => { minTimeDone = true; tryStartOutro(); }, 2800);
}


/* =====================================================================
 * § 4  STAR FIELD CANVAS
 * ===================================================================== */

const canvas = document.getElementById('stars');
const ctx    = canvas.getContext('2d');

let canvasW, canvasH;
let stars    = [];
let mousePos = { x: -9999, y: -9999 };

const STAR_COUNT = 380;

function resizeCanvas() {
  canvasW = canvas.width  = canvas.offsetWidth;
  canvasH = canvas.height = canvas.offsetHeight;
}

function randomStarHue() {
  const r = Math.random();
  if (r < 0.45) return 183 + (Math.random() - 0.5) * 14;
  if (r < 0.90) return 268 + (Math.random() - 0.5) * 18;
  return 22 + (Math.random() - 0.5) * 12;
}

function initStarField() {
  stars = Array.from({ length: STAR_COUNT }, () => ({
    x:     Math.random() * canvasW,
    y:     Math.random() * canvasH,
    vx:    (Math.random() - 0.5) * 0.3,
    vy:    (Math.random() - 0.5) * 0.3,
    r:     1.5 + Math.random() * 2.5,
    phase: Math.random() * Math.PI * 2,
    speed: 0.4 + Math.random() * 0.6,
    hue:   randomStarHue(),
  }));
}

function drawStars() {
  ctx.clearRect(0, 0, canvasW, canvasH);

  stars.forEach(star => {
    const dx   = star.x - mousePos.x;
    const dy   = star.y - mousePos.y;
    const dist = Math.hypot(dx, dy);

    if (dist < 700 && dist > 0) {
      const force = ((700 - dist) / 700) * 0.3;
      star.vx += (dx / dist) * force;
      star.vy += (dy / dist) * force;
    }

    star.vx = star.vx * 0.96 + (Math.random() - 0.5) * 0.1;
    star.vy = star.vy * 0.96 + (Math.random() - 0.5) * 0.1;

    star.x += star.vx;
    star.y += star.vy;

    if (star.x < -10 || star.x > canvasW + 10 || star.y < -10 || star.y > canvasH + 10) {
      star.x  = Math.random() * canvasW;
      star.y  = Math.random() * canvasH;
      star.vx = (Math.random() - 0.5) * 0.3;
      star.vy = (Math.random() - 0.5) * 0.3;
    }

    star.phase += star.speed * 0.02;
    const pulse = 0.2 + Math.abs(Math.sin(star.phase)) * 0.75;

    const glow = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, star.r * 4);
    glow.addColorStop(0, `hsla(${star.hue}, 80%, 70%, ${(pulse * 0.5).toFixed(3)})`);
    glow.addColorStop(1, `hsla(${star.hue}, 80%, 70%, 0)`);
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.r * 4, 0, Math.PI * 2);
    ctx.fillStyle = glow;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
    ctx.fillStyle = `hsla(${star.hue}, 90%, 80%, ${pulse.toFixed(3)})`;
    ctx.fill();
  });

  requestAnimationFrame(drawStars);
}

function initStars() {
  resizeCanvas();
  initStarField();
  requestAnimationFrame(drawStars);

  if (!isTouchDevice) {
    heroPin.addEventListener('mousemove', e => {
      const rect = canvas.getBoundingClientRect();
      mousePos.x = e.clientX - rect.left;
      mousePos.y = e.clientY - rect.top;
    });
    heroPin.addEventListener('mouseleave', () => {
      mousePos.x = -9999;
      mousePos.y = -9999;
    });
  }
}


/* =====================================================================
 * § 5  TERRAIN IMAGE LOADING
 * ===================================================================== */

function fetchTerrain() {
  const terrainImages = Array.from(document.querySelectorAll('.terrain-img'));

  if (!terrainImages.length) {
    assetsDone = true;
    tryStartOutro();
    return;
  }

  let pending = terrainImages.length;
  let finished = false;

  function finishTerrainLoad() {
    if (finished) return;
    finished = true;

    assetsDone = true;
    tryStartOutro();
    ScrollTrigger.refresh();
  }

  function markSettled() {
    pending -= 1;

    if (pending <= 0) {
      finishTerrainLoad();
    }
  }

  terrainImages.forEach(img => {
    if (img.complete) {
      markSettled();
      return;
    }

    img.addEventListener('load', markSettled, { once: true });
    img.addEventListener('error', markSettled, { once: true });
  });

  /* Safety fallback: do not let the intro hang forever if an image is slow. */
  setTimeout(finishTerrainLoad, 1600);
}

function initTerrainParallax() {
  const hero = document.getElementById('hero');
  const heroTerrain = document.getElementById('heroTerrain');
  const terrainStage = document.querySelector('#heroTerrain .terrain-stage');

  if (!hero || !heroTerrain || !terrainStage || reducedMotion) return;

  const getOverscan = () => {
    const value = getComputedStyle(heroTerrain)
      .getPropertyValue('--terrain-parallax-overscan')
      .trim();

    return parseFloat(value) || 120;
  };

  // Terrain rises as the user scrolls through the hero
  gsap.fromTo(
    terrainStage,
    { y: 0 },
    {
      /*
      * Move only part of the hidden overscan.
      * This keeps the PNG's bottom edge below the hero,
      * so the hard cut line does not appear.
      */
      y: () => -getOverscan() * 0.75,
      ease: 'none',
      scrollTrigger: {
        trigger: hero,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 0.25,
        invalidateOnRefresh: true
      }
    }
  );
}

function initHeroScrollCue() {
  const cue = document.getElementById('heroScrollCue');
  const hero = document.getElementById('hero');

  if (!cue || !hero) return;

  const updateCue = () => {
    cue.classList.toggle('is-hidden', window.scrollY > 8);
  };

  cue.addEventListener('click', () => {
    window.scrollTo({
      top: Math.min(window.innerHeight * 0.85, hero.offsetHeight),
      behavior: reducedMotion ? 'auto' : 'smooth'
    });
  });

  updateCue();
  window.addEventListener('scroll', updateCue, { passive: true });
}

/* =====================================================================
 * § 6  UFO SCROLL ANIMATION
 * ===================================================================== */

const ufoWaypoints = [
  // Intro handoff
  [0.00, introXvw,       introYvh    ],
  [0.05, introXvw - 4,   introYvh + 2],
  [0.10, 42, 16],

  // Small left-to-right hover path, about 10% screen width total
  [0.15, 36, 18],
  [0.20, 30, 20],
  [0.25, 33, 22],
  [0.30, 36, 24],
  [0.35, 39, 26],
  [0.40, 42, 28],
  [0.45, 40, 30],

  // Beam position
  [0.50, 39, 33],

  // Beam descent — straight down, x stays locked at 38
  [0.55, 38, 36],
  [0.60, 38, 39],
  [0.65, 38, 42],
  [0.70, 38, 44],
  [0.75, 38, 48],
  [0.80, 38, 50],
  [0.85, 38, 55],
  [0.90, 38, 60],
  [0.95, 38, 66],
  [1.00, 38, 69],
];

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function getUfoPos(progress) {
  for (let i = 0; i < ufoWaypoints.length - 1; i++) {
    const [p0, x0, y0] = ufoWaypoints[i];
    const [p1, x1, y1] = ufoWaypoints[i + 1];

    if (progress >= p0 && progress <= p1) {
      const t = (progress - p0) / (p1 - p0);

      return {
        x: lerp(x0, x1, t),
        y: lerp(y0, y1, t)
      };
    }
  }

  const last = ufoWaypoints[ufoWaypoints.length - 1];
  return { x: last[1], y: last[2] };
}

function initUfoScroll() {
  if (!heroUfo || !ufoBeam) return;

  ScrollTrigger.create({
    trigger: '#hero',
    start: 'top top',
    end: 'bottom bottom',
    scrub: 0.75,
    onUpdate: self => {
      if (!ufoIntroComplete) return;

      const progress = self.progress;
      const { x, y } = getUfoPos(progress);

      const xPx = (x / 100) * window.innerWidth;

      const aspectRatio = window.innerWidth / window.innerHeight;
      const maxYpct = aspectRatio > 2 ? 0.76 : aspectRatio > 1.6 ? 0.80 : 0.84;
      const yPx         = Math.min((y / 100) * window.innerHeight, maxYpct * window.innerHeight);

      gsap.set(heroUfo, {
        x: xPx,
        y: yPx,
        force3D: true
      });

      const beamProgress = Math.min(Math.max((progress - 0.50) / 0.15, 0), 1);
      ufoBeam.setAttribute('opacity', (beamProgress * 0.85).toFixed(3));

      heroUfo.classList.toggle('hovering', progress >= 0.45);
    }
  });
}


/* =====================================================================
 * § 7  NAVIGATION
 * ===================================================================== */

function initNav() {
  const nav = document.querySelector('nav');

  ScrollTrigger.create({
    trigger: '#hero',
    start: 'top top',
    end: 'bottom bottom',
    scrub: true,
    onUpdate: self => {
      nav.classList.toggle('scrolled', self.progress >= 0.50);
    }
  });
}

// ── Hamburger nav toggle ─────────────────────────────────────────────
const navToggle = document.getElementById('nav-toggle');
const navEl     = document.querySelector('nav');

if (navToggle && navEl) {
  navToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = navEl.classList.toggle('nav-open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });

  document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => {
      navEl.classList.remove('nav-open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });

  document.addEventListener('click', (e) => {
    if (!navEl.contains(e.target)) {
      navEl.classList.remove('nav-open');
      navToggle.setAttribute('aria-expanded', 'false');
    }
  });
}


/* =====================================================================
 * § 8  CUSTOM CURSOR
 * ===================================================================== */

function initCursor() {
  if (isTouchDevice) return;

  const cur = document.getElementById('cur');

  document.addEventListener('mousemove', e => {
    cur.style.left = `${e.clientX}px`;
    cur.style.top  = `${e.clientY}px`;
  });

  document.addEventListener('mousedown', () => document.body.classList.add('clicking'));
  document.addEventListener('mouseup',   () => document.body.classList.remove('clicking'));
}


/* =====================================================================
 * § 9  CLICK RIPPLE
 * ===================================================================== */

function initClickRipple() {
  document.addEventListener('click', e => {
    const ripple = document.createElement('div');

    ripple.style.cssText = [
      'position:fixed',
      'width:10px',
      'height:10px',
      'border-radius:50%',
      'border:1.5px solid var(--accent-aurora)',
      'transform:translate(-50%,-50%) scale(0)',
      'pointer-events:none',
      'z-index:9997',
      `left:${e.clientX}px`,
      `top:${e.clientY}px`,
      'animation:rippleOut 0.6s ease-out forwards'
    ].join(';');

    document.body.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  });
}


/* =====================================================================
 * § 10  CASE STUDY STRIP
 * ===================================================================== */

function animateArrow(btn) {
  btn.classList.add('animate');
  setTimeout(() => btn.classList.remove('animate'), 1600);
}

function smoothScrollTo(strip, target, duration) {
  const start = strip.scrollLeft;
  const dist  = target - start;
  const t0    = performance.now();

  (function step(now) {
    const p = Math.min((now - t0) / duration, 1);
    const e = p < 0.5 ? 2 * p * p : -1 + (4 - 2 * p) * p;
    strip.scrollLeft = start + dist * e;
    if (p < 1) requestAnimationFrame(step);
  })(performance.now());
}

function initCaseStudyStrip() {
  const strip    = document.getElementById('csStrip');
  const progress = document.getElementById('csProgress');
  const prevBtn  = document.getElementById('csPrev');
  const nextBtn  = document.getElementById('csNext');

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
        strip.scrollTo({ left: Math.round(strip.scrollLeft / cardWidth) * cardWidth, behavior: 'smooth' });
        setTimeout(() => { isSnapping = false; }, 500);
      }, 150);
    }
  }, { passive: true });

  let isDown     = false;
  let startX     = 0;
  let scrollLeft = 0;
  let hasDragged = false;

  strip.addEventListener('mousedown', e => {
    e.preventDefault();
    isDown     = true;
    hasDragged = false;
    startX     = e.pageX - strip.offsetLeft;
    scrollLeft = strip.scrollLeft;
  });

  strip.addEventListener('mouseleave', () => { isDown = false; });

  strip.addEventListener('mouseup', () => {
    if (isDown && hasDragged) {
      const cardWidth = getCardWidth();
      const current   = Math.round(scrollLeft / cardWidth);
      const drag      = scrollLeft - strip.scrollLeft;
      let target      = current + (drag > cardWidth * 0.25 ? -1 : drag < -cardWidth * 0.25 ? 1 : 0);
      target          = Math.max(0, Math.min(target, strip.querySelectorAll('.cs-card').length - 1));
      isSnapping = true;
      strip.scrollTo({ left: target * cardWidth, behavior: 'smooth' });
      setTimeout(() => { isSnapping = false; }, 700);
    }
    isDown = false;
  });

  strip.addEventListener('mousemove', e => {
    if (!isDown) return;
    const walk = e.pageX - strip.offsetLeft - startX;
    if (Math.abs(walk) > 5) { hasDragged = true; e.preventDefault(); }
    strip.scrollLeft = scrollLeft - walk * 1.1;
  });

  strip.addEventListener('click', e => {
    if (hasDragged) { e.preventDefault(); e.stopPropagation(); }
  }, true);

  prevBtn?.addEventListener('click', () => {
    animateArrow(prevBtn);
    const target = Math.max(0, (Math.round(strip.scrollLeft / getCardWidth()) - 1) * getCardWidth());
    smoothScrollTo(strip, target, 1000);
  });

  nextBtn?.addEventListener('click', () => {
    animateArrow(nextBtn);
    const target = (Math.round(strip.scrollLeft / getCardWidth()) + 1) * getCardWidth();
    smoothScrollTo(strip, target, 1000);
  });
}


/* =====================================================================
 * § 11  SCROLL REVEAL
 * ===================================================================== */

function initScrollReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => entry.target.classList.add('in'), i * 75);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.07 });

  document.querySelectorAll('.reveal, .reveal-left, .reveal-right')
    .forEach(el => observer.observe(el));
}


/* =====================================================================
 * § 12  CARD TILT
 * ===================================================================== */

function initCardTilt() {
  if (reducedMotion) return;

  document.querySelectorAll('.card-tilt-wrap').forEach(wrap => {
    const inner = wrap.querySelector('.card-feat');
    if (!inner) return;

    wrap.addEventListener('mousemove', e => {
      const rect = wrap.getBoundingClientRect();
      const rx = ((e.clientY - rect.top)  / rect.height - 0.5) * -6;
      const ry = ((e.clientX - rect.left) / rect.width  - 0.5) *  6;
      inner.style.transition = 'transform 0.1s ease';
      inner.style.transform  = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-4px)`;
    });

    wrap.addEventListener('mouseleave', () => {
      inner.style.transition = 'transform 0.6s cubic-bezier(0.23,1,0.32,1)';
      inner.style.transform  = '';
    });
  });
}


/* =====================================================================
 * § 13  RESIZE & ORIENTATION HANDLERS
 * ===================================================================== */

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
 * § 14  BEAM ME UP
 *
 *  Appears once scroll passes 69% of #hero's total height
 *  (ScrollTrigger start: 'top+=69% top'). Since .hero is 300
 *  viewport-heights tall, this is well into the scroll journey, not
 *  a fixed pixel offset.
 *  Click fires the streak-and-flash sequence then scrolls to top.
 *  Matches the implementation in eDreams-case-study.js and about.js.
 * ===================================================================== */

function initBeamUp() {
  const beamUp     = document.getElementById('beamUp');
  const beamStreak = document.getElementById('beam-streak');
  const beamFlash  = document.getElementById('beam-flash');

  if (!beamUp) return;

  ScrollTrigger.create({
    trigger: '#hero',
    start: 'top+=69% top',
    onEnter:     () => beamUp.classList.add('visible'),
    onLeaveBack: () => beamUp.classList.remove('visible'),
  });

  beamUp.addEventListener('click', () => {
    if (!beamStreak || !beamFlash) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const rect    = beamUp.getBoundingClientRect();
    const centreX = rect.left + rect.width / 2;

    beamStreak.style.cssText = `
      left: ${centreX}px;
      bottom: ${window.innerHeight - rect.top}px;
      top: auto;
      height: 0;
      opacity: 1;
      transform: translateX(-50%);
      transition: none;
    `;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        beamStreak.style.transition = 'height 0.32s ease-out, opacity 0.18s ease 0.26s';
        beamStreak.style.height  = `${rect.top}px`;
        beamStreak.style.opacity = '0';
      });
    });

    setTimeout(() => {
      beamFlash.style.transition = 'opacity 0.08s ease';
      beamFlash.style.opacity    = '0.3';
    }, 300);

    setTimeout(() => window.scrollTo(0, 0), 370);

    setTimeout(() => {
      beamFlash.style.transition = 'opacity 0.45s ease';
      beamFlash.style.opacity    = '0';
    }, 430);

    setTimeout(() => {
      beamStreak.style.transition = 'none';
      beamStreak.style.height     = '0';
      beamStreak.style.opacity    = '0';
    }, 750);
  });
}


/* =====================================================================
 * § 15  BOOT SEQUENCE
 * ===================================================================== */

gsap.registerPlugin(ScrollTrigger);
setViewportHeight();
window.KFTheme.initThemeToggle();
window.KFTheme.swapFavicon(document.documentElement.getAttribute('data-theme') || 'dark');
initIntro();
initStars();
fetchTerrain();
initTerrainParallax();
initUfoScroll();
initHeroScrollCue();
initNav();
initCursor();
initClickRipple();
initCaseStudyStrip();
initScrollReveal();
initCardTilt();
initBeamUp();
initResizeHandlers();
