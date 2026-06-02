let ufoIntroComplete = false;
const heroUfo = document.getElementById('heroUfo');
const ufoBeam = document.getElementById('ufoBeam');
 
// ── UFO intro ─────────────────────────────────────────────────────────────────
const introX   = window.innerWidth / 2 - 100;
const introY   = window.innerHeight * 0.12;
const introXvw = ((window.innerWidth / 2 - 100) / window.innerWidth) * 100;
const introYvh = 12;
 
// ── INTRO ───────────────────────────────────────────────────────────────────
const introEl        = document.getElementById('intro');
const introWrap      = document.getElementById('intro-ufo-wrap');
const iBeam          = document.getElementById('iBeam');
const iScan          = document.getElementById('iScan');
const introPts       = document.getElementById('intro-pts');
const introGlow      = document.getElementById('intro-glow');
const introScanlines = document.getElementById('intro-scanlines');
 
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (reducedMotion) {
  introEl.style.display = 'none';
  gsap.set(heroUfo, { x: introX, y: introY, opacity: 1, force3D: false });
  ufoIntroComplete = true;
} else {
  gsap.set(heroUfo, { x: introX, y: -200, opacity: 0, force3D: false });
  document.body.style.overflow = 'hidden';
}
 
// UFO is up there waiting — hover float gives it life
gsap.set(introWrap, { opacity: 1 });
gsap.to(introWrap, {
  y: -10,
  duration: 2.2,
  ease: 'sine.inOut',
  repeat: -1,
  yoyo: true
});
 
// Beam and glow lock on
gsap.to(iBeam,     { opacity: 1, duration: 0.65, ease: 'power2.out', delay: 0.4 });
gsap.to(introGlow, { opacity: 1, duration: 0.9,  delay: 0.4 });
 
// Beam breathes
gsap.to(iBeam, {
  opacity: 0.65,
  duration: 1.4,
  ease: 'sine.inOut',
  repeat: -1,
  yoyo: true,
  delay: 1.1
});
 
setTimeout(() => runScan(), 400);
 
// Particles — full screen, rising toward beam
function spawnPts(count, speedMult) {
  for (let i = 0; i < count; i++) {
    const pt    = document.createElement('div');
    pt.className = 'ipt';
    const size  = 1.5 + Math.random() * 4;
    const left  = 5   + Math.random() * 90;
    const btm   = 2   + Math.random() * 85;
    const dur   = (1.4 + Math.random() * 2.2) / speedMult;
    const delay = (Math.random() * 2.5) / speedMult;
    const drift = (Math.random() - 0.5) * 60;
    const rise  = 70  + Math.random() * 30;
    pt.style.cssText = `width:${size}px;height:${size}px;left:${left}%;bottom:${btm}%;animation-duration:${dur}s;animation-delay:-${delay}s;--drift:${drift}px;--rise:-${rise}vh;`;
    introPts.appendChild(pt);
  }
}
 
spawnPts(35, 1);
 
// Phase 2 — abduction intensifies
setTimeout(() => {
  if (introFired) return;
  spawnPts(55, 2.5);
  gsap.to(introGlow, { opacity: 0.8, duration: 1.2 });
}, 1200);
 
// Scan line loop
let scanTween;
function runScan() {
  scanTween = gsap.fromTo(iScan,
    { attr: { y1: 38, y2: 38 }, opacity: 0.9 },
    { attr: { y1: 560, y2: 560 }, opacity: 0, duration: 1.8, ease: 'power1.in', onComplete: runScan }
  );
}
 
// Gate
let minTimeDone = false;
let assetsDone  = false;
let introFired  = false;
 
function tryOutro() {
  if (minTimeDone && assetsDone && !introFired) {
    introFired = true;
    runIntroOutro();
  }
}
 
setTimeout(() => { minTimeDone = true; tryOutro(); }, 2800);
 
function runIntroOutro() {
  if (scanTween) scanTween.kill();
  gsap.killTweensOf(introWrap); // stop hover float
  gsap.set(introWrap, { transformOrigin: '50% 48%' });
  gsap.set(iScan, { opacity: 0 });
 
  const flash = document.getElementById('intro-flash');
 
  // Final frantic particle burst
  spawnPts(90, 6);
 
  const tl = gsap.timeline({
    onComplete() {
      document.body.style.overflow = '';
      ScrollTrigger.refresh();
    }
  });
 
  tl
    // Beam locks to full
    .to(iBeam, { opacity: 1, duration: 0.2, ease: 'power2.in' })
 
    // Screen shakes — you're being grabbed
    .to(introEl, {
      keyframes: [
        { x: -5, y: -2, duration: 0.06 },
        { x:  4, y:  3, duration: 0.06 },
        { x: -6, y: -1, duration: 0.06 },
        { x:  5, y:  2, duration: 0.06 },
        { x: -3, y: -3, duration: 0.06 },
        { x:  0, y:  0, duration: 0.06 },
      ]
    }, '+=0.05')
 
    // YOU rush toward the UFO — it gets larger as you're pulled up
    .to(introWrap, { scale: 4.2, duration: 0.75, ease: 'power3.in' })
    .to(introGlow, { opacity: 0.95, duration: 0.3 }, '<')
 
    // GLITCH — malfunction
    .to(introEl, {
      keyframes: [
        { x: -7,  skewX:  2, filter: 'hue-rotate(90deg) saturate(4) brightness(1.7)',  duration: 0.07 },
        { x:  10, skewX: -3, filter: 'hue-rotate(210deg) saturate(3) brightness(0.6)', duration: 0.07 },
        { x: -5,  skewX:  1, filter: 'hue-rotate(320deg) saturate(5) brightness(2.1)', duration: 0.06 },
        { x:  12, skewX: -2, filter: 'hue-rotate(50deg) saturate(4) brightness(1.4)',  duration: 0.06 },
        { x: -9,  skewX:  3, filter: 'hue-rotate(175deg) saturate(3) brightness(0.5)', duration: 0.07 },
        { x:  7,  skewX: -1, filter: 'hue-rotate(270deg) saturate(6) brightness(2.3)', duration: 0.06 },
        { x: -4,  skewX:  1, filter: 'hue-rotate(90deg) saturate(3) brightness(1.6)',  duration: 0.06 },
        { x:  0,  skewX:  0, filter: 'none',                                           duration: 0.06 },
      ]
    })
    .to(introScanlines, { opacity: 1, duration: 0.04 }, '<')
    .to(introScanlines, { opacity: 0, duration: 0.18 }, '>')
 
    // FLASH — you're dropped into the landing page
    .to(flash, { opacity: 1, duration: 0.1 })
    .add(() => {
      // Hide intro immediately under the flash
      introEl.style.display = 'none';
      gsap.set(heroUfo, { x: introX, y: introY, opacity: 1, force3D: false });
    })
    .to(flash, {
      opacity: 0,
      duration: 1.1,
      ease: 'power2.out',
      onComplete: () => { ufoIntroComplete = true; }
    }, '+=0.05');
}
 
// ── Stars ─────────────────────────────────────────────────────────────────────
const canvas = document.getElementById('stars');
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
    f.x  += f.vx; f.y += f.vy;
    if (f.x < -10 || f.x > W + 10 || f.y < -10 || f.y > H + 10) {
      f.x = Math.random() * W; f.y = Math.random() * H;
      f.vx = (Math.random() - 0.5) * 0.3; f.vy = (Math.random() - 0.5) * 0.3;
    }
    f.phase += f.speed * 0.02;
    const pulse = 0.2 + Math.abs(Math.sin(f.phase)) * 0.75;
    const glow  = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r * 4);
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
    ScrollTrigger.refresh();
    assetsDone = true;
    tryOutro();
  })
  .catch(err => {
    console.error('terrain failed:', err);
    assetsDone = true;
    tryOutro();
  });

// ── UFO scroll ────────────────────────────────────────────────────────────────
const ufoWaypoints = [
  [0.00, introXvw,       introYvh    ],
  [0.05, introXvw - 10,  introYvh + 4],
  [0.12,  5,  15],
  [0.18, 18,   8],
  [0.24, 30,  18],
  [0.30, 40,  10],
  [0.38, 46,  20],
  [0.46, 42,  28],
  [0.54, 38,  38],
  [0.72, 38,  52],
  [0.86, 38,  58],
  [1.00, 38,  58],
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
  return { x: ufoWaypoints[ufoWaypoints.length - 1][1], y: ufoWaypoints[ufoWaypoints.length - 1][2] };
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

    // Clamp max y so UFO stays in sky on wide/tall screens
    const aspectRatio = window.innerWidth / window.innerHeight;
    const maxYpct = aspectRatio > 2 ? 0.38 : aspectRatio > 1.6 ? 0.44 : 0.52;
    const yPx = Math.min((y / 100) * window.innerHeight, maxYpct * window.innerHeight);

    heroUfo.style.transform = `translate(${xPx}px, ${yPx}px)`;

    const beamProgress = Math.min(Math.max((progress - 0.50) / 0.15, 0), 1);
    ufoBeam.setAttribute('opacity', (beamProgress * 0.85).toFixed(3));

    if (progress >= 0.45) {
      heroUfo.classList.add('hovering');
    } else {
      heroUfo.classList.remove('hovering');
    }
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
 
// ── Custom cursor ─────────────────────────────────────────────────────────────
const isTouchDevice = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
if (!isTouchDevice) {
  const cur = document.getElementById('cur');
  document.addEventListener('mousemove', e => {
    cur.style.left = e.clientX + 'px'; cur.style.top = e.clientY + 'px';
  });
  document.addEventListener('mousedown', () => document.body.classList.add('clicking'));
  document.addEventListener('mouseup',   () => document.body.classList.remove('clicking'));
}
 
// ── Click ripple ──────────────────────────────────────────────────────────────
document.addEventListener('click', e => {
  const r = document.createElement('div');
  r.style.cssText = `position:fixed;width:10px;height:10px;border-radius:50%;border:1.5px solid var(--accent-teal);transform:translate(-50%,-50%) scale(0);pointer-events:none;z-index:9997;left:${e.clientX}px;top:${e.clientY}px;animation:rippleOut 0.6s ease-out forwards`;
  document.body.appendChild(r);
  setTimeout(() => r.remove(), 600);
});
const rs = document.createElement('style');
rs.textContent = '@keyframes rippleOut{to{transform:translate(-50%,-50%) scale(8);opacity:0}}';
document.head.appendChild(rs);
 
// ── Case study strip ──────────────────────────────────────────────────────────
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
      const cw   = (csStrip.querySelector('.cs-card')?.offsetWidth || 0) + 24;
      const cur  = Math.round(scrollLeft / cw);
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
  csStrip.addEventListener('click', e => {
    if (hasDragged) { e.preventDefault(); e.stopPropagation(); }
  }, true);
 
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
 
// ── Scroll reveal ─────────────────────────────────────────────────────────────
const obs = new IntersectionObserver((entries) => {
  entries.forEach((e, i) => {
    if (e.isIntersecting) { setTimeout(() => e.target.classList.add('in'), i * 75); obs.unobserve(e.target); }
  });
}, { threshold: 0.07 });
document.querySelectorAll('.reveal, .reveal-left, .reveal-right').forEach(el => obs.observe(el));
 
// ── Card tilt ─────────────────────────────────────────────────────────────────
if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
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
}
 
