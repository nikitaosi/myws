document.addEventListener('change', (event) => {
  const checkbox = event.target;
  if (!(checkbox instanceof HTMLInputElement) || checkbox.name !== 'theme_switch') return;

  const theme = checkbox.checked ? 'dark' : 'light';
  document.cookie = `theme=${theme}; Max-Age=31536000; Path=/; SameSite=Lax`;
  document.documentElement.classList.toggle('dark', checkbox.checked);
  document.documentElement.classList.toggle('light', !checkbox.checked);
});
