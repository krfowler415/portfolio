// eDreams-case-study.js
// Sonoran Cosmos — Kevin Fowler

// ── Nav scroll state ─────────────────────────────────────────────────
const nav = document.querySelector('nav');
const scrollProgress = document.getElementById('scroll-progress');
if (nav) {
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 50);

    if (scrollProgress) {
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? (window.scrollY / docHeight) * 100 : 0;
      scrollProgress.style.width = `${progress}%`;
    }
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
// @keyframes rippleOut lives in eDreams-case-study.css
document.addEventListener('click', e => {
  if (e.target.closest('#lightbox')) return; // skip ripple inside lightbox
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
const revealObs = new IntersectionObserver(entries => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      setTimeout(() => entry.target.classList.add('in'), i * 75);
      revealObs.unobserve(entry.target);
    }
  });
}, { threshold: 0.07 });
document.querySelectorAll('.reveal').forEach(el => revealObs.observe(el));

// ── Beam Me Up ───────────────────────────────────────────────────────
const beamUp     = document.getElementById('beamUp');
const beamStreak = document.getElementById('beam-streak');
const beamFlash  = document.getElementById('beam-flash');

if (beamUp) {
  // Show button after scrolling down
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

    // Anchor the streak at the button, pointing upward
    // bottom = distance from viewport bottom to the button's top edge
    beamStreak.style.cssText = `
      left: ${centreX}px;
      bottom: ${window.innerHeight - rect.top}px;
      top: auto;
      height: 0;
      opacity: 1;
      transform: translateX(-50%);
      transition: none;
    `;

    // Double rAF so browser registers the start state before animating
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        // Growing height with bottom anchor extends upward toward top of screen
        beamStreak.style.transition = 'height 0.32s ease-out, opacity 0.18s ease 0.26s';
        beamStreak.style.height  = `${rect.top}px`;
        beamStreak.style.opacity = '0';
      });
    });

    // Flash slam
    setTimeout(() => {
      beamFlash.style.transition = 'opacity 0.08s ease';
      beamFlash.style.opacity    = '0.3';
    }, 300);

    // Scroll
    setTimeout(() => window.scrollTo(0, 0), 370);

    // Fade flash
    setTimeout(() => {
      beamFlash.style.transition = 'opacity 0.45s ease';
      beamFlash.style.opacity    = '0';
    }, 430);

    // Reset streak
    setTimeout(() => {
      beamStreak.style.transition = 'none';
      beamStreak.style.height     = '0';
      beamStreak.style.opacity    = '0';
    }, 750);
  });
}

// ── Lightbox ─────────────────────────────────────────────────────────
const lightbox      = document.getElementById('lightbox');
const lightboxImg   = document.getElementById('lightbox-img');
const lightboxClose = document.getElementById('lightbox-close');

// Guard: only wire up if all three elements exist in the HTML
if (lightbox && lightboxImg && lightboxClose) {

  function openLightbox(src, alt) {
    lightboxImg.src = src;
    lightboxImg.alt = alt || '';
    lightbox.classList.add('active');
    lightbox.removeAttribute('aria-hidden');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    lightbox.classList.remove('active');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (cur) cur.classList.remove('zoom-in', 'zoom-out');
  }

  // Attach click to every content image (skip hero plane and the lightbox img itself)
  document.querySelectorAll('img:not(.hero-plane):not(#lightbox-img)').forEach(img => {
    img.style.cursor = 'none';
    img.addEventListener('click', () => openLightbox(img.src, img.alt));
  });

  // Close handlers
  lightboxClose.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', e => {
    if (e.target === lightbox) closeLightbox();
  });
  lightboxImg.addEventListener('click', closeLightbox);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && lightbox.classList.contains('active')) closeLightbox();
  });

}

// ── Cursor zoom states ────────────────────────────────────────────────
if (cur) {
  document.querySelectorAll('img:not(.hero-plane):not(#lightbox-img)').forEach(img => {
    img.addEventListener('mouseenter', () => cur.classList.add('zoom-in'));
    img.addEventListener('mouseleave', () => cur.classList.remove('zoom-in'));
  });

  if (lightboxImg) {
    lightboxImg.addEventListener('mouseenter', () => {
      cur.classList.remove('zoom-in');
      cur.classList.add('zoom-out');
    });
    lightboxImg.addEventListener('mouseleave', () => cur.classList.remove('zoom-out'));
    lightbox.addEventListener('mouseover', e => {
      if (e.target !== lightboxImg) cur.classList.remove('zoom-out');
    });
  }
}
