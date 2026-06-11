// ── Nav scroll state ─────────────────────────────────
const nav = document.querySelector('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 50);
}, { passive: true });

// ── Cursor ───────────────────────────────────────────
const cur = document.getElementById('cur');
document.addEventListener('mousemove', e => {
  cur.style.left = `${e.clientX}px`;
  cur.style.top  = `${e.clientY}px`;
});
document.addEventListener('mousedown', () => document.body.classList.add('clicking'));
document.addEventListener('mouseup',   () => document.body.classList.remove('clicking'));

// ── Click ripple ─────────────────────────────────────
document.addEventListener('click', e => {
  const r = document.createElement('div');
  r.style.cssText = [
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
  document.body.appendChild(r);
  setTimeout(() => r.remove(), 600);
});

// ── Scroll reveal ─────────────────────────────────────
const obs = new IntersectionObserver(entries => {
  entries.forEach((e, i) => {
    if (e.isIntersecting) {
      setTimeout(() => e.target.classList.add('in'), i * 75);
      obs.unobserve(e.target);
    }
  });
}, { threshold: 0.07 });
document.querySelectorAll('.reveal').forEach(el => obs.observe(el));

// ── Beam Me Up ────────────────────────────────────────
const beamBtn    = document.getElementById('beamUp');
const beamStreak = document.getElementById('beam-streak');
const beamFlash  = document.getElementById('beam-flash');

// Show pill after 400px scroll, hide at top
window.addEventListener('scroll', () => {
  beamBtn.classList.toggle('visible', window.scrollY > 400);
}, { passive: true });

beamBtn.addEventListener('click', () => {
  const rect    = beamBtn.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;

  // Position streak: centered on button, bottom edge at button's top
  beamStreak.style.left     = `${centerX - 1.5}px`;
  beamStreak.style.bottom   = `${window.innerHeight - rect.top}px`;
  beamStreak.style.height   = '0';
  beamStreak.style.opacity  = '1';
  beamStreak.style.transition = 'none';

  // 1. Streak shoots upward over 320ms
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      beamStreak.style.transition = 'height 0.32s ease-in';
      beamStreak.style.height = `${rect.top}px`;
    });
  });

  // 2. Flash slams in as streak hits the top
  setTimeout(() => {
    beamFlash.style.transition = 'opacity 0.08s ease-in';
    beamFlash.style.opacity = '1';
  }, 300);

  // 3. Scroll to top instantly under the flash
  setTimeout(() => {
    window.scrollTo(0, 0);
  }, 370);

  // 4. Flash fades out, reset streak
  setTimeout(() => {
    beamFlash.style.transition  = 'opacity 0.9s ease-out';
    beamFlash.style.opacity     = '0';
    beamStreak.style.transition = 'opacity 0.2s ease';
    beamStreak.style.opacity    = '0';
    setTimeout(() => {
      beamStreak.style.height = '0';
      beamStreak.style.transition = 'none';
    }, 200);
  }, 450);
});
