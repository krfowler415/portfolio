let ufoIntroComplete = false;
const heroUfo = document.getElementById('heroUfo');
const ufoBeam = document.getElementById('ufoBeam');

// ── Word rotation (GSAP) ──────────────────────────────────────────────────────
const wordEls = gsap.utils.toArray('.word');
const hold = 2.5;
const fade = 1.0;

gsap.set(wordEls, { opacity: 0 });

const wordTl = gsap.timeline({ repeat: -1 });

wordEls.forEach((word, i) => {
  const t = i * hold;
  wordTl
    .to(word, { opacity: 1, duration: fade, ease: 'power2.inOut' }, t)
    .to(word, { opacity: 0, duration: fade, ease: 'power2.inOut' }, t + hold);
});

// ── UFO intro ─────────────────────────────────────────────────────────────────
const introX = window.innerWidth / 2 - 100;
const introY = window.innerHeight * 0.12;
const introXvw = ((window.innerWidth / 2 - 100) / window.innerWidth) * 100;
const introYvh = 12;

gsap.set(heroUfo, { x: introX, y: -200, opacity: 1 });

gsap.to(heroUfo, {
  y: introY,
  duration: 0.7,
  ease: 'power4.out',
  delay: 0.4,
  onComplete: () => { ufoIntroComplete = true; }
});

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
const heroPin = document.querySelector('.hero-pin');
heroPin.addEventListener('mousemove', e => {
  const r = canvas.getBoundingClientRect();
  mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
});
heroPin.addEventListener('mouseleave', () => { mouse.x = -9999; mouse.y = -9999; });
window.addEventListener('resize', () => { resize(); init(); });
resize(); init(); requestAnimationFrame(tick);

// ── Register ScrollTrigger ────────────────────────────────────────────────────
gsap.registerPlugin(ScrollTrigger);

// ── Desert parallax ───────────────────────────────────────────────────────────
function initParallax() {
  const layers = [
    { id: 'd-l2', speed: -0.40 },
    { id: 'd-l3', speed: -0.50 },
    { id: 'd-l4', speed: -0.60 },
    { id: 'd-l5', speed: -0.70 },
    { id: 'd-l6', speed: -0.70 },
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

// ── Terrain fetch + parallax init ─────────────────────────────────────────────
fetch('terrain.svg')
  .then(r => r.text())
  .then(html => {
    document.getElementById('heroTerrain').innerHTML = html;
    initParallax();
  })
  ScrollTrigger.refresh();
  .catch(err => console.error('Failed to load terrain SVG:', err));

// ── UFO scroll ────────────────────────────────────────────────────────────────
const ufoWaypoints = [
  [0.00, introXvw, introYvh],
  [0.08,   5,  15],
  [0.14,  18,   8],
  [0.20,  30,  18],
  [0.26,  40,  10],
  [0.34,  46,  20],
  [0.42,  42,  28],
  [0.50,  38,  38],
  [0.70,  38,  52],
  [0.85,  38,  58],
  [1.00,  38,  58],
];

function lerp(a, b, t) { return a + (b - a) * t; }

function getUfoPos(progress) {
  for (let i = 0; i < ufoWaypoints.length - 1; i++) {
    const [p0, x0, y0] = ufoWaypoints[i];
    const [p1, x1, y1] = ufoWaypoints[i + 1];
    if (progress >= p0 && progress <= p1) {
      const t = (progress - p0) / (p1 - p0);
      return { x: lerp(x0, x1, t), y: lerp(y0, y1, t) };
    }
  }
  return { x: ufoWaypoints[ufoWaypoints.length-1][1], y: ufoWaypoints[ufoWaypoints.length-1][2] };
}

ScrollTrigger.create({
  trigger: '#hero',
  start: 'top top',
  end: 'bottom bottom',
  scrub: true,
  onUpdate: (self) => {
    if (!ufoIntroComplete) return;
    const progress = self.progress;
    const { x, y } = getUfoPos(progress);
    const xPx = (x / 100) * window.innerWidth;
    const yPx = (y / 100) * window.innerHeight;
    heroUfo.style.transform = `translate(${xPx}px, ${yPx}px)`;

    const beamProgress = Math.min(Math.max((progress - 0.50) / 0.15, 0), 1);
    ufoBeam.setAttribute('opacity', (beamProgress * 0.85).toFixed(3));

    if (progress >= 0.45) {
      heroUfo.classList.add('hovering');
    } else {
      heroUfo.classList.remove('hovering');
    }

    const words = document.querySelectorAll('.word');
    const gy = 50 - (progress * 120);
    words.forEach(w => {
      w.style.backgroundImage = `radial-gradient(ellipse 150% 120% at 50% ${gy}vh, oklch(0.90 0.28 350) 0%, oklch(0.75 0.30 320) 35%, oklch(0.60 0.25 300) 65%, oklch(0.50 0.20 285) 100%)`;
    });
  }
});

// ── Hero content fade ─────────────────────────────────────────────────────────
gsap.to('.hero-content', {
  y: () => window.innerHeight * 0.4,
  opacity: 0,
  ease: 'none',
  scrollTrigger: {
    trigger: '#hero',
    start: 'top top',
    end: '75% bottom',
    scrub: true,
  }
});

// ── Nav transparency ──────────────────────────────────────────────────────────
const nav = document.querySelector('nav');
ScrollTrigger.create({
  start: 'top -50',
  onUpdate: (self) => {
    nav.classList.toggle('scrolled', self.scroll() > 50);
  }
});

// ── Custom cursor ──────────────────────────────────────────────────────────────
const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
if (!isTouchDevice) {
  const cur = document.getElementById('cur');
  document.addEventListener('mousemove', e => {
    cur.style.left = e.clientX + 'px'; cur.style.top = e.clientY + 'px';
  });
  document.addEventListener('mousedown', () => document.body.classList.add('clicking'));
  document.addEventListener('mouseup',   () => document.body.classList.remove('clicking'));
}

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
        const cw = (csStrip.querySelector('.cs-card')?.offsetWidth || 0) + 24;
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
      const cw = (csStrip.querySelector('.cs-card')?.offsetWidth || 0) + 24;
      const cur = Math.round(scrollLeft / cw);
      const drag = scrollLeft - csStrip.scrollLeft;
      let target = cur + (drag > cw * 0.25 ? -1 : drag < -cw * 0.25 ? 1 : 0);
      target = Math.max(0, Math.min(target, csStrip.querySelectorAll('.cs-card').length - 1));
      isSnapping = true;
      csStrip.scrollTo({ left: target * cw, behavior: 'smooth' });
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

  function animateArrow(btn) { btn.classList.add('animate'); setTimeout(() => btn.classList.remove('animate'), 1600); }
  function smoothScrollTo(target, dur) {
    const start = csStrip.scrollLeft, dist = target - start, t0 = performance.now();
    (function step(t) {
      const p = Math.min((t - t0) / dur, 1), e = p < 0.5 ? 2*p*p : -1+(4-2*p)*p;
      csStrip.scrollLeft = start + dist * e;
      if (p < 1) requestAnimationFrame(step);
    })(performance.now());
  }
  prevBtn?.addEventListener('click', () => { animateArrow(prevBtn); smoothScrollTo(Math.max(0, (Math.round(csStrip.scrollLeft / getCardWidth()) - 1) * getCardWidth()), 1000); });
  nextBtn?.addEventListener('click', () => { animateArrow(nextBtn); smoothScrollTo((Math.round(csStrip.scrollLeft / getCardWidth()) + 1) * getCardWidth(), 1000); });
}

// ── Scroll reveal ──────────────────────────────────────────────────────────────
const obs = new IntersectionObserver((entries) => {
  entries.forEach((e, i) => {
    if (e.isIntersecting) { setTimeout(() => e.target.classList.add('in'), i * 75); obs.unobserve(e.target); }
  });
}, { threshold: 0.07 });
document.querySelectorAll('.reveal, .reveal-left, .reveal-right').forEach(el => obs.observe(el));

// ── Card tilt ──────────────────────────────────────────────────────────────────
document.querySelectorAll('.card-tilt-wrap').forEach(wrap => {
  const inner = wrap.querySelector('.card-feat');
  if (!inner) return;
  wrap.addEventListener('mousemove', e => {
    const rect = wrap.getBoundingClientRect();
    const rx = ((e.clientY - rect.top)  / rect.height - 0.5) * -6;
    const ry = ((e.clientX - rect.left) / rect.width  - 0.5) *  6;
    inner.style.transition = 'transform 0.1s ease';
    inner.style.transform  = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-4px)`;
  });
  wrap.addEventListener('mouseleave', () => {
    inner.style.transition = 'transform 0.6s cubic-bezier(0.23,1,0.32,1)';
    inner.style.transform  = '';
  });
});
