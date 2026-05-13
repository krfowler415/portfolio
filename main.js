// ── Dot matrix ──────────────────────────────────────
const canvas = document.getElementById('dots');
const ctx = canvas.getContext('2d');
let W, H, dots = [];
let mouse = { x: -9999, y: -9999 };
const COUNT = 110, CONN_D = 130, REPEL_D = 100;

function resize() {
  W = canvas.width  = canvas.offsetWidth;
  H = canvas.height = canvas.offsetHeight;
}
function init() {
  dots = Array.from({ length: COUNT }, () => ({
    x: Math.random() * W, y: Math.random() * H,
    vx: (Math.random() - 0.5) * 0.4,
    vy: (Math.random() - 0.5) * 0.4,
    r: Math.random() * 1.6 + 0.7,
  }));
}
function tick() {
  ctx.clearRect(0, 0, W, H);
  dots.forEach(d => {
    const dx = d.x - mouse.x, dy = d.y - mouse.y;
    const dist = Math.hypot(dx, dy);
    if (dist < REPEL_D && dist > 0) {
      const f = ((REPEL_D - dist) / REPEL_D) * 0.9;
      d.vx += (dx / dist) * f;
      d.vy += (dy / dist) * f;
    }
    d.vx *= 0.975; d.vy *= 0.975;
    d.x += d.vx; d.y += d.vy;
    if (d.x < 0) d.x = W; if (d.x > W) d.x = 0;
    if (d.y < 0) d.y = H; if (d.y > H) d.y = 0;
  });
  for (let i = 0; i < dots.length; i++) {
    for (let j = i + 1; j < dots.length; j++) {
      const dx = dots[i].x - dots[j].x;
      const dy = dots[i].y - dots[j].y;
      const d = Math.hypot(dx, dy);
      if (d < CONN_D) {
        ctx.beginPath();
        ctx.strokeStyle = `rgba(139,191,128,${(1 - d / CONN_D) * 0.3})`;
        ctx.lineWidth = 0.6;
        ctx.moveTo(dots[i].x, dots[i].y);
        ctx.lineTo(dots[j].x, dots[j].y);
        ctx.stroke();
      }
    }
  }
  dots.forEach(d => {
    ctx.beginPath();
    ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(139,191,128,0.5)';
    ctx.fill();
  });
  requestAnimationFrame(tick);
}
const heroEl = document.getElementById('hero');
heroEl.addEventListener('mousemove', e => {
  const r = canvas.getBoundingClientRect();
  mouse.x = e.clientX - r.left;
  mouse.y = e.clientY - r.top;
});
heroEl.addEventListener('mouseleave', () => { mouse.x = -9999; mouse.y = -9999; });
window.addEventListener('resize', () => { resize(); init(); });
resize(); init(); tick();

// ── Parallax ────────────────────────────────────────
const pxLayers = document.querySelectorAll('.px-layer[data-speed]');
window.addEventListener('scroll', () => {
  const sy = window.scrollY;
  pxLayers.forEach(el => {
    const speed = parseFloat(el.dataset.speed);
    el.style.transform = `translateY(calc(-50% + ${sy * speed * 60}px))`;
  });
  const hc = document.querySelector('.hero-content');
  if (hc) hc.style.transform = `translateY(${sy * 0.15}px)`;
}, { passive: true });

// ── Cursor ──────────────────────────────────────────
const cur = document.getElementById('cur');
document.addEventListener('mousemove', e => {
  cur.style.left = e.clientX + 'px';
  cur.style.top  = e.clientY + 'px';
});
document.addEventListener('mousedown', () => document.body.classList.add('clicking'));
document.addEventListener('mouseup',   () => document.body.classList.remove('clicking'));

// ── Click ripple ────────────────────────────────────
document.addEventListener('click', e => {
  const r = document.createElement('div');
  r.style.cssText = `position:fixed;width:10px;height:10px;border-radius:50%;border:1.5px solid var(--leaf);transform:translate(-50%,-50%) scale(0);pointer-events:none;z-index:9997;left:${e.clientX}px;top:${e.clientY}px;animation:rippleOut 0.6s ease-out forwards`;
  document.body.appendChild(r);
  setTimeout(() => r.remove(), 600);
});
const rs = document.createElement('style');
rs.textContent = '@keyframes rippleOut{to{transform:translate(-50%,-50%) scale(8);opacity:0}}';
document.head.appendChild(rs);

// ── Horizontal drag scroll ──────────────────────────
const strip = document.getElementById('hStrip');
if (strip) {
  let isDown = false, startX, scrollLeft;
  strip.addEventListener('mousedown', e => {
    e.preventDefault();
    isDown = true;
    startX = e.pageX - strip.offsetLeft;
    scrollLeft = strip.scrollLeft;
  });
  strip.addEventListener('mouseleave', () => { isDown = false; });
  strip.addEventListener('mouseup',    () => { isDown = false; });
  strip.addEventListener('mousemove',  e => {
    if (!isDown) return;
    e.preventDefault();
    strip.scrollLeft = scrollLeft - (e.pageX - strip.offsetLeft - startX) * 1.4;
  });
}

// ── Scroll reveal ────────────────────────────────────
const obs = new IntersectionObserver(entries => {
  entries.forEach((e, i) => {
    if (e.isIntersecting) {
      setTimeout(() => e.target.classList.add('in'), i * 75);
      obs.unobserve(e.target);
    }
  });
}, { threshold: 0.07 });
document.querySelectorAll('.reveal, .reveal-left, .reveal-right').forEach(el => obs.observe(el));
