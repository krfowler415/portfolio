// about.js
// Sonoran Cosmos — Kevin Fowler

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

document.querySelectorAll('.reveal, .reveal-left, .reveal-right')
  .forEach(el => revealObs.observe(el));

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
