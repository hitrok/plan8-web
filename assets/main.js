/* ============ Office presence (在 / 不在) ============ */
(function presence() {
  const el = document.getElementById('wifiNeon');
  if (!el) return;
  const url = el.dataset.statusUrl || 'status.json';
  const POLL_MS = 60 * 1000;

  async function check() {
    try {
      const res = await fetch(url + (url.includes('?') ? '&' : '?') + '_=' + Date.now(), { cache: 'no-store' });
      if (!res.ok) throw new Error('fetch failed');
      const j = await res.json();
      el.classList.toggle('on', !!j.at_office);
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
