export {};

const measurementId = 'G-Y3NDRQ23RY';
const cookieName = 'analytics_consent';
const productionHost = ['nikitaosi.dev', 'www.nikitaosi.dev'].includes(location.hostname);
type Choice = 'granted' | 'denied';
type Gtag = (...args: unknown[]) => void;
const host = window as Window & {dataLayer?: unknown[]; gtag?: Gtag; 'ga-disable-G-Y3NDRQ23RY'?: boolean};
let configured = false;
let previousPage: string | undefined;
const entryParameters = new URL(location.href).searchParams;

function readChoice(): Choice | undefined {
  const value = document.cookie.split('; ').find((cookie) => cookie.startsWith(`${cookieName}=`))?.split('=')[1];
  return value === 'granted' || value === 'denied' ? value : undefined;
}

// Never forward form data, arbitrary query strings or fragments to Google.
function analyticsUrl(input: string, campaigns = false): string {
  if (!input) return '';
  try {
    const url = new URL(input);
    const query = new URLSearchParams();
    if (campaigns) {
      for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_id', 'utm_term', 'utm_content']) {
        const value = url.searchParams.get(key);
        if (value) query.set(key, value.slice(0, 200));
      }
    }
    url.search = query.toString();
    url.hash = '';
    return url.href;
  } catch {
    return '';
  }
}

function initializeGoogle() {
  if (configured) return;
  configured = true;
  host[`ga-disable-${measurementId}`] = false;
  host.dataLayer = host.dataLayer || [];
  host.gtag = function () {host.dataLayer!.push(arguments);};
  host.gtag('consent', 'default', {
    analytics_storage: 'denied', ad_storage: 'denied',
    ad_user_data: 'denied', ad_personalization: 'denied',
  });
  host.gtag('consent', 'update', {analytics_storage: 'granted'});
  host.gtag('js', new Date());
  const campaign: Record<string, string> = {};
  for (const [utm, field] of Object.entries({utm_source: 'campaign_source', utm_medium: 'campaign_medium', utm_campaign: 'campaign_name', utm_id: 'campaign_id', utm_term: 'campaign_term', utm_content: 'campaign_content'})) {
    const value = entryParameters.get(utm);
    if (value) campaign[field] = value.slice(0, 200);
  }
  host.gtag('config', measurementId, {
    send_page_view: false,
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
    page_location: analyticsUrl(location.href, true),
    page_referrer: analyticsUrl(document.referrer),
    ...campaign,
  });
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.append(script);
}

function trackPage() {
  if (!productionHost || readChoice() !== 'granted') return;
  initializeGoogle();
  const current = analyticsUrl(location.href, true);
  if (previousPage === current) return;
  host.gtag!('event', 'page_view', {
    send_to: measurementId,
    page_title: document.title,
    page_location: current,
    page_referrer: previousPage || analyticsUrl(document.referrer),
  });
  previousPage = current;
}

function updateControls() {
  const banner = document.querySelector<HTMLElement>('[data-analytics-banner]');
  const preferences = document.querySelector<HTMLButtonElement>('[data-analytics-preferences]');
  if (banner) banner.hidden = readChoice() !== undefined;
  if (preferences) preferences.hidden = false;
  document.querySelectorAll<HTMLButtonElement>('[data-analytics-choice]').forEach((button) => {button.disabled = false;});
}

function clearAnalyticsCookies() {
  for (const cookie of document.cookie.split('; ')) {
    const name = cookie.split('=')[0];
    if (name !== '_ga' && !name.startsWith('_ga_')) continue;
    for (const domain of ['', location.hostname, 'nikitaosi.dev']) {
      document.cookie = `${name}=; Max-Age=0; Path=/${domain ? `; Domain=${domain}` : ''}; SameSite=Lax`;
    }
  }
}

document.addEventListener('click', (event) => {
  if (!(event.target instanceof Element)) return;
  if (event.target.closest('[data-analytics-preferences]')) {
    const banner = document.querySelector<HTMLElement>('[data-analytics-banner]');
    if (banner) {
      banner.hidden = false;
      banner.querySelector<HTMLButtonElement>('button')?.focus();
    }
    return;
  }
  const button = event.target.closest<HTMLElement>('[data-analytics-choice]');
  const choice = button?.dataset.analyticsChoice;
  if (choice !== 'granted' && choice !== 'denied') return;
  document.cookie = `${cookieName}=${choice}; Max-Age=15552000; Path=/; SameSite=Lax${location.protocol === 'https:' ? '; Secure' : ''}`;
  if (choice === 'denied') {
    host[`ga-disable-${measurementId}`] = true;
    clearAnalyticsCookies();
    // Unload an already-running Google tag rather than leaving background listeners.
    if (configured) {location.reload(); return;}
  }
  updateControls();
  trackPage();
});

function onPageLoad() {updateControls(); trackPage();}
document.addEventListener('astro:page-load', onPageLoad);
onPageLoad();
