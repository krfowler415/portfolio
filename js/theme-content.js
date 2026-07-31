/**
 * =====================================================================
 * THEME CONTENT / THEME TRANSITION MODULE
 * Kevin Fowler Portfolio
 * =====================================================================
 *
 * Provides the theme toggle, favicon swap, terrain refresh hook,
 * and SVG wipe transition.
 *
 * This module is intentionally namespaced as window.KFTheme so it can
 * be loaded before main.js without creating duplicate global function
 * declarations.
 * =====================================================================
 */

window.KFTheme = (() => {
  let wipeIsActive = false;

  function swapTerrain() {
    /*
     * Terrain is swapped entirely by CSS:
     * :root[data-theme="light"] .terrain-img--light
     */
    ScrollTrigger.refresh();
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
      const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';

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

    const numPoints = 10;
    const numPaths = paths.length;
    const delayPointsMax = 0.3;
    const delayPerPath = 0.2;
    const pointsDelay = [];

    const allPoints = Array.from({ length: numPaths }, () =>
      Array.from({ length: numPoints }, () => 100)
    );

    function render(opened) {
      for (let i = 0; i < numPaths; i++) {
        const pts = allPoints[i];
        let d = opened ? `M 0 0 V ${pts[0]} C` : `M 0 ${pts[0]} C`;

        for (let j = 0; j < numPoints - 1; j++) {
          const p = (j + 1) / (numPoints - 1) * 100;
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
        const pts = allPoints[i];
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

  return {
    initThemeToggle,
    swapTerrain,
    swapFavicon,
    playThemeWipe,
  };
})();
