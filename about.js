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
