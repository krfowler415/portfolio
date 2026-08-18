// js/body-gravity-well.js
// Shared interactive dotted gravity-well background
// Used by secondary portfolio pages.

(() => {
  const canvas = document.getElementById('body-environment');
  if (!canvas) return;

  const ctx = canvas.getContext('2d', {
    alpha: true
  });

  if (!ctx) return;

  const root = document.documentElement;

  const reducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;

  const coarsePointer = window.matchMedia(
    '(pointer: coarse)'
  ).matches;

  const canInteract = !reducedMotion && !coarsePointer;


  /* ── Match Home gravity-well values ───────────────────── */

  const DOT_SPACING = 28;
  const DOT_RADIUS = 1;
  const DOT_FIELD_RADIUS = 180;
  const DOT_PULL = 0.17;

  const FRAME_INTERVAL = 1000 / 45;


  /* ── Canvas state ──────────────────────────────────────── */

  let width = 0;
  let height = 0;
  let dpr = 1;

  let dotColor = '#98A8D428';

  let lastFrameTime = 0;
  let frameId = null;
  let dirty = true;


  /* ── Pointer state ─────────────────────────────────────── */

  const pointer = {
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,

    targetX: window.innerWidth / 2,
    targetY: window.innerHeight / 2,

    inside: false,
    strength: 0
  };


  /* ── Read current CSS color ────────────────────────────── */

  function readPalette() {
    const styles = getComputedStyle(root);

    dotColor =
      styles.getPropertyValue('--body-grid-dot').trim() ||
      '#98A8D428';
  }


  /* ── Canvas sizing ─────────────────────────────────────── */

  function resizeCanvas() {
    width = window.innerWidth;
    height = window.innerHeight;

    dpr = Math.min(
      window.devicePixelRatio || 1,
      1.75
    );

    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);

    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx.setTransform(
      dpr,
      0,
      0,
      dpr,
      0,
      0
    );

    dirty = true;
  }


  /* ── Draw dotted gravity field ─────────────────────────── */

  function drawGrid() {
    ctx.clearRect(
      0,
      0,
      width,
      height
    );

    const originX =
      (width * 0.5) % DOT_SPACING;

    const originY =
      (height * 0.5) % DOT_SPACING;

    ctx.fillStyle = dotColor;

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

            const influence =
              normalized *
              normalized *
              (3 - 2 * normalized) *
              pointer.strength;

            drawX +=
              differenceX *
              DOT_PULL *
              influence;

            drawY +=
              differenceY *
              DOT_PULL *
              influence;

            scale +=
              0.35 *
              influence;

            opacity +=
              0.45 *
              influence;
          }
        }

        ctx.globalAlpha =
          Math.min(1, opacity);

        ctx.beginPath();

        ctx.arc(
          drawX,
          drawY,
          DOT_RADIUS * scale,
          0,
          Math.PI * 2
        );

        ctx.fill();
      }
    }

    ctx.globalAlpha = 1;
  }


  /* ── Animation scheduler ───────────────────────────────── */

  function requestFrame() {
    if (frameId !== null) return;

    frameId =
      requestAnimationFrame(render);
  }


  function render(now) {
    frameId = null;

    if (document.hidden) {
      return;
    }

    if (
      now - lastFrameTime <
      FRAME_INTERVAL
    ) {
      requestFrame();
      return;
    }

    lastFrameTime = now;

    const previousX =
      pointer.x;

    const previousY =
      pointer.y;

    const previousStrength =
      pointer.strength;


    /* Soft delayed cursor following */

    pointer.x +=
      (pointer.targetX - pointer.x) *
      0.14;

    pointer.y +=
      (pointer.targetY - pointer.y) *
      0.14;


    /* Fade interaction in/out */

    const targetStrength =
      canInteract && pointer.inside
        ? 1
        : 0;

    pointer.strength +=
      (targetStrength - pointer.strength) *
      0.10;


    const stillMoving =
      (
        Math.abs(pointer.x - previousX) +
        Math.abs(pointer.y - previousY) +
        Math.abs(
          pointer.strength -
          previousStrength
        )
      ) > 0.03;


    if (dirty || stillMoving) {
      drawGrid();
      dirty = false;
    }


    if (stillMoving) {
      requestFrame();
    }
  }


  /* ── Pointer events ────────────────────────────────────── */

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

        requestFrame();
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

        requestFrame();
      }
    );


    window.addEventListener(
      'blur',
      () => {
        pointer.inside = false;

        dirty = true;

        requestFrame();
      }
    );
  }


  /* ── Resize ────────────────────────────────────────────── */

  let resizeTimer = null;

  window.addEventListener(
    'resize',
    () => {
      clearTimeout(resizeTimer);

      resizeTimer =
        setTimeout(() => {
          resizeCanvas();
          drawGrid();
        }, 120);
    }
  );


  /* ── Tab visibility ────────────────────────────────────── */

  document.addEventListener(
    'visibilitychange',
    () => {
      if (!document.hidden) {
        dirty = true;
        requestFrame();
      }
    }
  );


  /* ── Initial setup ─────────────────────────────────────── */

  readPalette();
  resizeCanvas();
  drawGrid();
})();
