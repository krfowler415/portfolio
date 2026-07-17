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
        syncUfoToScroll();
      }
    }, '+=0.05');
}

function initIntro() {
  if (document.documentElement.getAttribute('data-theme') === 'light') {
    if (introEl) {introEl.style.display = 'none';
    }
  
    if (heroUfo) {
      gsap.set(heroUfo, {x: introX, y: introY, opacity: 1, visibility: 'visible', force3D: false});
    }
  
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

function refreshStarsForTheme(theme) {
  if (theme !== 'dark' || !canvas) return;

  /*
   * Wait until the data-theme change has been painted.
   * The canvas was display:none in light mode, so it must be
   * measured again after becoming visible.
   */
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      resizeCanvas();
      initStarField();
    });
  });
}

/* =====================================================================
 * § 4A  INTERACTIVE BODY BACKGROUND FIELD
 *
 * Dark theme:
 * - sparse foreground stars
 * - subtle gravitational / space-time distortion
 *
 * Light theme:
 * - flowing atmospheric / topographic lines
 * - subtle cursor-driven bending
 *
 * The field appears only after the hero and does not modify #stars.
 * ===================================================================== */

function initBodyField() {
  if (isTouchDevice || reducedMotion) return;

  const hero     = document.getElementById('hero');
  const marquee  = document.querySelector('.marquee');

  if (!hero || !marquee) return;

  const fieldCanvas = document.createElement('canvas');
  fieldCanvas.id = 'body-field';
  fieldCanvas.setAttribute('aria-hidden', 'true');

  document.body.appendChild(fieldCanvas);

  const fieldCtx = fieldCanvas.getContext('2d', {
    alpha: true
  });

  if (!fieldCtx) {
    fieldCanvas.remove();
    return;
  }


  /* ── Canvas state ──────────────────────────────────────────────── */

  let fieldWidth  = 0;
  let fieldHeight = 0;
  let fieldDpr    = 1;

  let currentTheme =
    document.documentElement.getAttribute('data-theme') === 'light'
      ? 'light'
      : 'dark';

  let fieldColors = {
    primary:   '#98A8D4',
    secondary: '#0AC39A',
    accent:    '#B080E0'
  };

  let darkStars = [];
  let lightLines = [];

  let fieldIsVisible = false;
  let pointerIsInside = false;

  let interactionStrength = 0;
  let lastFrameTime = 0;

  const pointer = {
    x:       window.innerWidth / 2,
    y:       window.innerHeight / 2,
    targetX: window.innerWidth / 2,
    targetY: window.innerHeight / 2
  };


  /* ── Interaction tuning ────────────────────────────────────────── */

  const DARK_FIELD_RADIUS = 180;
  const DARK_FIELD_WARP   = 11;
  const DARK_FIELD_SWIRL  = 5;

  const LIGHT_FIELD_RADIUS = 190;
  const LIGHT_FIELD_WARP   = 14;

  /*
   * About 45 FPS is enough for this background effect and reduces
   * unnecessary work compared with forcing a full 60 FPS.
   */
  const FRAME_INTERVAL = 1000 / 45;


  /* ── Theme helpers ─────────────────────────────────────────────── */

  function readBodyFieldColors() {
    const styles = getComputedStyle(document.documentElement);

    fieldColors = {
      primary:
        styles.getPropertyValue('--body-field-primary').trim() ||
        '#98A8D4',

      secondary:
        styles.getPropertyValue('--body-field-secondary').trim() ||
        '#0AC39A',

      accent:
        styles.getPropertyValue('--body-field-accent').trim() ||
        '#B080E0'
    };
  }


  /* ── Dark star field generation ────────────────────────────────── */

  function buildDarkStars() {
    const area = fieldWidth * fieldHeight;

    const starCount = Math.max(
      48,
      Math.min(92, Math.round(area / 18000))
    );

    darkStars = Array.from({ length: starCount }, (_, index) => ({
      /*
       * Normalized positions remain stable at different viewport sizes.
       */
      u: Math.random(),
      v: Math.random(),

      radius:
        index % 9 === 0
          ? 1.35 + Math.random() * 0.65
          : 0.65 + Math.random() * 0.75,

      alpha: 0.28 + Math.random() * 0.34,

      phase: Math.random() * Math.PI * 2,
      speed: 0.35 + Math.random() * 0.55,

      /*
       * Mostly moonlit blue, with occasional teal and purple stars.
       */
      tone:
        index % 11 === 0
          ? 'secondary'
          : index % 7 === 0
            ? 'accent'
            : 'primary',

      glow: index % 8 === 0
    }));
  }


  /* ── Light flow-line generation ────────────────────────────────── */

  function buildLightLines() {
    const lineCount = Math.max(
      9,
      Math.min(14, Math.round(fieldHeight / 72))
    );

    lightLines = Array.from({ length: lineCount }, (_, index) => ({
      yRatio: (index + 0.5) / lineCount,

      amplitude: 9 + Math.random() * 11,
      frequency: 0.004 + Math.random() * 0.0022,
      phase: Math.random() * Math.PI * 2,

      /*
       * A few lines receive a light solar or cloud edge.
       */
      highlight:
        index % 4 === 0
          ? 'secondary'
          : index % 5 === 0
            ? 'accent'
            : null
    }));
  }


  /* ── Canvas sizing ─────────────────────────────────────────────── */

  function resizeBodyField() {
    fieldWidth  = window.innerWidth;
    fieldHeight = window.innerHeight;

    /*
     * Cap DPR to prevent very high-density screens from making this
     * decorative effect unnecessarily expensive.
     */
    fieldDpr = Math.min(window.devicePixelRatio || 1, 1.75);

    fieldCanvas.width  = Math.round(fieldWidth * fieldDpr);
    fieldCanvas.height = Math.round(fieldHeight * fieldDpr);

    fieldCanvas.style.width  = `${fieldWidth}px`;
    fieldCanvas.style.height = `${fieldHeight}px`;

    fieldCtx.setTransform(
      fieldDpr,
      0,
      0,
      fieldDpr,
      0,
      0
    );

    buildDarkStars();
    buildLightLines();
  }


  /* ── Body-only visibility ──────────────────────────────────────── */

  function updateBodyFieldVisibility() {
    /*
     * The field starts fading in as the marquee reaches the viewport.
     * It disappears again when scrolling back into the hero.
     */
    const marqueeTop = marquee.getBoundingClientRect().top;

    fieldIsVisible = marqueeTop <= window.innerHeight;

    fieldCanvas.classList.toggle(
      'is-visible',
      fieldIsVisible
    );
  }


  /* ── Dark mode drawing ─────────────────────────────────────────── */

  function drawDarkField(time) {
    darkStars.forEach(star => {
      const baseX = star.u * fieldWidth;
      const baseY = star.v * fieldHeight;

      let drawX = baseX;
      let drawY = baseY;

      const dx   = baseX - pointer.x;
      const dy   = baseY - pointer.y;
      const dist = Math.hypot(dx, dy);

      let localInfluence = 0;

      if (
        interactionStrength > 0.001 &&
        dist < DARK_FIELD_RADIUS &&
        dist > 0.001
      ) {
        const normalized =
          1 - dist / DARK_FIELD_RADIUS;

        /*
         * Radial displacement creates the gravity-well shape.
         * Tangential movement adds a slight space-time lensing curve
         * rather than simple cursor repulsion.
         */
        const radialWarp =
          normalized *
          normalized *
          DARK_FIELD_WARP *
          interactionStrength;

        const swirlWarp =
          Math.sin(normalized * Math.PI) *
          DARK_FIELD_SWIRL *
          interactionStrength;

        const normalX = dx / dist;
        const normalY = dy / dist;

        drawX +=
          normalX * radialWarp -
          normalY * swirlWarp;

        drawY +=
          normalY * radialWarp +
          normalX * swirlWarp;

        localInfluence = normalized;
      }

      const pulse =
        0.86 +
        Math.sin(time * star.speed + star.phase) * 0.14;

      const alpha =
        star.alpha *
        pulse *
        (1 + localInfluence * 0.36 * interactionStrength);

      const color = fieldColors[star.tone];

      if (star.glow) {
        fieldCtx.beginPath();
        fieldCtx.arc(
          drawX,
          drawY,
          star.radius * 3.5,
          0,
          Math.PI * 2
        );

        fieldCtx.fillStyle = color;
        fieldCtx.globalAlpha = alpha * 0.14;
        fieldCtx.fill();
      }

      fieldCtx.beginPath();
      fieldCtx.arc(
        drawX,
        drawY,
        star.radius,
        0,
        Math.PI * 2
      );

      fieldCtx.fillStyle = color;
      fieldCtx.globalAlpha = alpha;
      fieldCtx.fill();
    });
  }


  /* ── Light mode drawing ────────────────────────────────────────── */

  function getLightLinePoints(line, time) {
    const points = [];

    const baseY = line.yRatio * fieldHeight;
    const drift = time * 0.08;

    for (
      let x = -40;
      x <= fieldWidth + 40;
      x += 14
    ) {
      let drawX = x;

      let drawY =
        baseY +
        Math.sin(
          x * line.frequency +
          line.phase +
          drift
        ) * line.amplitude;

      const dx   = drawX - pointer.x;
      const dy   = drawY - pointer.y;
      const dist = Math.hypot(dx, dy);

      if (
        interactionStrength > 0.001 &&
        dist < LIGHT_FIELD_RADIUS &&
        dist > 0.001
      ) {
        const normalized =
          1 - dist / LIGHT_FIELD_RADIUS;

        /*
         * Lines bow around the pointer like heat currents or a
         * topographic field being gently disturbed.
         */
        const warp =
          normalized *
          normalized *
          LIGHT_FIELD_WARP *
          interactionStrength;

        drawY += (dy / dist) * warp;
        drawX += (dx / dist) * warp * 0.16;
      }

      points.push({
        x: drawX,
        y: drawY
      });
    }

    return points;
  }

  function strokeFieldLine(points, color, alpha, yOffset = 0) {
    if (!points.length) return;

    fieldCtx.beginPath();
    fieldCtx.moveTo(
      points[0].x,
      points[0].y + yOffset
    );

    for (let i = 1; i < points.length; i += 1) {
      fieldCtx.lineTo(
        points[i].x,
        points[i].y + yOffset
      );
    }

    fieldCtx.strokeStyle = color;
    fieldCtx.globalAlpha = alpha;
    fieldCtx.stroke();
  }

  function drawLightField(time) {
    fieldCtx.lineCap  = 'round';
    fieldCtx.lineJoin = 'round';

    lightLines.forEach((line, index) => {
      const points = getLightLinePoints(line, time);

      fieldCtx.lineWidth = index % 3 === 0 ? 1.35 : 1.05;

      strokeFieldLine(
        points,
        fieldColors.primary,
        index % 3 === 0 ? 0.18 : 0.115
      );

      if (line.highlight) {
        fieldCtx.lineWidth = 0.75;

        strokeFieldLine(
          points,
          fieldColors[line.highlight],
          line.highlight === 'secondary'
            ? 0.13
            : 0.17,
          -1.35
        );
      }
    });
  }


  /* ── Animation loop ─────────────────────────────────────────────── */

  function renderBodyField(now) {
    requestAnimationFrame(renderBodyField);

    if (
      document.hidden ||
      now - lastFrameTime < FRAME_INTERVAL
    ) {
      return;
    }

    lastFrameTime = now;

    const targetStrength =
      fieldIsVisible && pointerIsInside
        ? 1
        : 0;

    interactionStrength +=
      (targetStrength - interactionStrength) * 0.085;

    pointer.x +=
      (pointer.targetX - pointer.x) * 0.13;

    pointer.y +=
      (pointer.targetY - pointer.y) * 0.13;

    fieldCtx.clearRect(
      0,
      0,
      fieldWidth,
      fieldHeight
    );

    if (
      !fieldIsVisible &&
      interactionStrength < 0.005
    ) {
      return;
    }

    fieldCtx.globalAlpha = 1;

    const time = now * 0.001;

    if (currentTheme === 'light') {
      drawLightField(time);
    } else {
      drawDarkField(time);
    }

    fieldCtx.globalAlpha = 1;
  }


  /* ── Pointer tracking ───────────────────────────────────────────── */

  document.addEventListener(
    'mousemove',
    event => {
      pointer.targetX = event.clientX;
      pointer.targetY = event.clientY;
      pointerIsInside = true;
    },
    {
      passive: true
    }
  );

  document.documentElement.addEventListener(
    'mouseleave',
    () => {
      pointerIsInside = false;
    }
  );

  window.addEventListener(
    'blur',
    () => {
      pointerIsInside = false;
    }
  );


  /* ── Scroll visibility tracking ─────────────────────────────────── */

  let scrollFramePending = false;

  window.addEventListener(
    'scroll',
    () => {
      if (scrollFramePending) return;

      scrollFramePending = true;

      requestAnimationFrame(() => {
        updateBodyFieldVisibility();
        scrollFramePending = false;
      });
    },
    {
      passive: true
    }
  );


  /* ── Resize tracking ────────────────────────────────────────────── */

  let resizeTimer = null;

  window.addEventListener(
    'resize',
    () => {
      clearTimeout(resizeTimer);

      resizeTimer = setTimeout(() => {
        resizeBodyField();
        updateBodyFieldVisibility();
      }, 120);
    }
  );


  /* ── Theme-change tracking ──────────────────────────────────────── */

  const themeObserver = new MutationObserver(mutations => {
    const themeChanged = mutations.some(
      mutation =>
        mutation.type === 'attributes' &&
        mutation.attributeName === 'data-theme'
    );

    if (!themeChanged) return;

    currentTheme =
      document.documentElement.getAttribute('data-theme') === 'light'
        ? 'light'
        : 'dark';

    readBodyFieldColors();

    /*
     * Rebuild so the incoming theme begins with a clean,
     * correctly sized field.
     */
    buildDarkStars();
    buildLightLines();
  });

  themeObserver.observe(
    document.documentElement,
    {
      attributes: true,
      attributeFilter: ['data-theme']
    }
  );


  /* ── Initial setup ──────────────────────────────────────────────── */

  readBodyFieldColors();
  resizeBodyField();
  updateBodyFieldVisibility();

  requestAnimationFrame(renderBodyField);
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
  favicon.href = href;

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

  ufoBeam.setAttribute(
    'opacity',
    (beamProgress * 0.85).toFixed(3)
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
    scrub: true,

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

    themeToggle.setAttribute('aria-pressed', nextTheme === 'dark' ? 'true' : 'false');

    playThemeWipe(nextTheme, () => {
      applyTheme(nextTheme);
      swapTerrain(nextTheme);
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
initThemeToggle();
swapFavicon(document.documentElement.getAttribute('data-theme') || 'dark');
initIntro();
initStars();
initBodyField();
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
