const systemTheme = window.matchMedia('(prefers-color-scheme: dark)');

function synchronizeToggle() {
  const checkbox = document.querySelector<HTMLInputElement>('input[name="theme_switch"]');
  if (!checkbox) return;
  checkbox.checked = document.documentElement.classList.contains('system')
    ? systemTheme.matches
    : document.documentElement.classList.contains('dark');
}

synchronizeToggle();
document.addEventListener('astro:page-load', synchronizeToggle);
systemTheme.addEventListener('change', synchronizeToggle);

document.addEventListener('change', (event) => {
  const checkbox = event.target;
  if (!(checkbox instanceof HTMLInputElement) || checkbox.name !== 'theme_switch') return;

  const theme = checkbox.checked ? 'dark' : 'light';
  document.cookie = `theme=${theme}; Max-Age=31536000; Path=/; SameSite=Lax`;
  document.documentElement.classList.remove('system');
  document.documentElement.classList.toggle('dark', checkbox.checked);
  document.documentElement.classList.toggle('light', !checkbox.checked);
});
