// about.js
// Sonoran Cosmos — Kevin Fowler

// ── Interactive body environment ─────────────────────────────────────
//
// Page-owned About implementation.
//
// Cosmos:
//   Regular periwinkle dot grid pulled toward the cursor.
//
// Light:
//   Warm Sonoran particle field matching Home's daylight environment.
//
// The canvas geometry/stacking lives in about-base.css.
//
function initAboutBodyEnvironment() {
  const fieldCanvas = document.getElementById('body-environment');
  if (!fieldCanvas) return;

  const fieldCtx = fieldCanvas.getContext('2d', {
    alpha: true
  });

  if (!fieldCtx) return;

  const root = document.documentElement;

  const isTouchDevice =
    window.matchMedia('(hover: none) and (pointer: coarse)').matches;

  const reducedMotion =
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const canInteract =
    !isTouchDevice && !reducedMotion;


  // ── Shared gravity-field settings ────────────────────────────────

  const DOT_SPACING = 28;
  const DOT_RADIUS = 1;
  const DOT_FIELD_RADIUS = 180;
  const DOT_PULL = 0.17;

  const FRAME_INTERVAL = 1000 / 45;


  // ── Runtime state ────────────────────────────────────────────────

  let width = 0;
  let height = 0;
  let dpr = 1;

  let currentTheme = 'dark';

  let dirty = true;
  let lastFrameTime = 0;
  let resizeTimer = null;

  let palette = {
    gridDot: '#98A8D428'
  };

  const pointer = {
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,

    targetX: window.innerWidth / 2,
    targetY: window.innerHeight / 2,

    inside: false,
    strength: 0
  };


  // ── Theme + palette ──────────────────────────────────────────────

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
        '#98A8D428'
    };
  }


  // ── Canvas sizing ────────────────────────────────────────────────

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

    dirty = true;
  }


  // ── Cosmos: gravity-well dot grid ────────────────────────────────

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

          const distance =
            Math.hypot(
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


  // ── Light: Home's warm Sonoran particle field ───────────────────

  function drawLightParticles() {
    const spacing = 34;

    const originX =
      (width * 0.5) % spacing;

    const originY =
      (height * 0.5) % spacing;

    for (
      let y = originY - spacing;
      y < height + spacing;
      y += spacing
    ) {
      for (
        let x = originX - spacing;
        x < width + spacing;
        x += spacing
      ) {
        let drawX = x;
        let drawY = y;

        let scale = 1;
        let opacity = 0.3;

        if (pointer.strength > 0.001) {
          const diffX =
            pointer.x - x;

          const diffY =
            pointer.y - y;

          const dist =
            Math.hypot(diffX, diffY);

          if (
            dist < DOT_FIELD_RADIUS &&
            dist > 0.001
          ) {
            const normalized =
              1 -
              dist / DOT_FIELD_RADIUS;

            const influence = (
              normalized *
              normalized *
              (3 - 2 * normalized) *
              pointer.strength
            );

            drawX +=
              diffX *
              DOT_PULL *
              influence;

            drawY +=
              diffY *
              DOT_PULL *
              influence;

            scale +=
              0.4 * influence;

            opacity +=
              0.5 * influence;
          }
        }

        /*
         * Deterministic color variation.
         * Same spatial point always receives the same color.
         *
         * Majority: desert gold
         * Secondary: mesa orange
         * Accent: Sonoran teal
         */
        const hueHash =
          Math.sin(
            x * 0.1 +
            y * 0.13
          ) * 0.5 + 0.5;

        let hue;
        let sat;
        let light;

        if (hueHash < 0.55) {
          hue =
            38 +
            hueHash * 22;

          sat = 62;
          light = 56;

        } else if (hueHash < 0.88) {
          hue =
            24 +
            (hueHash - 0.55) * 28;

          sat = 58;
          light = 52;

        } else {
          hue =
            162 +
            (hueHash - 0.88) * 18;

          sat = 52;
          light = 48;
        }

        fieldCtx.globalAlpha =
          Math.min(0.85, opacity);

        fieldCtx.fillStyle =
          `hsla(${hue.toFixed(1)}, ${sat}%, ${light}%, 1)`;

        fieldCtx.beginPath();

        fieldCtx.arc(
          drawX,
          drawY,
          2.0 * scale,
          0,
          Math.PI * 2
        );

        fieldCtx.fill();
      }
    }

    fieldCtx.globalAlpha = 1;
  }


  // ── Theme renderer ───────────────────────────────────────────────

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


  // ── Animation loop ───────────────────────────────────────────────

  function renderBodyEnvironment(now) {
    requestAnimationFrame(
      renderBodyEnvironment
    );

    if (document.hidden) return;

    const targetStrength =
      canInteract && pointer.inside
        ? 1
        : 0;

    const previousX =
      pointer.x;

    const previousY =
      pointer.y;

    const previousStrength =
      pointer.strength;


    // Soft delayed field-following behavior.
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


  // ── Pointer tracking ─────────────────────────────────────────────

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


  // ── Resize handling ──────────────────────────────────────────────

  window.addEventListener(
    'resize',
    () => {
      clearTimeout(resizeTimer);

      resizeTimer =
        setTimeout(
          () => {
            resizeBodyEnvironment();
            drawBodyEnvironment();
          },
          120
        );
    }
  );


  // ── Live theme switching ─────────────────────────────────────────

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


  // ── Initial setup ────────────────────────────────────────────────

  readThemeAndPalette();
  resizeBodyEnvironment();
  drawBodyEnvironment();

  requestAnimationFrame(
    renderBodyEnvironment
  );
}

initAboutBodyEnvironment();


// ── Nav scroll state ─────────────────────────────────────────────────
const nav = document.querySelector('nav');
if (nav) {
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 50);
  }, { passive: true });
}

// ── Cursor ───────────────────────────────────────────────────────────
const cur = document.getElementById('cur');
if (cur) {
  document.addEventListener('mousemove', e => {
    cur.style.left = `${e.clientX}px`;
    cur.style.top  = `${e.clientY}px`;
  });
  document.addEventListener('mousedown', () => document.body.classList.add('clicking'));
  document.addEventListener('mouseup',   () => document.body.classList.remove('clicking'));
}

// ── Click ripple ─────────────────────────────────────────────────────
// @keyframes rippleOut lives in about.css
document.addEventListener('click', e => {
  const r = document.createElement('div');
  r.style.cssText = [
    'position:fixed',
    'width:10px', 'height:10px',
    'border-radius:50%',
    'border:1.5px solid var(--accent-aurora)',
    'transform:translate(-50%,-50%) scale(0)',
    'pointer-events:none',
    'z-index:9997',
    `left:${e.clientX}px`,
    `top:${e.clientY}px`,
    'animation:rippleOut 0.6s ease-out forwards'
  ].join(';');
  document.body.appendChild(r);
  setTimeout(() => r.remove(), 600);
});

// ── Scroll reveal ────────────────────────────────────────────────────
// Matches main.js's initScrollReveal(): 7% visibility threshold,
// 75ms stagger per element index, .in added once then unobserved.
const revealObs = new IntersectionObserver(entries => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      setTimeout(() => entry.target.classList.add('in'), i * 75);
      revealObs.unobserve(entry.target);
    }
  });
}, { threshold: 0.07 });

document.querySelectorAll('.reveal')
  .forEach(el => revealObs.observe(el));

  // ── Timeline scroll draw ─────────────────────────────────────────────
// Line draws down as user scrolls through the section.
// Progress only ever increases — once fully drawn it stays static.
const storyList = document.querySelector('.story-list');
if (storyList) {
  let maxProgress = 0;
  let done = false;

  const updateTimeline = () => {
    if (done) return;
    const rect    = storyList.getBoundingClientRect();
    const windowH = window.innerHeight;

    // 0 = top of list at bottom of viewport
    // 1 = bottom of list at top of viewport
    const total    = rect.height + windowH;
    const traveled = windowH - rect.top;
    const progress = Math.max(0, Math.min(1, (traveled / total) * 1.5));

    if (progress > maxProgress) {
      maxProgress = progress;
      storyList.style.setProperty('--line-progress', maxProgress);
    }

    if (maxProgress >= 1) {
      done = true;
      window.removeEventListener('scroll', updateTimeline);
    }
  };

  window.addEventListener('scroll', updateTimeline, { passive: true });
  updateTimeline(); // run once on load in case already in view
}

// ── Beam Me Up ───────────────────────────────────────────────────────
const beamUp     = document.getElementById('beamUp');
const beamStreak = document.getElementById('beam-streak');
const beamFlash  = document.getElementById('beam-flash');

if (beamUp) {
  window.addEventListener('scroll', () => {
    beamUp.classList.toggle('visible', window.scrollY > 400);
  }, { passive: true });

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

// ── End Of File typewriter ───────────────────────────────────────────
const eofKicker      = document.getElementById('eof-kicker');
const eofStatus      = document.getElementById('eof-status');
const statusCursor   = document.querySelector('.status-cursor');
const closingSection = document.querySelector('.about-closing');
const closingCard    = document.querySelector('.closing-card-reveal');

if (eofKicker && closingSection) {
  const EOF_TEXT    = 'End Of File';
  const STATUS_TEXT = 'Status: Available for opportunities and collaborations.';
  const EOF_MS      = 150;
  const STATUS_MS   = 50;
  const PAUSE_MS    = 300;
  let hasRun = false;

  const eofObs = new IntersectionObserver(entries => {
    if (!entries[0].isIntersecting || hasRun) return;
    hasRun = true;
    eofObs.disconnect();

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      eofKicker.textContent = EOF_TEXT;
      if (eofStatus) eofStatus.textContent = STATUS_TEXT;
      if (statusCursor) statusCursor.classList.add('active');
      if (closingCard) closingCard.classList.add('in');
      return;
    }

    // Step 1: cursor on kicker, type EOF
    eofKicker.classList.add('cursor-active');
    let i = 0;
    const typeEOF = () => {
      eofKicker.textContent = EOF_TEXT.slice(0, ++i);
      if (i < EOF_TEXT.length) {
        setTimeout(typeEOF, EOF_MS);
      } else {
        // EOF done — remove cursor from kicker
        eofKicker.classList.remove('cursor-active');

        // Step 2: pause, then cursor on status, type status
        setTimeout(() => {
          if (statusCursor) statusCursor.classList.add('active');
          let j = 0;
          const typeStatus = () => {
            if (eofStatus) eofStatus.textContent = STATUS_TEXT.slice(0, ++j);
            if (j < STATUS_TEXT.length) {
              setTimeout(typeStatus, STATUS_MS);
            } else {
              // Status done — cursor stays, card fades in
              setTimeout(() => {
                if (closingCard) closingCard.classList.add('in');
              }, PAUSE_MS);
            }
          };
          typeStatus();
        }, PAUSE_MS);
      }
    };

    setTimeout(typeEOF, 200);
  }, { threshold: 0.3 });

  eofObs.observe(closingSection);
}
