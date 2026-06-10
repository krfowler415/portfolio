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
 *  § 5   Terrain Parallax
 *  § 6   UFO Scroll Animation
 *  § 7   Navigation
 *  § 8   Custom Cursor
 *  § 9   Click Ripple
 *  § 10  Case Study Strip
 *  § 11  Scroll Reveal
 *  § 12  Card Tilt
 *  § 13  Resize & Orientation Handlers
 *  § 14  Boot Sequence
 * =====================================================================
 */


/* =====================================================================
 * § 1  CONSTANTS & DOM REFERENCES
 *
 *  All shared constants and DOM node references.
 *  Declared at module scope so every init function can access them.
 *
 *  UFO position constants (introX / introXvw) are shared between the intro overlay AND the UFO scroll waypoints — they must agree on the UFO's starting position to produce a seamless transition.
 * ===================================================================== */

// ── Device / preference flags ─────────────────────────────────────────────────
/** True on touch-only devices — disables mouse-dependent features */
const isTouchDevice = window.matchMedia('(hover: none) and (pointer: coarse)').matches;

/** True when the OS requests reduced motion — skips intro animation */
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ── UFO initial position ──────────────────────────────────────────────────────
// Offset 100px left to visually center the 200px-wide UFO SVG on screen.
// introX / introY are pixel values used by GSAP.
// introXvw / introYvh are percentage values used by the waypoint system.
const introX   = window.innerWidth / 2 - 100;
const introY   = window.innerHeight * 0.12;
const introXvw = (introX / window.innerWidth) * 100;
const introYvh = 12;

// ── Intro gate state ──────────────────────────────────────────────────────────
// Three independent conditions must ALL be true before the outro fires.
// This prevents the outro from triggering before assets are ready OR
// before the minimum display time has elapsed.
let ufoIntroComplete = false;   // enables UFO scroll once intro completes
let minTimeDone      = false;   // true after 2800ms minimum display time
let assetsDone       = false;   // true after terrain/parallax are initialised
let introFired       = false;   // prevents the outro from firing twice
let scanTween        = null;    // reference to the looping scan line tween

// ── DOM references ────────────────────────────────────────────────────────────
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
 *
 *  Sets --vh as a CSS custom property equal to 1% of window.innerHeight.
 *
 *  Why not svh / dvh / lvh?
 *  These units have cross-browser inconsistencies, especially between
 *  Firefox and Chrome across different display scales and zoom levels.
 *  window.innerHeight always returns the correct visible viewport height.
 *
 *  CSS usage: calc(var(--vh) * 100)  replaces  100svh
 * ===================================================================== */

/**
 * Reads window.innerHeight and writes it as --vh to the root element.
 * Called once on boot and again on every resize / orientation change.
 */
function setViewportHeight() {
  document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
}


/* =====================================================================
 * § 3  INTRO OVERLAY
 *
 *  Full-screen takeover that plays on page load.
 *
 *  Sequence overview:
 *    1. UFO hovers with a float animation
 *    2. Tractor beam activates and breathes
 *    3. Particles rise from the screen toward the beam (two phases)
 *    4. Scan line sweeps down the beam on a loop
 *    5. After 2800ms minimum + assets ready → playIntroOutro() fires
 *    6. Glitch + flash transition drops the user into the hero
 *
 *  Gate mechanism (minTimeDone + assetsDone + introFired):
 *    Prevents the outro from playing before the terrain has loaded
 *    AND before the minimum display time has elapsed.
 * ===================================================================== */

/**
 * Creates particle bubble elements and appends them to #intro-pts.
 * Each particle rises from a random screen position toward the UFO beam.
 * Position, size, speed, drift, and rise distance are all randomised.
 *
 * CSS custom properties --drift and --rise are set per-particle so the @keyframes iptRise animation in style.css can read them.
 *
 * @param {number} count     - Number of particles to spawn
 * @param {number} speedMult - Animation speed multiplier (1 = normal, 6 = frantic)
 */
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

/**
 * Animates the intro scan line sweeping down the length of the tractor beam.
 * Loops indefinitely via onComplete recursion.
 * Stored in scanTween so it can be killed when the outro begins.
 */
function runScan() {
  scanTween = gsap.fromTo(
    iScan,
    { attr: { y1: 38, y2: 38 }, opacity: 0.9 },
    { attr: { y1: 560, y2: 560 }, opacity: 0, duration: 1.8, ease: 'power1.in', onComplete: runScan }
  );
}

/**
 * Checks whether all gate conditions are met and fires the outro once.
 * Called from two places: the 2800ms timer AND after assets are ready.
 * introFired prevents a race condition where both fire at the same time.
 */
function tryStartOutro() {
  if (minTimeDone && assetsDone && !introFired) {
    introFired = true;
    playIntroOutro();
  }
}

/**
 * Plays the full intro outro sequence via a GSAP timeline.
 *
 * Steps:
 *   1.  Beam locks to full opacity
 *   2.  Screen shakes (abduction force — 6 keyframes)
 *   3.  UFO rushes toward viewer (scale 4.2×, ease power3.in)
 *   4.  Glitch sequence — 8 rapid hue/skew/brightness distortion frames
 *   5.  Scanlines flash on and off
 *   6.  White aurora flash covers the screen
 *   7.  Under the flash: #intro hides, hero UFO snaps to position
 *   8.  Flash fades out — ufoIntroComplete set, UFO scroll enabled
 */
function playIntroOutro() {
  if (scanTween) scanTween.kill();
  gsap.killTweensOf(introWrap);
  gsap.set(introWrap, { transformOrigin: '50% 48%' });
  gsap.set(iScan, { opacity: 0 });

  const flash = document.getElementById('intro-flash');

  // Final frantic burst before the pull-up
  spawnParticles(90, 6);

  const tl = gsap.timeline({
    onComplete() {
      document.body.style.overflow = '';
      ScrollTrigger.refresh();
    }
  });

  tl
    // Beam locks fully on
    .to(iBeam, { opacity: 1, duration: 0.2, ease: 'power2.in' })

    // Screen shake — you're being grabbed
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

    // Rush toward the UFO — it scales up as you're pulled in
    .to(introWrap, { scale: 4.2, duration: 0.75, ease: 'power3.in' })
    .to(introGlow, { opacity: 0.95, duration: 0.3 }, '<')

    // Glitch — 8 rapid distortion frames (hue + skew + brightness)
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

    // Flash transition to the hero
    .to(flash, { opacity: 1, duration: 0.1 })
    .add(() => {
      // Swap scenes under the flash — instant, invisible to the user
      introEl.style.display = 'none';
      gsap.set(heroUfo, { x: introX, y: introY, opacity: 1, force3D: false });
    })
    .to(flash, {
      opacity: 0,
      duration: 1.1,
      ease: 'power2.out',
      onComplete: () => { ufoIntroComplete = true; }
    }, '+=0.05');
}

/**
 * Initialises the intro overlay.
 *
 * Reduced-motion path: hides intro instantly, positions UFO, sets
 * ufoIntroComplete so the scroll handler works immediately.
 *
 * Normal path: locks body scroll, positions UFO off-screen, starts
 * all intro animations, and arms the 2800ms minimum-time gate.
 */
function initIntro() {
  if (reducedMotion) {
    // Skip animation — respect OS preference
    introEl.style.display = 'none';
    gsap.set(heroUfo, { x: introX, y: introY, opacity: 1, force3D: false });
    ufoIntroComplete = true;   // BUG FIX: was missing — UFO scroll was permanently blocked
    return;
  }

  // Lock scroll so the user can't bypass the intro
  document.body.style.overflow = 'hidden';   // BUG FIX: was missing

  // UFO starts above the viewport
  gsap.set(heroUfo, { x: introX, y: -200, opacity: 0, force3D: false });

  // UFO hover float begins immediately
  gsap.set(introWrap, { opacity: 1 });
  gsap.to(introWrap, { y: -10, duration: 2.2, ease: 'sine.inOut', repeat: -1, yoyo: true });

  // Beam activates after a short delay, then breathes
  gsap.to(iBeam,     { opacity: 1, duration: 0.65, ease: 'power2.out', delay: 0.4 });
  gsap.to(introGlow, { opacity: 1, duration: 0.9, delay: 0.4 });
  gsap.to(iBeam,     { opacity: 0.65, duration: 1.4, ease: 'sine.inOut', repeat: -1, yoyo: true, delay: 1.1 });

  // Scan line starts
  setTimeout(() => runScan(), 400);

  // Phase 1 — gentle particle trickle
  spawnParticles(35, 1);

  // Phase 2 — abduction intensifies at 1200ms
  setTimeout(() => {
    if (introFired) return;   // outro already fired — don't add more particles
    spawnParticles(55, 2.5);
    gsap.to(introGlow, { opacity: 0.8, duration: 1.2 });
  }, 1200);

  // Minimum display time gate — opens at 2800ms
  setTimeout(() => { minTimeDone = true; tryStartOutro(); }, 2800);
}


/* =====================================================================
 * § 4  STAR FIELD CANVAS
 *
 *  380 glowing star particles rendered on a <canvas> element.
 *  Stars drift slowly with random velocity and twinkle via a sine phase.
 *  Mouse proximity creates a repulsion force within a 700px radius.
 *
 *  Colors are biased toward the three portfolio color families:
 *    45%  aether blue-cyan   (~183°)
 *    45%  cosmos purple      (~268°)
 *    10%  pulsar warm-orange (~22°)
 * ===================================================================== */

const canvas = document.getElementById('stars');
const ctx    = canvas.getContext('2d');

let canvasW, canvasH;
let stars    = [];
let mousePos = { x: -9999, y: -9999 };   // far off-screen = no repulsion

const STAR_COUNT = 380;

/**
 * Resizes the canvas bitmap to match its CSS display size.
 * Must be called on init and on every resize to prevent blurry pixels.
 */
function resizeCanvas() {
  canvasW = canvas.width  = canvas.offsetWidth;
  canvasH = canvas.height = canvas.offsetHeight;
}

/**
 * Returns a random hue value biased toward the portfolio color families.
 * @returns {number} Hue value in degrees (0–360)
 */
function randomStarHue() {
  const r = Math.random();
  if (r < 0.45) return 183 + (Math.random() - 0.5) * 14;   // aether blue-cyan
  if (r < 0.90) return 268 + (Math.random() - 0.5) * 18;   // cosmos purple
  return 22 + (Math.random() - 0.5) * 12;                   // pulsar warm-orange
}

/**
 * Populates the stars array with STAR_COUNT particle objects.
 * Called on init and on resize (redistributes particles across new dimensions).
 *
 * Each star: { x, y, vx, vy, r, phase, speed, hue }
 *   x, y      position in pixels
 *   vx, vy    velocity (pixels per frame)
 *   r         radius in pixels (1.5–4)
 *   phase     current angle in twinkle sine cycle (radians)
 *   speed     twinkle oscillation rate
 *   hue       color hue from randomStarHue()
 */
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

/**
 * Main canvas animation loop — driven by requestAnimationFrame.
 *
 * Per frame, for each star:
 *   1. Apply mouse repulsion (inverse-square-like, 700px radius)
 *   2. Apply friction (0.96×) and random drift to velocity
 *   3. Move by velocity
 *   4. Wrap off-canvas stars back to a random position
 *   5. Advance the twinkle phase
 *   6. Draw a soft radial glow halo (4× radius)
 *   7. Draw a solid bright core circle (1× radius)
 */
function drawStars() {
  ctx.clearRect(0, 0, canvasW, canvasH);

  stars.forEach(star => {
    // Mouse repulsion — pushes stars away within 700px
    const dx   = star.x - mousePos.x;
    const dy   = star.y - mousePos.y;
    const dist = Math.hypot(dx, dy);

    if (dist < 700 && dist > 0) {
      const force = ((700 - dist) / 700) * 0.3;
      star.vx += (dx / dist) * force;
      star.vy += (dy / dist) * force;
    }

    // Friction + micro-drift to prevent stars from stopping
    star.vx = star.vx * 0.96 + (Math.random() - 0.5) * 0.1;
    star.vy = star.vy * 0.96 + (Math.random() - 0.5) * 0.1;

    // Move
    star.x += star.vx;
    star.y += star.vy;

    // Wrap — stars that leave the canvas re-enter at a new random position
    if (star.x < -10 || star.x > canvasW + 10 || star.y < -10 || star.y > canvasH + 10) {
      star.x  = Math.random() * canvasW;
      star.y  = Math.random() * canvasH;
      star.vx = (Math.random() - 0.5) * 0.3;
      star.vy = (Math.random() - 0.5) * 0.3;
    }

    // Twinkle — oscillates between 0.2 (dim) and 0.95 (bright)
    star.phase += star.speed * 0.02;
    const pulse = 0.2 + Math.abs(Math.sin(star.phase)) * 0.75;

    // Soft glow halo (4× radius, fades to transparent)
    const glow = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, star.r * 4);
    glow.addColorStop(0, `hsla(${star.hue}, 80%, 70%, ${(pulse * 0.5).toFixed(3)})`);
    glow.addColorStop(1, `hsla(${star.hue}, 80%, 70%, 0)`);
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.r * 4, 0, Math.PI * 2);
    ctx.fillStyle = glow;
    ctx.fill();

    // Solid bright core
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
    ctx.fillStyle = `hsla(${star.hue}, 90%, 80%, ${pulse.toFixed(3)})`;
    ctx.fill();
  });

  requestAnimationFrame(drawStars);
}

/**
 * Initialises the star field:
 *   1. Sizes the canvas to its CSS dimensions
 *   2. Populates the star array
 *   3. Starts the animation loop
 *   4. Attaches mouse tracking (desktop only — guarded by isTouchDevice)
 */
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
 * § 5  TERRAIN PARALLAX
 *
 *  The terrain SVG is fetched asynchronously from terrain.svg in the repo root and injected into .hero-terrain at runtime.
 *
 *  Layers d-l2 through d-l6 are <g> elements inside the SVG.
 *  Each moves at a different speed to create parallax depth.
 *
 *  d-l1 is the light mode terrain layer — intentionally excluded.
 *
 *  Speed values are negative — layers move upward as user scrolls down, making far layers appear slower than near ones.
 * ===================================================================== */

/**
 * Sets up ScrollTrigger parallax for the five terrain depth layers.
 * Called only after the SVG has been injected into the DOM by fetchTerrain().
 * Each layer is null-guarded in case the SVG structure changes.
 */
function initParallax() {
  const layers = [
    { id: 'd-l2', speed: -0.40 },
    { id: 'd-l3', speed: -0.50 },
    { id: 'd-l4', speed: -0.60 },
    { id: 'd-l5', speed: -0.70 },   /* foreground */
    { id: 'd-l6', speed: -0.70 },   /* foreground details (cacti, etc.) */
  ];

  layers.forEach(({ id, speed }) => {
    const el = document.getElementById(id);
    if (!el) return;
    gsap.to(el, {
      y: () => ScrollTrigger.maxScroll(window) * -speed,
      ease: 'none',
      scrollTrigger: {
        trigger: '#hero',
        start: 'top top',
        end: 'bottom bottom',
        scrub: true,
      }
    });
  });
}

/**
 * Fetches terrain.svg from the repo root, injects it into .hero-terrain, then initialises parallax and opens the intro outro gate.
 *
 * Async order matters: initParallax() must run AFTER the SVG is in the DOM or all getElementById calls return null and parallax silently fails.
 *
 * The catch handler still sets assetsDone so the intro never hangs indefinitely if the fetch fails (e.g. offline or 404).
 */
function fetchTerrain() {
  fetch('./terrain.svg')
    .then(res => res.text())
    .then(svgText => {
      document.querySelector('.hero-terrain').innerHTML = svgText;
      initParallax();
      ScrollTrigger.refresh();
      assetsDone = true;
      tryStartOutro();
    })
    .catch(err => {
      console.warn('Terrain SVG failed to load:', err);
      assetsDone = true;
      tryStartOutro();
    });
}


/* =====================================================================
 * § 6  UFO SCROLL ANIMATION
 *
 *  Moves the UFO along a curved path through the hero as the user scrolls. Position is determined by interpolating between waypoints.
 *
 *  Waypoints are [progress, x (vw%), y (vh%)] tuples where progress is a 0–1 value matching ScrollTrigger's self.progress.
 *
 *  The first two waypoints use introXvw / introYvh to ensure the UFO starts exactly where the intro animation left it — no jump.
 * ===================================================================== */

/**
 * UFO flight path waypoints — [progress, x (vw%), y (vh%)]
 *
 *  0.00 → 0.05  hold at intro landing position
 *  0.05 → 0.12  drift left and down, entering the scene
 *  0.12 → 0.54  arc across the sky from left to center
 *  0.54 → 1.00  settle into hover position above the terrain
 */
const ufoWaypoints = [
  [0.00, introXvw,       introYvh    ],
  [0.05, introXvw - 10,  introYvh + 4],
  [0.12,  5,  15],
  [0.18, 18,   8],
  [0.24, 30,  18],
  [0.30, 40,  10],
  [0.38, 46,  20],
  [0.46, 42,  28],
  [0.54, 38,  38],
  [0.72, 38,  52],
  [0.86, 38,  58],
  [1.00, 38,  58],
];

/**
 * Linear interpolation between two values.
 * @param {number} a - Start value
 * @param {number} b - End value
 * @param {number} t - Interpolation factor (0–1)
 * @returns {number}
 */
function lerp(a, b, t) { return a + (b - a) * t; }

/**
 * Returns the UFO's position as { x, y } percentages for a given scroll progress by finding the enclosing waypoint pair and interpolating.
 *
 * @param {number} progress - ScrollTrigger progress value (0–1)
 * @returns {{ x: number, y: number }} Position in vw% and vh%
 */
function getUfoPos(progress) {
  for (let i = 0; i < ufoWaypoints.length - 1; i++) {
    const [p0, x0, y0] = ufoWaypoints[i];
    const [p1, x1, y1] = ufoWaypoints[i + 1];

    if (progress >= p0 && progress <= p1) {
      const t = (progress - p0) / (p1 - p0);
      return { x: lerp(x0, x1, t), y: lerp(y0, y1, t) };
    }
  }
  // Fallback — return the final waypoint if progress exceeds all segments
  const last = ufoWaypoints[ufoWaypoints.length - 1];
  return { x: last[1], y: last[2] };
}

/**
 * Initialises the UFO scroll animation via a GSAP ScrollTrigger.
 *
 * Per scroll update:
 *   - getUfoPos() interpolates the UFO's position from waypoints
 *   - Aspect ratio clamp prevents UFO from sinking too low on wide screens
 *   - Tractor beam fades in from 50%–65% scroll progress
 *   - .hovering class enables the CSS float animation once UFO settles
 *
 * Guarded by ufoIntroComplete — prevents the UFO from jumping during the intro animation if the user scrolls early.
 */
function initUfoScroll() {
  ScrollTrigger.create({
    trigger: '#hero',
    start: 'top top',
    end: 'bottom bottom',
    scrub: true,
    onUpdate: self => {
      if (!ufoIntroComplete) return;

      const progress = self.progress;
      const { x, y } = getUfoPos(progress);

      const xPx = (x / 100) * window.innerWidth;

      // Clamp y so UFO stays in the sky on ultra-wide / landscape-tall screens
      const aspectRatio = window.innerWidth / window.innerHeight;
      const maxYpct     = aspectRatio > 2 ? 0.38 : aspectRatio > 1.6 ? 0.44 : 0.52;
      const yPx         = Math.min((y / 100) * window.innerHeight, maxYpct * window.innerHeight);

      heroUfo.style.transform = `translate(${xPx}px, ${yPx}px)`;

      // Tractor beam: fades in from progress 0.50 → 0.65 (15% window)
      const beamProgress = Math.min(Math.max((progress - 0.50) / 0.15, 0), 1);
      ufoBeam.setAttribute('opacity', (beamProgress * 0.85).toFixed(3));

      // Hover float animation: on when UFO reaches its settled position
      heroUfo.classList.toggle('hovering', progress >= 0.45);
    }
  });
}


/* =====================================================================
 * § 7  NAVIGATION
 *
 *  Toggles the .scrolled class on <nav> as the page scrolls.
 *  .scrolled activates the glass panel style in CSS:
 *  backdrop-filter blur + aurora teal border glow.
 * ===================================================================== */

/**
 * Attaches a ScrollTrigger that adds/removes .scrolled from <nav> based on whether window scroll position exceeds 50px.
 */
function initNav() {
  const nav = document.querySelector('nav');

  ScrollTrigger.create({
    start: 'top -50',
    onUpdate: self => {
      nav.classList.toggle('scrolled', self.scroll() > 50);
    }
  });
}


/* =====================================================================
 * § 8  CUSTOM CURSOR
 *
 *  Moves the #cur element to follow the mouse.
 *  body.clicking scales the dot on mousedown for tactile feedback.
 *  Only runs on non-touch devices — isTouchDevice guard.
 * ===================================================================== */

/**
 * Initialises the custom cursor.
 * Skips initialisation entirely on touch devices.
 */
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
 *
 *  Creates a circular ripple element at each click position.
 *  The element expands outward via @keyframes rippleOut in style.css, then removes itself after 600ms.
 *
 *  NOTE: The previous JS-side style injection block (document.createElement('style') + @keyframes) has been removed.
 *  @keyframes rippleOut now lives permanently in style.css.
 * ===================================================================== */

/**
* Attaches a global click listener that spawns a ripple div at the click coordinates. The ripple is positioned fixed, pointer-events none, so it never interferes with underlying click targets. 
*/
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
 *
 *  Horizontally scrollable case study card strip with:
 *    - Live progress bar (scroll position → width percentage)
 *    - Snap-to-card (settles to nearest card after 150ms idle)
 *    - Click-to-drag with hasDragged guard (prevents link misfire)
 *    - Prev/Next arrow navigation with custom smooth scroll + animation
 * ===================================================================== */

/**
 * Adds the .animate class to an arrow button, triggering its stroke-drawing and chevron-slide CSS animation. Removes it after 1600ms (matching the longest animation duration in the keyframe set).
 *
 * @param {HTMLElement} btn - The .cs-arrow button element
 */
function animateArrow(btn) {
  btn.classList.add('animate');
  setTimeout(() => btn.classList.remove('animate'), 1600);
}

/**
 * Smoothly scrolls a strip element to a target scrollLeft position.
 * Uses an ease-in-out quad curve for a natural deceleration feel.
 *
 * @param {HTMLElement} strip    - The scrollable container
 * @param {number}      target   - Target scrollLeft in pixels
 * @param {number}      duration - Animation duration in milliseconds
 */
function smoothScrollTo(strip, target, duration) {
  const start = strip.scrollLeft;
  const dist  = target - start;
  const t0    = performance.now();

  (function step(now) {
    const p = Math.min((now - t0) / duration, 1);
    const e = p < 0.5 ? 2 * p * p : -1 + (4 - 2 * p) * p;   // ease-in-out quad
    strip.scrollLeft = start + dist * e;
    if (p < 1) requestAnimationFrame(step);
  })(performance.now());
}

/**
 * Initialises all case study strip interactions.
 * Exits early if #csStrip is not present in the DOM.
 */
function initCaseStudyStrip() {
  const strip    = document.getElementById('csStrip');
  const progress = document.getElementById('csProgress');
  const prevBtn  = document.getElementById('csPrev');
  const nextBtn  = document.getElementById('csNext');

  if (!strip) return;

  // ── Helper: card width including gap ──────────────────────────────
  const getCardWidth = () => (strip.querySelector('.cs-card')?.offsetWidth || 0) + 24;

  // ── Progress bar + snap-to-card ────────────────────────────────────
  let snapTimeout;
  let isSnapping = false;

  strip.addEventListener('scroll', () => {
    // Update progress bar width as a percentage of total scrollable distance
    const max = strip.scrollWidth - strip.clientWidth;
    if (progress) {
      progress.style.width = (max > 0 ? (strip.scrollLeft / max) * 100 : 0) + '%';
    }

    // Snap to nearest card after scroll has been idle for 150ms
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

  // ── Click-to-drag ──────────────────────────────────────────────────
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
      // After drag release, snap to the card the user most intended to land on
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
    // Only register as a drag if cursor moved more than 5px
    if (Math.abs(walk) > 5) { hasDragged = true; e.preventDefault(); }
    strip.scrollLeft = scrollLeft - walk * 1.1;
  });

  // Suppress click events that follow a drag (prevents accidental link navigation)
  strip.addEventListener('click', e => {
    if (hasDragged) { e.preventDefault(); e.stopPropagation(); }
  }, true);

  // ── Arrow buttons ──────────────────────────────────────────────────
  prevBtn?.addEventListener('click', () => {
    animateArrow(prevBtn);
    const target = Math.max(0, (Math.round(strip.scrollLeft / getCardWidth()) - 1) * getCardWidth());
    smoothScrollTo(strip, target, 500);
  });

  nextBtn?.addEventListener('click', () => {
    animateArrow(nextBtn);
    const target = (Math.round(strip.scrollLeft / getCardWidth()) + 1) * getCardWidth();
    smoothScrollTo(strip, target, 500);
  });
}


/* =====================================================================
 * § 11  SCROLL REVEAL
 *
 *  Uses IntersectionObserver to trigger entrance animations on elements with .reveal, .reveal-left, or .reveal-right classes.
 *
 *  When 7% of an element enters the viewport, the .in class is added after a stagger delay (75ms × element index in the current batch).
 
 *  Elements are unobserved after triggering — animation plays once only.
 * ===================================================================== */

/**
 * Initialises the scroll reveal IntersectionObserver and attaches it to all .reveal, .reveal-left, and .reveal-right elements.
 */
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
 *
 *  Applies a subtle 3D perspective tilt to .card-feat elements as the cursor moves across their parent .card-tilt-wrap.
 *
 *  Rotation calculation:
 *    rotateX  vertical axis tilt (±3°, sign inverted for natural feel)
 *    rotateY  horizontal axis tilt (±3°)
 *    translateY  slight lift (-4px) to reinforce the 3D effect
 *
 *  mouseleave smoothly returns the card to its resting state using a cubic-bezier curve (0.23, 1, 0.32, 1) — fast out, slow settle.
 *
 *  Skipped entirely when prefers-reduced-motion is active.
 * ===================================================================== */

/**
 * Attaches 3D tilt mousemove/mouseleave handlers to all case study cards.
 * Skips if reducedMotion is true.
 */
function initCardTilt() {
  if (reducedMotion) return;

  document.querySelectorAll('.card-tilt-wrap').forEach(wrap => {
    const inner = wrap.querySelector('.card-feat');
    if (!inner) return;

    wrap.addEventListener('mousemove', e => {
      const rect = wrap.getBoundingClientRect();
      const rx   = ((e.clientY - rect.top)  / rect.height - 0.5) * -6;   // vertical tilt
      const ry   = ((e.clientX - rect.left) / rect.width  - 0.5) *  6;   // horizontal tilt

      inner.style.transition = 'transform 0.1s ease';
      inner.style.transform  = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-4px)`;
    });

    wrap.addEventListener('mouseleave', () => {
      inner.style.transition = 'transform 0.6s cubic-bezier(0.23, 1, 0.32, 1)';
      inner.style.transform  = '';
    });
  });
}


/* =====================================================================
 * § 13  RESIZE & ORIENTATION HANDLERS
 *
 *  Consolidated into a single function to avoid multiple fragmented
 *  listeners. Previously split across two separate resize listeners.
 *
 *  On resize: updates --vh, redraws canvas, refreshes ScrollTrigger.
 *  On orientation change: same as resize but with a 100ms delay to
 *  allow the browser to complete the rotation before measuring.
 * ===================================================================== */

/**
 * Attaches consolidated resize and orientation change event handlers.
 * Covers: viewport height token, star canvas, and ScrollTrigger positions.
 */
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
 * § 14  BOOT SEQUENCE
 *
 *  Calls all init functions in dependency order.
 *
 *  Order constraints:
 *    gsap.registerPlugin   must precede any ScrollTrigger usage
 *    setViewportHeight     must run before CSS --vh is consumed
 *    initIntro             starts animation immediately on load
 *    initStars             starts canvas rAF loop
 *    fetchTerrain          async — fetches SVG, then calls initParallax(), ScrollTrigger.refresh(), assetsDone, tryStartOutro()
 *    initUfoScroll         creates UFO ScrollTrigger (after parallax)
 *    initNav               creates nav ScrollTrigger
 *    initResizeHandlers    must come last (ScrollTrigger must exist first)
 * ===================================================================== */

gsap.registerPlugin(ScrollTrigger);

setViewportHeight();
initIntro();
initStars();
fetchTerrain();   // async — parallax init and intro gate live inside this
initUfoScroll();
initNav();
initCursor();
initClickRipple();
initCaseStudyStrip();
initScrollReveal();
initCardTilt();
initResizeHandlers();
