// ── Fireflies ─────────────────────────────────────────────────────────────────
const canvas = document.getElementById('fireflies');
const ctx    = canvas.getContext('2d');
let W, H, flies = [];
let mouse = { x: -9999, y: -9999 };
const COUNT = 380;

function resize() {
  W = canvas.width  = canvas.offsetWidth;
  H = canvas.height = canvas.offsetHeight;
}
function randomHue() {
  const r = Math.random();
  if (r < 0.45) return 183 + (Math.random() - 0.5) * 14;
  if (r < 0.90) return 268 + (Math.random() - 0.5) * 18;
  return 22 + (Math.random() - 0.5) * 12;
}
function init() {
  flies = Array.from({ length: COUNT }, () => ({
    x: Math.random() * W, y: Math.random() * H,
    vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3,
    r: 1.5 + Math.random() * 2.5,
    phase: Math.random() * Math.PI * 2,
    speed: 0.4 + Math.random() * 0.6,
    hue: randomHue(),
  }));
}
function tick() {
  ctx.clearRect(0, 0, W, H);
  flies.forEach(f => {
    const dx = f.x - mouse.x, dy = f.y - mouse.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 700 && dist > 0) {
      const force = ((700 - dist) / 700) * 0.3;
      f.vx += (dx / dist) * force;
      f.vy += (dy / dist) * force;
    }
    f.vx *= 0.96; f.vy *= 0.96;
    f.vx += (Math.random() - 0.5) * 0.1;
    f.vy += (Math.random() - 0.5) * 0.1;
    f.x += f.vx; f.y += f.vy;
    if (f.x < -10 || f.x > W + 10 || f.y < -10 || f.y > H + 10) {
      f.x = Math.random() * W; f.y = Math.random() * H;
      f.vx = (Math.random() - 0.5) * 0.3; f.vy = (Math.random() - 0.5) * 0.3;
    }
    f.phase += f.speed * 0.02;
    const pulse = 0.2 + Math.abs(Math.sin(f.phase)) * 0.75;
    const glow = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r * 4);
    glow.addColorStop(0, `hsla(${f.hue},80%,70%,${pulse * 0.5})`);
    glow.addColorStop(1, `hsla(${f.hue},80%,70%,0)`);
    ctx.beginPath(); ctx.arc(f.x, f.y, f.r * 4, 0, Math.PI * 2);
    ctx.fillStyle = glow; ctx.fill();
    ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
    ctx.fillStyle = `hsla(${f.hue},90%,80%,${pulse})`; ctx.fill();
  });
  requestAnimationFrame(tick);
}
const heroEl = document.getElementById('hero');
heroEl.addEventListener('mousemove', e => {
  const r = canvas.getBoundingClientRect();
  mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
});
heroEl.addEventListener('mouseleave', () => { mouse.x = -9999; mouse.y = -9999; });
window.addEventListener('resize', () => { resize(); init(); });
resize(); init(); requestAnimationFrame(tick);


// ── Desert parallax ───────────────────────────────────────────────────────────
//
// 6 SVG layer groups from the processed Freepik desert SVG.
// Each group is translated at a different speed on scroll — far layers barely
// move (feel distant), near layers move more (feel close).
//
// Layer map:
//   d-l1  sky bg (hidden)      speed: 0
//   d-l2  far mountains        speed: 0.04
//   d-l3  mid terrain          speed: 0.09
//   d-l4  near terrain         speed: 0.15
//   d-l5  foreground fill      speed: 0.22
//   d-l6  detail / stars       speed: 0.12  (stars move with mid layers)
//
const desertLayers = [
  { id: 'd-l2', speed: 0.04  },
  { id: 'd-l3', speed: 0.09  },
  { id: 'd-l4', speed: 0.15  },
  { id: 'd-l5', speed: 0.22  },
  { id: 'd-l6', speed: 0.12  },
];

// Resolve elements once on load
desertLayers.forEach(l => {
  l.el = document.getElementById(l.id);
  if (!l.el) console.warn(`Desert layer ${l.id} not found`);
});

function parallaxDesert() {
  const s = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
  if (s > window.innerHeight * 1.4) return;
  desertLayers.forEach(({ el, speed }) => {
    if (el) el.style.transform = `translateY(${-(s * speed).toFixed(2)}px)`;
  });
}
window.addEventListener('scroll', parallaxDesert, { passive: true });
document.addEventListener('scroll', parallaxDesert, { passive: true });


// ── Nav transparency ───────────────────────────────────────────────────────────
const nav = document.querySelector('nav');
window.addEventListener('scroll', () => {
  nav.style.background     = window.scrollY > 50 ? 'var(--bg-dark)' : 'transparent';
  nav.style.backdropFilter = window.scrollY > 50 ? 'blur(16px)'     : 'none';
}, { passive: true });


// ── Hero content scroll parallax ───────────────────────────────────────────────
window.addEventListener('scroll', () => {
  const hc = document.querySelector('.hero-content');
  if (hc) hc.style.transform = `translateY(${(window.scrollY * 0.12).toFixed(2)}px)`;
}, { passive: true });


// ── Custom cursor ──────────────────────────────────────────────────────────────
const cur = document.getElementById('cur');
document.addEventListener('mousemove', e => {
  cur.style.left = e.clientX + 'px'; cur.style.top = e.clientY + 'px';
});
document.addEventListener('mousedown', () => document.body.classList.add('clicking'));
document.addEventListener('mouseup',   () => document.body.classList.remove('clicking'));


// ── Click ripple ───────────────────────────────────────────────────────────────
document.addEventListener('click', e => {
  const r = document.createElement('div');
  r.style.cssText = `position:fixed;width:10px;height:10px;border-radius:50%;border:1.5px solid var(--accent-teal);transform:translate(-50%,-50%) scale(0);pointer-events:none;z-index:9997;left:${e.clientX}px;top:${e.clientY}px;animation:rippleOut 0.6s ease-out forwards`;
  document.body.appendChild(r);
  setTimeout(() => r.remove(), 600);
});
const rs = document.createElement('style');
rs.textContent = '@keyframes rippleOut{to{transform:translate(-50%,-50%) scale(8);opacity:0}}';
document.head.appendChild(rs);


// ── Case study strip ───────────────────────────────────────────────────────────
const csStrip    = document.getElementById('csStrip');
const csProgress = document.getElementById('csProgress');
if (csStrip) {
  let snapTimeout, isSnapping = false;
  csStrip.addEventListener('scroll', () => {
    const max = csStrip.scrollWidth - csStrip.clientWidth;
    if (csProgress) csProgress.style.width = (max > 0 ? (csStrip.scrollLeft / max) * 100 : 0) + '%';
    if (!isSnapping) {
      clearTimeout(snapTimeout);
      snapTimeout = setTimeout(() => {
        const cw = csStrip.querySelector('.cs-card')?.offsetWidth + 24;
        if (!cw) return;
        isSnapping = true;
        csStrip.scrollTo({ left: Math.round(csStrip.scrollLeft / cw) * cw, behavior: 'smooth' });
        setTimeout(() => { isSnapping = false; }, 500);
      }, 150);
    }
  }, { passive: true });

  let isDown = false, startX, scrollLeft, hasDragged = false;
  csStrip.addEventListener('mousedown', e => {
    e.preventDefault(); isDown = true; hasDragged = false;
    startX = e.pageX - csStrip.offsetLeft; scrollLeft = csStrip.scrollLeft;
  });
  csStrip.addEventListener('mouseleave', () => { isDown = false; });
  csStrip.addEventListener('mouseup', () => {
    if (isDown && hasDragged) {
      const cw = csStrip.querySelector('.cs-card')?.offsetWidth + 24;
      const cur = Math.round(scrollLeft / cw);
      const drag = scrollLeft - csStrip.scrollLeft;
      let target = cur + (drag > cw * 0.25 ? -1 : drag < -cw * 0.25 ? 1 : 0);
      target = Math.max(0, Math.min(target, csStrip.querySelectorAll('.cs-card').length - 1));
      isSnapping = true;
      smoothScrollTo(target * cw, 600);
      setTimeout(() => { isSnapping = false; }, 700);
    }
    isDown = false;
  });
  csStrip.addEventListener('mousemove', e => {
    if (!isDown) return;
    const walk = e.pageX - csStrip.offsetLeft - startX;
    if (Math.abs(walk) > 5) { hasDragged = true; e.preventDefault(); }
    csStrip.scrollLeft = scrollLeft - walk * 1.1;
  });
  csStrip.addEventListener('click', e => { if (hasDragged) { e.preventDefault(); e.stopPropagation(); } }, true);

  const prevBtn = document.getElementById('csPrev');
  const nextBtn = document.getElementById('csNext');
  const getCardWidth = () => (csStrip.querySelector('.cs-card')?.offsetWidth || 0) + 24;

  function animateArrow(btn) {
    btn.classList.add('animate');
    setTimeout(() => btn.classList.remove('animate'), 1600);
  }
  function smoothScrollTo(target, dur) {
    const start = csStrip.scrollLeft, dist = target - start, t0 = performance.now();
    (function step(t) {
      const p = Math.min((t - t0) / dur, 1);
      const e = p < 0.5 ? 2*p*p : -1+(4-2*p)*p;
      csStrip.scrollLeft = start + dist * e;
      if (p < 1) requestAnimationFrame(step);
    })(performance.now());
  }
  prevBtn?.addEventListener('click', () => {
    animateArrow(prevBtn);
    smoothScrollTo(Math.max(0, (Math.round(csStrip.scrollLeft / getCardWidth()) - 1) * getCardWidth()), 1000);
  });
  nextBtn?.addEventListener('click', () => {
    animateArrow(nextBtn);
    smoothScrollTo((Math.round(csStrip.scrollLeft / getCardWidth()) + 1) * getCardWidth(), 1000);
  });
}


// ── Scroll reveal ──────────────────────────────────────────────────────────────
const obs = new IntersectionObserver((entries) => {
  entries.forEach((e, i) => {
    if (e.isIntersecting) {
      setTimeout(() => e.target.classList.add('in'), i * 75);
      obs.unobserve(e.target);
    }
  });
}, { threshold: 0.07 });
document.querySelectorAll('.reveal, .reveal-left, .reveal-right').forEach(el => obs.observe(el));


// ── Card tilt ──────────────────────────────────────────────────────────────────
document.querySelectorAll('.card-tilt-wrap').forEach(wrap => {
  const inner = wrap.querySelector('.card-feat');
  if (!inner) return;
  wrap.addEventListener('mousemove', e => {
    const rect = wrap.getBoundingClientRect();
    const rx = ((e.clientY - rect.top)  / rect.height - 0.5) * -8;
    const ry = ((e.clientX - rect.left) / rect.width  - 0.5) *  8;
    inner.style.transition = 'transform 0.1s ease';
    inner.style.transform  = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-4px)`;
  });
  wrap.addEventListener('mouseleave', () => {
    inner.style.transition = 'transform 0.6s cubic-bezier(0.23,1,0.32,1)';
    inner.style.transform  = '';
  });
  wrap.addEventListener('click', e => {
    const link = wrap.querySelector('a');
    if (link && e.target !== link && !link.contains(e.target)) link.click();
  });
});
