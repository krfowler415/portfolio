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

// ── Scroll reveal ────────────────────────────────────
const obs = new IntersectionObserver(entries => {
  entries.forEach((e, i) => {
    if (e.isIntersecting) {
      setTimeout(() => e.target.classList.add('in'), i * 70);
      obs.unobserve(e.target);
    }
  });
}, { threshold: 0.07 });
document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
