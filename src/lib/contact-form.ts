type Turnstile = {
  render: (element: HTMLElement, options: Record<string, unknown>) => string;
  remove: (id: string) => void;
};
const host = window as Window & {turnstile?: Turnstile};
let loading: Promise<void> | undefined;
let cleanup = () => {};

function loadTurnstile() {
  if (host.turnstile) return Promise.resolve();
  if (!loading) loading = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    const timer = setTimeout(() => reject(new Error('Verification unavailable')), 15_000);
    script.onload = () => {clearTimeout(timer); resolve();};
    script.onerror = () => {clearTimeout(timer); script.remove(); loading = undefined; reject(new Error('Verification unavailable'));};
    document.head.append(script);
  });
  return loading;
}

async function initialize() {
  cleanup();
  const form = document.querySelector<HTMLFormElement>('#contact-form');
  const container = document.querySelector<HTMLElement>('#contact-captcha');
  const status = document.querySelector<HTMLElement>('#contact-verification');
  const button = document.querySelector<HTMLButtonElement>('#contact-submit');
  if (!form?.dataset.sitekey || !container || !status || !button) return;
  let disposed = false;
  let widget: string | undefined;
  let observer: MutationObserver | undefined;
  let currentTheme = '';
  const media = matchMedia('(prefers-color-scheme: dark)');
  const beforeSubmit = () => {button.disabled = true; button.textContent = 'Sending…'; status.textContent = 'Sending your message…';};
  const render = () => {
    if (!host.turnstile || disposed) return;
    const html = document.documentElement;
    const theme = html.classList.contains('dark') || (html.classList.contains('system') && media.matches) ? 'dark' : 'light';
    if (widget && theme === currentTheme) return;
    if (widget) host.turnstile.remove(widget);
    currentTheme = theme;
    button.disabled = true;
    widget = host.turnstile.render(container, {
      sitekey: form.dataset.sitekey,
      action: 'contact',
      theme,
      size: 'flexible',
      callback: () => {button.disabled = false; status.textContent = 'Verification complete.';},
      'expired-callback': () => {button.disabled = true; status.textContent = 'Verification expired. Please verify again.';},
      'error-callback': () => {button.disabled = true; status.textContent = 'Verification is unavailable. Please use email or Telegram above.';},
    });
  };
  cleanup = () => {
    disposed = true;
    observer?.disconnect();
    media.removeEventListener('change', render);
    form.removeEventListener('submit', beforeSubmit);
    if (widget) host.turnstile?.remove(widget);
  };
  try {
    await loadTurnstile();
    if (disposed || !form.isConnected) return;
    render();
    observer = new MutationObserver(render);
    observer.observe(document.documentElement, {attributes: true, attributeFilter: ['class']});
    media.addEventListener('change', render);
    form.addEventListener('submit', beforeSubmit);
  } catch {
    if (!disposed) status.textContent = 'Verification is unavailable. Please use email or Telegram above.';
  }
}
document.addEventListener('astro:page-load', initialize);
document.addEventListener('astro:before-swap', () => cleanup());
initialize();
