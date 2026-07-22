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
let ufoScrollTrigger = null;
let navScrollTrigger = null;
let starRafId        = null;

const heroUfo        = document.getElementById('heroUfo');
const ufoBeam        = document.getElementById('ufoBeam');
const ufoBeamOuter   = document.getElementById('ufoBeamOuter');
const ufoBeamCore    = document.getElementById('ufoBeamCore');
const beamLanding    = document.getElementById('beamLanding');
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

function spawnLightParticles(count, speedMult) {
  for (let i = 0; i < count; i++) {
    const pt    = document.createElement('div');
    pt.className = 'ipt';

    const size  = 2 + Math.random() * 5;
    const left  = 5 + Math.random() * 90;
    const btm   = 5 + Math.random() * 80;
    const dur   = (2.2 + Math.random() * 2.8) / speedMult;
    const delay = (Math.random() * 3) / speedMult;
    const drift = (Math.random() - 0.5) * 80;
    const rise  = 35 + Math.random() * 45;

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
    {attr: {y1: 123, y2: 123},
      opacity: 0.9},
    {attr: {y1: 560, y2: 560},
      opacity: 0, duration: 1.8, ease: 'power1.in', onComplete: runScan}
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

  const isLight = introEl.classList.contains('intro-light');
  if (isLight) {
    playLightOutro();
  } else {
    playDarkOutro();
  }
}

/* ── Dark outro (your existing sequence, extracted unchanged) ───── */

function playDarkOutro() {
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
      introEl.style.visibility = 'hidden';
      introEl.style.pointerEvents = 'none';
      gsap.set(heroUfo, { x: introX, y: introY, opacity: 1, force3D: false });
      setTimeout(() => { introEl.style.display = 'none'; }, 100);
    })
    .to(flash, {
      opacity: 0,
      duration: 1.1,
      ease: 'power2.out',
      onComplete: () => {
        ufoIntroComplete = true;
        sessionStorage.setItem('introPlayed', 'true');
        syncUfoToScroll();
      }
    }, '+=0.05');
}

/* ── Light outro (golden sunbeam + lens flare) ──────────────────── */

function playLightOutro() {
  const flash = document.getElementById('intro-flash');

  spawnLightParticles(100, 5);

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
        { x: -3, y: -1, duration: 0.07 },
        { x:  2, y:  2, duration: 0.07 },
        { x: -2, y:  1, duration: 0.07 },
        { x:  0, y:  0, duration: 0.07 }
      ]
    }, '+=0.05')
    .to(introWrap, { scale: 4.5, duration: 0.8, ease: 'power3.in' })
    .to(introGlow, { opacity: 0.95, duration: 0.3 }, '<')
    .to(introEl, {
      keyframes: [
        { filter: 'brightness(1.3) sepia(0.15) saturate(1.3)', duration: 0.08 },
        { filter: 'brightness(1.7) sepia(0.35) saturate(1.6)', duration: 0.10 },
        { filter: 'brightness(2.2) sepia(0.15) saturate(2.0)', duration: 0.08 },
        { filter: 'brightness(2.6) sepia(0)    saturate(2.4)', duration: 0.08 },
        { filter: 'none',                                      duration: 0.06 }
      ]
    })
    .to(introScanlines, { opacity: 0.55, duration: 0.06 }, '<')
    .to(introScanlines, { opacity: 0, duration: 0.30 }, '>')
    .to(flash, { opacity: 1, duration: 0.14 })
    .add(() => {
      introEl.style.visibility = 'hidden';
      introEl.style.pointerEvents = 'none';
      gsap.set(heroUfo, { x: introX, y: introY, opacity: 1, force3D: false });
      setTimeout(() => { introEl.style.display = 'none'; }, 100);
    })
    .to(flash, {
      opacity: 0,
      duration: 1.2,
      ease: 'power2.out',
      onComplete: () => {
        ufoIntroComplete = true;
        sessionStorage.setItem('introPlayed', 'true');
        syncUfoToScroll();
      }
    }, '+=0.05');
}

function initIntro() {
  const isLight = document.documentElement.getAttribute('data-theme') === 'light';

  if (introEl) {
    introEl.classList.toggle('intro-light', isLight);
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

  if (!isLight) {
    setTimeout(() => runScan(), 400);
  }

  if (isLight) {
    spawnLightParticles(30, 1);
  } else {
    spawnParticles(35, 1);
  }

  setTimeout(() => {
    if (introFired) return;
    if (isLight) {
      spawnLightParticles(55, 2.5);
    } else {
      spawnParticles(55, 2.5);
    }
    gsap.to(introGlow, { opacity: 0.8, duration: 1.2 });
  }, 1200);

  setTimeout(() => { minTimeDone = true; tryStartOutro(); }, 1800);
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

    starRafId = requestAnimationFrame(drawStars);
}

function stopStars() {
  if (starRafId) {
    cancelAnimationFrame(starRafId);
    starRafId = null;
  }
}

function initStars() {
  resizeCanvas();
  initStarField();
  stopStars();
  drawStars();

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

function refreshStarsForTheme(theme) {
  if (theme !== 'dark' || !canvas) {
    stopStars();
    return;
  }

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      resizeCanvas();
      initStarField();
      stopStars();
      drawStars();
    });
  });
}


/* =====================================================================
 * § 4A  INTERACTIVE BODY ENVIRONMENT
 *
 * Dark:
 * - redraws the existing regular dot grid
 * - bends the grid toward the cursor like a shallow gravity well
 *
 * Light:
 * - generates a coherent elevation field
 * - extracts real contour lines from that field
 * - cursor temporarily changes the elevation, reshaping the contours
 *
 * Hero:
 * - remains completely untouched
 * ===================================================================== */

function initBodyEnvironment() {
  const fieldCanvas = document.getElementById('body-environment');
  const hero = document.getElementById('hero');

  if (!fieldCanvas || !hero) return;

  const fieldCtx = fieldCanvas.getContext('2d', {
    alpha: true
  });

  if (!fieldCtx) return;

  const root = document.documentElement;
  const canInteract = !isTouchDevice && !reducedMotion;


  /* ── Dark grid settings ────────────────────────────────────────── */

  const DOT_SPACING = 28;
  const DOT_RADIUS = 1;

  const DOT_FIELD_RADIUS = 180;
  const DOT_PULL = 0.17;


  /* ── Light topography settings ─────────────────────────────────── */

  /*
   * Five contour levels keeps this intentionally sparse.
   * This is much less dense than the generated reference image.
   */
  const TOPO_CELL = 18;

  const TOPO_LEVELS = [
    0.34,
    0.44,
    0.54,
    0.64,
    0.74
  ];

  const TOPO_FIELD_RADIUS = 190;
  const TOPO_FIELD_DEPTH = 0.16;


  /* ── Rendering settings ────────────────────────────────────────── */

  const FRAME_INTERVAL = 1000 / 45;

  let width = 0;
  let height = 0;
  let dpr = 1;
  let clipTop = 0;

  let fieldCols = 0;
  let fieldRows = 0;

  let baseField = new Float32Array(0);
  let liveField = new Float32Array(0);

  let currentTheme = 'dark';
  let dirty = true;
  let lastFrameTime = 0;

  let resizeTimer = null;
  let clipFramePending = false;

  let palette = {
    gridDot: '#98A8D428',

    topoLine: 'rgba(35, 84, 43, 0.12)',
    topoIndex: 'rgba(35, 84, 43, 0.19)',
    topoHighlight: 'rgba(255, 253, 247, 0.22)'
  };

  const pointer = {
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,

    targetX: window.innerWidth / 2,
    targetY: window.innerHeight / 2,

    inside: false,
    strength: 0
  };


  /* ── Theme and palette ─────────────────────────────────────────── */

  function readThemeAndPalette() {
    currentTheme =
      root.getAttribute('data-theme') === 'light'
        ? 'light'
        : 'dark';

    const styles = getComputedStyle(root);

    palette = {
      gridDot:
        styles
          .getPropertyValue('--body-grid-dot')
          .trim() ||
        '#98A8D428',

      topoLine:
        styles
          .getPropertyValue('--body-topo-line')
          .trim() ||
        'rgba(35, 84, 43, 0.12)',

      topoIndex:
        styles
          .getPropertyValue('--body-topo-index')
          .trim() ||
        'rgba(35, 84, 43, 0.19)',

      topoHighlight:
        styles
          .getPropertyValue('--body-topo-highlight')
          .trim() ||
        'rgba(255, 253, 247, 0.22)'
    };
  }


  /* ── Coherent terrain generation ───────────────────────────────── */

  function fract(value) {
    return value - Math.floor(value);
  }

  function hash2(x, y) {
    return fract(
      Math.sin(
        x * 127.1 +
        y * 311.7
      ) * 43758.5453123
    );
  }

  function smoothStep(value) {
    return value * value * (3 - 2 * value);
  }

  function valueNoise(x, y) {
    const integerX = Math.floor(x);
    const integerY = Math.floor(y);

    const fractionalX = x - integerX;
    const fractionalY = y - integerY;

    const smoothX = smoothStep(fractionalX);
    const smoothY = smoothStep(fractionalY);

    const topLeft = hash2(
      integerX,
      integerY
    );

    const topRight = hash2(
      integerX + 1,
      integerY
    );

    const bottomLeft = hash2(
      integerX,
      integerY + 1
    );

    const bottomRight = hash2(
      integerX + 1,
      integerY + 1
    );

    const top =
      topLeft +
      (topRight - topLeft) * smoothX;

    const bottom =
      bottomLeft +
      (bottomRight - bottomLeft) * smoothX;

    return (
      top +
      (bottom - top) * smoothY
    );
  }

  function fbm(x, y) {
    let value = 0;
    let amplitude = 0.58;
    let totalAmplitude = 0;

    /*
     * Only three octaves:
     * broad, readable terrain rather than excessive tiny contours.
     */
    for (
      let octave = 0;
      octave < 3;
      octave += 1
    ) {
      value +=
        valueNoise(x, y) *
        amplitude;

      totalAmplitude += amplitude;

      x = x * 1.93 + 11.7;
      y = y * 1.93 - 7.4;

      amplitude *= 0.5;
    }

    return value / totalAmplitude;
  }

  function buildTopographicField() {
    fieldCols =
      Math.ceil(width / TOPO_CELL) + 2;

    fieldRows =
      Math.ceil(height / TOPO_CELL) + 2;

    baseField = new Float32Array(
      fieldCols * fieldRows
    );

    liveField = new Float32Array(
      fieldCols * fieldRows
    );

    for (
      let row = 0;
      row < fieldRows;
      row += 1
    ) {
      for (
        let col = 0;
        col < fieldCols;
        col += 1
      ) {
        /*
         * Larger coordinate scale creates broader geographic forms
         * and fewer tiny elevation islands.
         */
        const x =
          (col * TOPO_CELL) / 300;

        const y =
          (row * TOPO_CELL) / 300;

        /*
         * Domain warping stops the field from looking like horizontal
         * or vertical noise bands.
         */
        const warpX = (
          valueNoise(
            x * 0.72 + 19.2,
            y * 0.72 - 4.8
          ) - 0.5
        ) * 1.15;

        const warpY = (
          valueNoise(
            x * 0.72 - 8.1,
            y * 0.72 + 13.6
          ) - 0.5
        ) * 1.15;

        const terrain = fbm(
          x + warpX,
          y + warpY
        );

        baseField[
          row * fieldCols + col
        ] = terrain;
      }
    }
  }


  /* ── Canvas sizing and hero clipping ───────────────────────────── */

  function updateBodyClip() {
    const heroBottom =
      hero.getBoundingClientRect().bottom;

    clipTop = Math.min(
      height,
      Math.max(0, heroBottom)
    );

    fieldCanvas.style.setProperty(
      '--body-environment-clip-top',
      `${clipTop}px`
    );
  }

  function resizeBodyEnvironment() {
    width = window.innerWidth;
    height = window.innerHeight;

    dpr = Math.min(
      window.devicePixelRatio || 1,
      1.75
    );

    fieldCanvas.width =
      Math.round(width * dpr);

    fieldCanvas.height =
      Math.round(height * dpr);

    fieldCanvas.style.width =
      `${width}px`;

    fieldCanvas.style.height =
      `${height}px`;

    fieldCtx.setTransform(
      dpr,
      0,
      0,
      dpr,
      0,
      0
    );

    if (currentTheme !== 'light') {
      buildTopographicField();
    }

    updateBodyClip();

    dirty = true;
  }


  /* ── Dark theme: deform the dot grid itself ────────────────────── */

  function drawDarkGrid() {
    const originX =
      (width * 0.5) % DOT_SPACING;

    const originY =
      (height * 0.5) % DOT_SPACING;

    fieldCtx.fillStyle =
      palette.gridDot;

    for (
      let y = originY - DOT_SPACING;
      y < height + DOT_SPACING;
      y += DOT_SPACING
    ) {
      for (
        let x = originX - DOT_SPACING;
        x < width + DOT_SPACING;
        x += DOT_SPACING
      ) {
        let drawX = x;
        let drawY = y;

        let scale = 1;
        let opacity = 1;

        if (pointer.strength > 0.001) {
          const differenceX =
            pointer.x - x;

          const differenceY =
            pointer.y - y;

          const distance = Math.hypot(
            differenceX,
            differenceY
          );

          if (
            distance < DOT_FIELD_RADIUS &&
            distance > 0.001
          ) {
            const normalized =
              1 -
              distance / DOT_FIELD_RADIUS;

            const influence = (
              normalized *
              normalized *
              (3 - 2 * normalized) *
              pointer.strength
            );

            /*
             * This moves the existing regular grid toward the cursor.
             * No extra particles are generated.
             */
            drawX +=
              differenceX *
              DOT_PULL *
              influence;

            drawY +=
              differenceY *
              DOT_PULL *
              influence;

            scale +=
              0.35 * influence;

            opacity +=
              0.45 * influence;
          }
        }

        fieldCtx.globalAlpha =
          Math.min(1, opacity);

        fieldCtx.beginPath();

        fieldCtx.arc(
          drawX,
          drawY,
          DOT_RADIUS * scale,
          0,
          Math.PI * 2
        );

        fieldCtx.fill();
      }
    }

    fieldCtx.globalAlpha = 1;
  }

  /* ── Light theme: warm particle field ──────────────────────────── */

  function drawLightParticles() {
    const spacing = 34;
    const originX = (width * 0.5) % spacing;
    const originY = (height * 0.5) % spacing;

    for (let y = originY - spacing; y < height + spacing; y += spacing) {
      for (let x = originX - spacing; x < width + spacing; x += spacing) {
        let drawX = x;
        let drawY = y;
        let scale = 1;
        let opacity = 0.3;

        if (pointer.strength > 0.001) {
          const diffX = pointer.x - x;
          const diffY = pointer.y - y;
          const dist = Math.hypot(diffX, diffY);

          if (dist < DOT_FIELD_RADIUS && dist > 0.001) {
            const normalized = 1 - dist / DOT_FIELD_RADIUS;
            const influence = (normalized * normalized * (3 - 2 * normalized) * pointer.strength);
            drawX += diffX * DOT_PULL * influence;
            drawY += diffY * DOT_PULL * influence;
            scale += 0.4 * influence;
            opacity += 0.5 * influence;
          }
        }

        const hueHash = Math.sin(x * 0.1 + y * 0.13) * 0.5 + 0.5;
        let hue, sat, light;

        if (hueHash < 0.55) {
          hue = 38 + hueHash * 22;
          sat = 62;
          light = 56;
        } else if (hueHash < 0.88) {
          hue = 24 + (hueHash - 0.55) * 28;
          sat = 58;
          light = 52;
        } else {
          hue = 162 + (hueHash - 0.88) * 18;
          sat = 52;
          light = 48;
        }

        fieldCtx.globalAlpha = Math.min(0.85, opacity);
        fieldCtx.fillStyle = `hsla(${hue.toFixed(1)}, ${sat}%, ${light}%, 1)`;

        fieldCtx.beginPath();
        fieldCtx.arc(drawX, drawY, 2.0 * scale, 0, Math.PI * 2);
        fieldCtx.fill();
      }
    }

    fieldCtx.globalAlpha = 1;
  }

  /* ── Light theme: alter the elevation field ────────────────────── */

  function updateLiveTopographicField() {
    const radiusSquared =
      TOPO_FIELD_RADIUS *
      TOPO_FIELD_RADIUS;

    for (
      let row = 0;
      row < fieldRows;
      row += 1
    ) {
      for (
        let col = 0;
        col < fieldCols;
        col += 1
      ) {
        const index =
          row * fieldCols + col;

        let value =
          baseField[index];

        if (pointer.strength > 0.001) {
          const pointX =
            col * TOPO_CELL;

          const pointY =
            row * TOPO_CELL;

          const differenceX =
            pointX - pointer.x;

          const differenceY =
            pointY - pointer.y;

          const distanceSquared = (
            differenceX * differenceX +
            differenceY * differenceY
          );

          if (
            distanceSquared <
            radiusSquared
          ) {
            const distance =
              Math.sqrt(distanceSquared);

            const normalized =
              1 -
              distance / TOPO_FIELD_RADIUS;

            const influence = (
              normalized *
              normalized *
              (3 - 2 * normalized) *
              pointer.strength
            );

            /*
             * The cursor creates a temporary basin in the virtual
             * terrain. Contour lines are then regenerated from it.
             */
            value -=
              TOPO_FIELD_DEPTH *
              influence;
          }
        }

        liveField[index] = value;
      }
    }
  }


  /* ── Marching-squares contour extraction ───────────────────────── */

  function interpolateEdge(
    x1,
    y1,
    value1,
    x2,
    y2,
    value2,
    level
  ) {
    const difference =
      value2 - value1;

    const amount =
      Math.abs(difference) < 0.000001
        ? 0.5
        : (level - value1) / difference;

    return {
      x:
        x1 +
        (x2 - x1) * amount,

      y:
        y1 +
        (y2 - y1) * amount
    };
  }

  function addContourSegment(
    path,
    start,
    end
  ) {
    path.moveTo(
      start.x,
      start.y
    );

    path.lineTo(
      end.x,
      end.y
    );
  }

  function createContourPath(level) {
    const path = new Path2D();

    for (
      let row = 0;
      row < fieldRows - 1;
      row += 1
    ) {
      for (
        let col = 0;
        col < fieldCols - 1;
        col += 1
      ) {
        const x0 =
          col * TOPO_CELL;

        const y0 =
          row * TOPO_CELL;

        const x1 =
          x0 + TOPO_CELL;

        const y1 =
          y0 + TOPO_CELL;

        const topLeft =
          liveField[
            row * fieldCols + col
          ];

        const topRight =
          liveField[
            row * fieldCols + col + 1
          ];

        const bottomRight =
          liveField[
            (row + 1) * fieldCols +
            col +
            1
          ];

        const bottomLeft =
          liveField[
            (row + 1) * fieldCols +
            col
          ];

        const intersections = [];

        if (
          (topLeft < level) !==
          (topRight < level)
        ) {
          intersections.push(
            interpolateEdge(
              x0,
              y0,
              topLeft,
              x1,
              y0,
              topRight,
              level
            )
          );
        }

        if (
          (topRight < level) !==
          (bottomRight < level)
        ) {
          intersections.push(
            interpolateEdge(
              x1,
              y0,
              topRight,
              x1,
              y1,
              bottomRight,
              level
            )
          );
        }

        if (
          (bottomRight < level) !==
          (bottomLeft < level)
        ) {
          intersections.push(
            interpolateEdge(
              x1,
              y1,
              bottomRight,
              x0,
              y1,
              bottomLeft,
              level
            )
          );
        }

        if (
          (bottomLeft < level) !==
          (topLeft < level)
        ) {
          intersections.push(
            interpolateEdge(
              x0,
              y1,
              bottomLeft,
              x0,
              y0,
              topLeft,
              level
            )
          );
        }

        if (intersections.length === 2) {
          addContourSegment(
            path,
            intersections[0],
            intersections[1]
          );
        }

        /*
         * Ambiguous marching-squares cells can contain four
         * intersections. The average field value decides how the
         * segments connect.
         */
        if (intersections.length === 4) {
          const centerValue = (
            topLeft +
            topRight +
            bottomRight +
            bottomLeft
          ) * 0.25;

          if (centerValue < level) {
            addContourSegment(
              path,
              intersections[0],
              intersections[3]
            );

            addContourSegment(
              path,
              intersections[1],
              intersections[2]
            );
          } else {
            addContourSegment(
              path,
              intersections[0],
              intersections[1]
            );

            addContourSegment(
              path,
              intersections[2],
              intersections[3]
            );
          }
        }
      }
    }

    return path;
  }


  /* ── Draw the light contour map ────────────────────────────────── */

  function drawLightTopography() {
    updateLiveTopographicField();

    fieldCtx.lineCap = 'round';
    fieldCtx.lineJoin = 'round';

    TOPO_LEVELS.forEach(
      (level, index) => {
        /*
         * The center contour is slightly stronger, similar to an
         * index contour on a real topographic map.
         */
        const isIndexContour =
          index === 2;

        const path =
          createContourPath(level);

        /*
         * Subtle light-facing edge.
         */
        fieldCtx.save();

        fieldCtx.translate(
          0,
          -0.7
        );

        fieldCtx.strokeStyle =
          palette.topoHighlight;

        fieldCtx.lineWidth =
          isIndexContour
            ? 1.6
            : 1.15;

        fieldCtx.stroke(path);
        fieldCtx.restore();

        /*
         * Main cactus-green contour.
         */
        fieldCtx.strokeStyle =
          isIndexContour
            ? palette.topoIndex
            : palette.topoLine;

        fieldCtx.lineWidth =
          isIndexContour
            ? 1.2
            : 0.8;

        fieldCtx.stroke(path);
      }
    );
  }


  /* ── Shared drawing ────────────────────────────────────────────── */

  function drawBodyEnvironment() {
    fieldCtx.clearRect(
      0,
      0,
      width,
      height
    );

    if (currentTheme === 'light') {
      drawLightParticles();
    } else {
      drawDarkGrid();
    }
  }


  /* ── Animation loop ────────────────────────────────────────────── */

  function renderBodyEnvironment(now) {
    requestAnimationFrame(
      renderBodyEnvironment
    );

    if (document.hidden) return;

    /*
     * During the hero, only the portion below the hero boundary may
     * respond. Once the hero is completely above the viewport,
     * clipTop becomes zero.
     */
    const pointerCanAffectBody = (
      canInteract &&
      pointer.inside &&
      pointer.targetY >= clipTop
    );

    const targetStrength =
      pointerCanAffectBody
        ? 1
        : 0;

    const previousX =
      pointer.x;

    const previousY =
      pointer.y;

    const previousStrength =
      pointer.strength;

    /*
     * Slight delay gives both themes the soft field-following effect.
     */
    pointer.x += (
      pointer.targetX -
      pointer.x
    ) * 0.14;

    pointer.y += (
      pointer.targetY -
      pointer.y
    ) * 0.14;

    pointer.strength += (
      targetStrength -
      pointer.strength
    ) * 0.10;

    const stillMoving = (
      Math.abs(
        pointer.x -
        previousX
      ) +

      Math.abs(
        pointer.y -
        previousY
      ) +

      Math.abs(
        pointer.strength -
        previousStrength
      )
    ) > 0.03;

    if (
      !dirty &&
      !stillMoving
    ) {
      return;
    }

    if (
      now - lastFrameTime <
      FRAME_INTERVAL
    ) {
      return;
    }

    lastFrameTime = now;

    drawBodyEnvironment();
    dirty = false;
  }


  /* ── Pointer tracking ──────────────────────────────────────────── */

  if (canInteract) {
    document.addEventListener(
      'mousemove',
      event => {
        pointer.targetX =
          event.clientX;

        pointer.targetY =
          event.clientY;

        pointer.inside = true;
        dirty = true;
      },
      {
        passive: true
      }
    );

    document.documentElement.addEventListener(
      'mouseleave',
      () => {
        pointer.inside = false;
        dirty = true;
      }
    );

    window.addEventListener(
      'blur',
      () => {
        pointer.inside = false;
        dirty = true;
      }
    );
  }


  /* ── Keep the canvas below the hero ────────────────────────────── */

  window.addEventListener(
    'scroll',
    () => {
      if (clipFramePending) return;

      clipFramePending = true;

      requestAnimationFrame(() => {
        updateBodyClip();
        dirty = true;
        clipFramePending = false;
      });
    },
    {
      passive: true
    }
  );


  /* ── Resize handling ───────────────────────────────────────────── */

  window.addEventListener(
    'resize',
    () => {
      clearTimeout(resizeTimer);

      resizeTimer = setTimeout(
        () => {
          resizeBodyEnvironment();
          drawBodyEnvironment();
        },
        120
      );
    }
  );


  /* ── Theme switching ───────────────────────────────────────────── */

  const themeObserver =
    new MutationObserver(
      mutations => {
        const themeChanged =
          mutations.some(
            mutation =>
              mutation.attributeName ===
              'data-theme'
          );

        if (!themeChanged) return;

        readThemeAndPalette();
        dirty = true;
      }
    );

  themeObserver.observe(
    root,
    {
      attributes: true,
      attributeFilter: [
        'data-theme'
      ]
    }
  );


  /* ── Initial setup ─────────────────────────────────────────────── */

  readThemeAndPalette();
  resizeBodyEnvironment();
  drawBodyEnvironment();

  requestAnimationFrame(
    renderBodyEnvironment
  );
}

/* =====================================================================
 * § 5  TERRAIN IMAGE LOADING
 * ===================================================================== */

function fetchTerrain() {
  const terrainImages = Array.from(document.querySelectorAll('.terrain-img, #intro-ufo'));

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


function swapTerrain() {
  /*
   * Capture the real document position before the theme changes
   * affect CSS rendering and ScrollTrigger measurements.
   */
  const savedScrollY = window.scrollY;

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      /*
       * Theme-dependent assets are now painted, so ScrollTrigger
       * can safely recalculate its measurements.
       */
      ScrollTrigger.refresh();

      /*
       * Prevent the refresh from shifting the page's real scroll
       * position. Temporarily disable smooth scrolling so restoring
       * the position is immediate and hidden beneath the theme wipe.
       */
      const root = document.documentElement;
      const previousScrollBehavior = root.style.scrollBehavior;

      root.style.scrollBehavior = 'auto';
      window.scrollTo(0, savedScrollY);
      root.style.scrollBehavior = previousScrollBehavior;

      ScrollTrigger.update();

      /*
       * Explicitly resynchronize components whose state depends on
       * the refreshed hero progress.
       */
      syncNavState();

      const isBelowHero =
        ufoScrollTrigger &&
        savedScrollY > ufoScrollTrigger.end + 1;

      if (isBelowHero && heroUfo) {
        gsap.set(heroUfo, {
          autoAlpha: 0
        });

        if (ufoBeam) {
          ufoBeam.setAttribute('opacity', '0');
        }

        heroUfo.classList.remove('hovering');
        return;
      }

      if (typeof syncUfoToScroll === 'function') {
        syncUfoToScroll();
      }
    });
  });
}

function swapFavicon(theme) {
  const href = theme === 'light'
    ? 'favicon-cactus.svg'
    : 'favicon-ufo.svg';

  const existingIcon = document.getElementById('favicon');

  if (existingIcon) {
    existingIcon.remove();
  }

  const favicon = document.createElement('link');
  favicon.id = 'favicon';
  favicon.rel = 'icon';
  favicon.type = 'image/svg+xml';
  favicon.href = href + '?v=' + Date.now();

  document.head.appendChild(favicon);
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

function getCurrentUfoProgress() {
  const hero = document.getElementById('hero');

  if (!hero) return 0;

  /*
   * These values match:
   *
   * start: 'top top'
   * end:   'bottom bottom'
   *
   * Progress is calculated directly from the current page scroll,
   * so a theme-triggered ScrollTrigger refresh cannot leave the UFO
   * stuck at a cached progress value of 1.
   */
  const heroTop =
    window.scrollY + hero.getBoundingClientRect().top;

  const heroEnd =
    heroTop + hero.offsetHeight - window.innerHeight;

  const scrollRange = heroEnd - heroTop;

  if (scrollRange <= 0) return 0;

  return gsap.utils.clamp(
    0,
    1,
    (window.scrollY - heroTop) / scrollRange
  );
}


function renderUfoAtProgress(progress) {
  if (
    !heroUfo ||
    !ufoBeam ||
    !ufoIntroComplete ||
    !Number.isFinite(progress)
  ) {
    return;
  }

  const clampedProgress =
    gsap.utils.clamp(0, 1, progress);

  const { x, y } =
    getUfoPos(clampedProgress);

  const xPx =
    (x / 100) * window.innerWidth;

  const aspectRatio =
    window.innerWidth / window.innerHeight;

  const maxYpct =
    aspectRatio > 2
      ? 0.76
      : aspectRatio > 1.6
        ? 0.80
        : 0.84;

  const yPx = Math.min(
    (y / 100) * window.innerHeight,
    maxYpct * window.innerHeight
  );

  /*
   * The UFO remains visible within the hero.
   * The hero itself controls when it leaves the viewport.
   */
  gsap.set(heroUfo, {
    x: xPx,
    y: yPx,
    autoAlpha: 1,
    force3D: true
  });

  const beamProgress =
    gsap.utils.clamp(
      0,
      1,
      (clampedProgress - 0.50) / 0.15
    );

    /*
     * Tractor beam layers:
     *
     * Outer energy field
     * Main beam body
     * Bright core
     * Ground landing glow
     */
    
    ufoBeamOuter?.setAttribute(
      'opacity',
      (beamProgress * 0.15).toFixed(3)
    );
    
    ufoBeam?.setAttribute(
      'opacity',
      (beamProgress * 0.65).toFixed(3)
    );
    
    ufoBeamCore?.setAttribute(
      'opacity',
      (beamProgress * 0.75).toFixed(3)
    );
    
    beamLanding?.setAttribute(
      'opacity',
      (beamProgress * 0.25).toFixed(3)
    );

  heroUfo.classList.toggle(
    'hovering',
    clampedProgress >= 0.45
  );
}


function syncUfoToScroll() {
  if (!ufoScrollTrigger || !ufoIntroComplete) return;

  renderUfoAtProgress(
    getCurrentUfoProgress()
  );
}


function initUfoScroll() {
  if (!heroUfo || !ufoBeam) return;

  const updateUfo = () => {
    syncUfoToScroll();
  };

  ufoScrollTrigger = ScrollTrigger.create({
    trigger: '#hero',
    start: 'top top',
    end: 'bottom bottom',
    invalidateOnRefresh: true,

    onUpdate: updateUfo,
    onRefresh: updateUfo,
    onEnter: updateUfo,
    onEnterBack: updateUfo,
    onLeave: updateUfo,
    onLeaveBack: updateUfo
  });

  /*
   * ScrollTrigger should normally handle every scroll update.
   * This requestAnimationFrame-throttled listener is an additional
   * safeguard after a live theme swap and layout refresh.
   */
  let ufoScrollFrame = null;

  window.addEventListener(
    'scroll',
    () => {
      if (ufoScrollFrame !== null) return;

      ufoScrollFrame = requestAnimationFrame(() => {
        ufoScrollFrame = null;
        syncUfoToScroll();
      });
    },
    { passive: true }
  );

  const resyncUfo = () => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        ScrollTrigger.refresh();
        syncUfoToScroll();
      });
    });
  };

  resyncUfo();

  window.addEventListener(
    'load',
    resyncUfo,
    { once: true }
  );

  window.addEventListener(
    'pageshow',
    resyncUfo
  );
}


/* =====================================================================
 * § 7  NAVIGATION
 * ===================================================================== */

function syncNavState() {
  const nav = document.querySelector('nav');

  if (!nav) return;

  /*
   * The top of the document must always use the transparent nav,
   * even if a theme-triggered ScrollTrigger refresh temporarily
   * leaves the hero trigger with stale progress.
   */
  if (window.scrollY <= 2) {
    nav.classList.remove('scrolled');
    return;
  }

  nav.classList.toggle(
    'scrolled',
    Boolean(navScrollTrigger && navScrollTrigger.progress >= 0.50)
  );
}

function initNav() {
  const nav  = document.querySelector('nav');
  const hero = document.getElementById('hero');

  if (!nav || !hero) return;

  navScrollTrigger = ScrollTrigger.create({
    trigger: hero,
    start: 'top top',
    end: 'bottom bottom',
    onUpdate: syncNavState,
    onRefresh: syncNavState
  });

  /*
   * This provides an independent top-of-page check instead of
   * relying exclusively on ScrollTrigger's cached progress.
   */
  window.addEventListener('scroll', syncNavState, {
    passive: true
  });

  syncNavState();
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
 * § 7A  THEME TOGGLE
 * ===================================================================== */

function initThemeToggle() {
  const themeToggle = document.getElementById('theme-toggle');

  if (!themeToggle) return;

  const systemTheme = window.matchMedia('(prefers-color-scheme: light)');

  function getSystemTheme() {
    return systemTheme.matches ? 'light' : 'dark';
  }

  function getCurrentTheme() {
    return document.documentElement.getAttribute('data-theme') || getSystemTheme();
  }

  function applyTheme(theme, shouldSave = true) {
    document.documentElement.setAttribute('data-theme', theme);

    refreshStarsForTheme(theme);

    const alienImg = document.querySelector('.about-alien');
    if (alienImg) {
      alienImg.src = theme === 'light'
        ? 'images/Alien-Image-light.png'
        : 'images/Alien-Image-dark.png';
    }

    if (shouldSave) {
      localStorage.setItem('kf-theme', theme);
    }

    const isLight = theme === 'light';

    themeToggle.setAttribute('aria-pressed', String(!isLight));
    themeToggle.setAttribute(
      'aria-label',
      isLight ? 'Switch to dark theme' : 'Switch to light theme'
    );
  }

  applyTheme(getCurrentTheme(), false);

  themeToggle.addEventListener('click', () => {
    const currentTheme = getCurrentTheme();
    const nextTheme    = currentTheme === 'dark' ? 'light' : 'dark';

    playThemeWipe(nextTheme, () => {
      applyTheme(nextTheme);
      swapTerrain();
      swapFavicon(nextTheme);
    });
  });

  systemTheme.addEventListener('change', event => {
    const savedTheme = localStorage.getItem('kf-theme');

    if (!savedTheme) {
      const newTheme = event.matches ? 'light' : 'dark';
      applyTheme(newTheme, false);
      swapTerrain(newTheme);
      swapFavicon(newTheme);
    }
  });
}

/* =====================================================================
 * § 7B  THEME WIPE
 *
 *  Wavy SVG path wipe triggered by the theme toggle button.
 *  Two layered paths with randomised bezier control points create
 *  the organic wave edge. Phase 1 covers the screen, theme switches
 *  at peak coverage, phase 2 reveals the new theme.
 *  Adapted from Blake Bowen / GreenSock codepen qBedXpg.
 * ===================================================================== */

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

  const stops = {
    stop1a: document.querySelector('.wipe-stop1a'),
    stop1b: document.querySelector('.wipe-stop1b'),
    stop2a: document.querySelector('.wipe-stop2a'),
    stop2b: document.querySelector('.wipe-stop2b'),
  };

  if (nextTheme === 'light') {
    stops.stop1a.setAttribute('stop-color', '#E7B75F');
    stops.stop1b.setAttribute('stop-color', '#DDB783');
    stops.stop2a.setAttribute('stop-color', '#B54832');
    stops.stop2b.setAttribute('stop-color', '#FFF4E6');
  } else {
    stops.stop1a.setAttribute('stop-color', '#0AC39A');
    stops.stop1b.setAttribute('stop-color', '#100820');
    stops.stop2a.setAttribute('stop-color', '#5F259F');
    stops.stop2b.setAttribute('stop-color', '#100820');
  }

  const numPoints      = 10;
  const numPaths       = paths.length;
  const delayPointsMax = 0.3;
  const delayPerPath   = 0.2;
  const pointsDelay    = [];

  const allPoints = Array.from({ length: numPaths }, () =>
    Array.from({ length: numPoints }, () => 100)
  );

  function render(opened) {
    for (let i = 0; i < numPaths; i++) {
      const pts = allPoints[i];
      let d = opened ? `M 0 0 V ${pts[0]} C` : `M 0 ${pts[0]} C`;

      for (let j = 0; j < numPoints - 1; j++) {
        const p  = (j + 1) / (numPoints - 1) * 100;
        const cp = p - (1 / (numPoints - 1) * 100) / 2;
        d += ` ${cp} ${pts[j]} ${cp} ${pts[j + 1]} ${p} ${pts[j + 1]}`;
      }

      d += opened ? ` V 100 H 0` : ` V 0 H 0`;
      paths[i].setAttribute('d', d);
    }
  }

  function randomiseDelays() {
    for (let i = 0; i < numPoints; i++) {
      pointsDelay[i] = Math.random() * delayPointsMax;
    }
  }

  function buildTimeline(opened, onDone) {
    const tl = gsap.timeline({
      onUpdate: () => render(opened),
      defaults: { ease: 'power2.inOut', duration: 0.85 },
      onComplete: onDone,
    });

    for (let i = 0; i < numPaths; i++) {
      const pts       = allPoints[i];
      const pathDelay = delayPerPath * (opened ? i : numPaths - i - 1);

      for (let j = 0; j < numPoints; j++) {
        tl.to(pts, { [j]: 0 }, pointsDelay[j] + pathDelay);
      }
    }

    return tl;
  }

  randomiseDelays();

  buildTimeline(true, () => {
    onMidpoint();

    for (let i = 0; i < numPaths; i++) {
      for (let j = 0; j < numPoints; j++) {
        allPoints[i][j] = 100;
      }
    }

    render(false);

    randomiseDelays();

    buildTimeline(false, () => {
      wipeIsActive = false;
    });
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
initThemeToggle();
swapFavicon(document.documentElement.getAttribute('data-theme') || 'dark');
initIntro();
fetchTerrain();
initNav();

// Defer heavy visual effects until the browser is idle
const defer = window.requestIdleCallback || ((cb) => setTimeout(cb, 50));
defer(() => {
  initStars();
  initBodyEnvironment();
  initTerrainParallax();
  initUfoScroll();
  initHeroScrollCue();
  initCursor();
  initClickRipple();
  initCaseStudyStrip();
  initScrollReveal();
  initCardTilt();
  initBeamUp();
  initResizeHandlers();
});
