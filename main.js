// ── Fireflies ────────────────────────────────────────
const canvas = document.getElementById('fireflies');
const ctx = canvas.getContext('2d');
let W, H, flies = [];
let mouse = { x: -9999, y: -9999 };
const COUNT = 690;

function resize() {
  W = canvas.width = canvas.offsetWidth;
  H = canvas.height = canvas.offsetHeight;
}

function init() {
  flies = Array.from({ length: COUNT }, () => ({
    x: Math.random() * W,
    y: Math.random() * H,
    vx: (Math.random() - 0.5) * 0.3,
    vy: (Math.random() - 0.5) * 0.3,
    r: 1.5 + Math.random() * 2.5,
    phase: Math.random() * Math.PI * 2,
    speed: 0.4 + Math.random() * 0.6,
    hue: 100 + Math.random() * 40,
  }));
}

function tick() {
  ctx.clearRect(0, 0, W, H);

  flies.forEach((f) => {
    const dx = f.x - mouse.x;
    const dy = f.y - mouse.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 700 && dist > 0) {
      const force = ((700 - dist) / 700) * 0.3;
      f.vx += (dx / dist) * force;
      f.vy += (dy / dist) * force;
    }

    f.vx *= 0.96;
    f.vy *= 0.96;
    f.vx += (Math.random() - 0.5) * 0.1;
    f.vy += (Math.random() - 0.5) * 0.1;

    f.x += f.vx;
    f.y += f.vy;

    if (f.x < -10 || f.x > W + 10 || f.y < -10 || f.y > H + 10) {
      f.x = Math.random() * W;
      f.y = Math.random() * H;
      f.vx = (Math.random() - 0.5) * 0.3;
      f.vy = (Math.random() - 0.5) * 0.3;
    }

    f.phase += f.speed * 0.02;
    const pulse = 0.2 + Math.abs(Math.sin(f.phase)) * 0.75;

    const glow = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r * 4);
    glow.addColorStop(0, `hsla(${f.hue}, 70%, 75%, ${pulse * 0.5})`);
    glow.addColorStop(1, `hsla(${f.hue}, 70%, 75%, 0)`);
    ctx.beginPath();
    ctx.arc(f.x, f.y, f.r * 4, 0, Math.PI * 2);
    ctx.fillStyle = glow;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
    ctx.fillStyle = `hsla(${f.hue}, 80%, 85%, ${pulse})`;
    ctx.fill();
  });

  requestAnimationFrame(tick);
}

const heroEl = document.getElementById('hero');
heroEl.addEventListener('mousemove', (e) => {
  const r = canvas.getBoundingClientRect();
  mouse.x = e.clientX - r.left;
  mouse.y = e.clientY - r.top;
});
heroEl.addEventListener('mouseleave', () => {
  mouse.x = -9999;
  mouse.y = -9999;
});

window.addEventListener('resize', () => { resize(); init(); });
resize(); init(); requestAnimationFrame(tick);
// ── Parallax ────────────────────────────────────────
const pxLayers = document.querySelectorAll('.px-layer[data-speed]');
window.addEventListener(
  'scroll',
  () => {
    const sy = window.scrollY;
    pxLayers.forEach((el) => {
      const speed = parseFloat(el.dataset.speed);
      el.style.transform = `translateY(calc(-50% + ${sy * speed * 60}px))`;
    });
    const hc = document.querySelector('.hero-content');
    if (hc) hc.style.transform = `translateY(${sy * 0.15}px)`;
  },
  { passive: true },
);

// ── Cursor ──────────────────────────────────────────
const cur = document.getElementById('cur');
document.addEventListener('mousemove', (e) => {
  cur.style.left = e.clientX + 'px';
  cur.style.top = e.clientY + 'px';
});
document.addEventListener('mousedown', () =>
  document.body.classList.add('clicking'),
);
document.addEventListener('mouseup', () =>
  document.body.classList.remove('clicking'),
);

// ── Click ripple ────────────────────────────────────
document.addEventListener('click', (e) => {
  const r = document.createElement('div');
  r.style.cssText = `position:fixed;width:10px;height:10px;border-radius:50%;border:1.5px solid var(--leaf);transform:translate(-50%,-50%) scale(0);pointer-events:none;z-index:9997;left:${e.clientX}px;top:${e.clientY}px;animation:rippleOut 0.6s ease-out forwards`;
  document.body.appendChild(r);
  setTimeout(() => r.remove(), 600);
});
const rs = document.createElement('style');
rs.textContent =
  '@keyframes rippleOut{to{transform:translate(-50%,-50%) scale(8);opacity:0}}';
document.head.appendChild(rs);

// ── Horizontal drag scroll ──────────────────────────
const strip = document.getElementById('hStrip');
if (strip) {
  let isDown = false,
    startX,
    scrollLeft;
  strip.addEventListener('mousedown', (e) => {
    e.preventDefault();
    isDown = true;
    startX = e.pageX - strip.offsetLeft;
    scrollLeft = strip.scrollLeft;
  });
  strip.addEventListener('mouseleave', () => {
    isDown = false;
  });
  strip.addEventListener('mouseup', () => {
    isDown = false;
  });
  strip.addEventListener('mousemove', (e) => {
    if (!isDown) return;
    e.preventDefault();
    strip.scrollLeft = scrollLeft - (e.pageX - strip.offsetLeft - startX) * 1.4;
  });
}

// ── Scroll reveal ────────────────────────────────────
const obs = new IntersectionObserver(
  (entries) => {
    entries.forEach((e, i) => {
      if (e.isIntersecting) {
        setTimeout(() => e.target.classList.add('in'), i * 75);
        obs.unobserve(e.target);
      }
    });
  },
  { threshold: 0.07 },
);
document
  .querySelectorAll('.reveal, .reveal-left, .reveal-right')
  .forEach((el) => obs.observe(el));


// ── Card parallax tilt ──────────────────────────────
document.querySelectorAll('.h-card, .card-feat').forEach(card => {
  card.addEventListener('mousemove', e => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cx = rect.width / 2;
    const cy = rect.height / 2;

    // Scale rotation based on card size
    const maxRotate = card.classList.contains('card-feat') ? 6 : 10;

    const rotateX = ((y - cy) / cy) * -maxRotate;
    const rotateY = ((x - cx) / cx) * maxRotate;

    card.style.transition = 'none';
    card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-5px)`;
  });
  card.addEventListener('mouseleave', () => {
    card.style.transition = 'transform 0.5s cubic-bezier(0.03, 0.98, 0.52, 0.99)';
    card.style.transform = '';
  });
});
