(() => {
  const labels = { dashboard: 'ОБЗОР', order: 'ЗАКАЗ-НАРЯД', calendar: 'КАЛЕНДАРЬ' };
  const show = () => {
    const name = window.location.hash.slice(1);
    const tab = Object.hasOwn(labels, name) ? name : 'dashboard';
    document.querySelectorAll('[data-screen]').forEach(el => {
      el.hidden = el.dataset.screen !== tab;
    });
    document.querySelectorAll('[data-tab]').forEach(el => {
      const current = el.dataset.tab === tab;
      el.classList.toggle('selected', current);
      if (current) el.setAttribute('aria-current', 'page');
      else el.removeAttribute('aria-current');
    });
    document.getElementById('crumb').textContent = labels[tab];
    window.scrollTo(0, 0);
  };
  window.addEventListener('hashchange', show);
  show();
})();
