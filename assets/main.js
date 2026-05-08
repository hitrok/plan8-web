/* ============ HERO fluid mesh — organic flow field, monotone ============ */
(() => {
  const cv = document.querySelector('.hero-canvas');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  if (!ctx) return;

  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    cv.style.display = 'none';
    return;
  }

  let w = 0, h = 0, dpr = 1;
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = cv.getBoundingClientRect();
    w = cv.width = Math.max(1, Math.floor(rect.width * dpr));
    h = cv.height = Math.max(1, Math.floor(rect.height * dpr));
  }
  resize();
  window.addEventListener('resize', resize, { passive: true });
  if (typeof ResizeObserver !== 'undefined') new ResizeObserver(resize).observe(cv);

  // value noise
  const SZ = 64;
  const perm = new Uint8Array(SZ * SZ);
  for (let i = 0; i < perm.length; i++) perm[i] = Math.random() * 255;
  function noise(x, y) {
    const xi = Math.floor(x), yi = Math.floor(y);
    const xf = x - xi, yf = y - yi;
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    const a = perm[((xi) & (SZ - 1)) + ((yi) & (SZ - 1)) * SZ] / 255;
    const b = perm[((xi + 1) & (SZ - 1)) + ((yi) & (SZ - 1)) * SZ] / 255;
    const c = perm[((xi) & (SZ - 1)) + ((yi + 1) & (SZ - 1)) * SZ] / 255;
    const d = perm[((xi + 1) & (SZ - 1)) + ((yi + 1) & (SZ - 1)) * SZ] / 255;
    return (a * (1 - u) + b * u) * (1 - v) + (c * (1 - u) + d * u) * v;
  }

  const N = 520;
  const pts = [];
  function seed() {
    pts.length = 0;
    for (let i = 0; i < N; i++) {
      pts.push({
        x: Math.random() * w,
        y: Math.random() * h,
        life: Math.random() * 200,
        s: 0.6 + Math.random() * 1.2,
      });
    }
  }
  seed();

  let t = 0;
  let running = true;
  function step() {
    if (!running) { requestAnimationFrame(step); return; }
    t += 0.0022;

    // very soft fade (almost transparent, leaves fine trails)
    ctx.fillStyle = 'rgba(255,255,255,0.035)';
    ctx.fillRect(0, 0, w, h);

    const scale = 0.0042;
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      const nx = p.x * scale, ny = p.y * scale;
      const a = noise(nx + t, ny - t * 0.5) * Math.PI * 4;
      const vx = Math.cos(a) * p.s * dpr;
      const vy = Math.sin(a) * p.s * dpr;
      const px = p.x, py = p.y;
      p.x += vx; p.y += vy;
      p.life += 1;

      // respawn if off screen or aged out
      if (p.life > 220 || p.x < -10 || p.x > w + 10 || p.y < -10 || p.y > h + 10) {
        p.x = Math.random() * w;
        p.y = Math.random() * h;
        p.life = 0;
      }

      // ink stroke — varies in opacity with life (fade in/out)
      const lifeFade = Math.sin((p.life / 220) * Math.PI);
      const alpha = 0.14 * lifeFade;
      ctx.strokeStyle = `rgba(20,20,20,${alpha})`;
      ctx.lineWidth = 0.7 * dpr;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
    }

    requestAnimationFrame(step);
  }
  requestAnimationFrame(step);

  // pause when hero out of view
  const hero = document.querySelector('.hero');
  if (hero && typeof IntersectionObserver !== 'undefined') {
    const pauseIO = new IntersectionObserver((es) => {
      es.forEach(e => { running = e.isIntersecting; });
    }, { threshold: 0.02 });
    pauseIO.observe(hero);
  }
})();

const io = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  });
}, { threshold: 0.08, rootMargin: '0px 0px -6% 0px' });
document.querySelectorAll('.reveal').forEach(el => io.observe(el));

(function burger() {
  const btn = document.getElementById('navBurger');
  const menu = document.getElementById('navLinks');
  if (!btn || !menu) return;
  function close() {
    menu.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }
  function toggle() {
    const open = menu.classList.toggle('open');
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    document.body.style.overflow = open ? 'hidden' : '';
  }
  btn.addEventListener('click', toggle);
  menu.querySelectorAll('a').forEach(a => a.addEventListener('click', close));
  window.addEventListener('resize', () => {
    if (window.innerWidth > 900) close();
  });
})();

/* ============ Office presence neon (WiFi) ============ */
(function wifiNeon() {
  const el = document.getElementById('wifiNeon');
  if (!el) return;
  const url = el.dataset.statusUrl || 'status.json';
  const POLL_MS = 60 * 1000;
  const FRESH_MS = 15 * 60 * 1000;

  async function check() {
    try {
      const res = await fetch(url + (url.includes('?') ? '&' : '?') + '_=' + Date.now(), { cache: 'no-store' });
      if (!res.ok) throw new Error('fetch failed');
      const j = await res.json();
      const ts = j.ts ? Date.parse(j.ts) : 0;
      const fresh = !ts || (Date.now() - ts) < FRESH_MS;
      const on = !!j.at_office && fresh;
      el.classList.toggle('on', on);
    } catch (_) {
      el.classList.remove('on');
    }
  }
  check();
  setInterval(check, POLL_MS);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) check();
  });
})();
