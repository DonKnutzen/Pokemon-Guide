(() => {
  const key = 'pokeguide:theme';
  const system = matchMedia('(prefers-color-scheme: dark)');
  let preference;
  try { preference = localStorage.getItem(key); } catch {}
  if (!['light', 'dark'].includes(preference)) preference = null;
  const updateChrome = () => {
    const color = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim();
    if (color) {
      const probe = document.createElement('span');
      probe.style.color = color;
      document.documentElement.append(probe);
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', getComputedStyle(probe).color);
      probe.remove();
    }
  };
  // Restore the edition before the app loads to avoid flashing the default palette.
  try {
    const edition = localStorage.getItem('pokeguide:edition-theme');
    if (['red','blue','yellow','gold','silver','crystal','ruby','sapphire','emerald','firered','leafgreen'].includes(edition)) document.documentElement.dataset.edition = edition;
  } catch {}
  const apply = () => {
    const dark = (preference || (system.matches ? 'dark' : 'light')) === 'dark';
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    updateChrome();
    const toggle = document.getElementById('theme-toggle');
    if (toggle) {
      toggle.textContent = dark ? '☀' : '☾';
      toggle.setAttribute('aria-pressed', String(dark));
      toggle.setAttribute('aria-label', dark ? 'Hellen Modus aktivieren' : 'Dunklen Modus aktivieren');
      toggle.title = dark ? 'Heller Modus' : 'Dunkler Modus';
    }
  };
  new MutationObserver(updateChrome).observe(document.documentElement, {attributes:true,attributeFilter:['data-edition']});
  apply();
  system.addEventListener('change', () => { if (!preference) apply(); });
  const bind = () => {
    apply();
    document.getElementById('theme-toggle').addEventListener('click', () => {
      preference = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem(key, preference); } catch {}
      apply();
    });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind, {once:true});
  else bind();
})();
