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
