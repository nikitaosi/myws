import {expect, test, type BrowserContext, type Page} from '@playwright/test';

const production = 'https://nikitaosi.dev';
const googleScript = 'https://www.googletagmanager.com/gtag/js?id=G-Y3NDRQ23RY';

test.afterEach(async ({context}) => {
  await context.unrouteAll({behavior: 'ignoreErrors'});
});

// Exercise the real production-host gate while serving only the local test app.
// All Google scripts/requests are intercepted: no real analytics is sent.
async function prepare(context: BrowserContext) {
  const googleRequests: string[] = [];
  await context.route(`${production}/**`, async (route) => {
    if (['image', 'font'].includes(route.request().resourceType())) {
      await route.fulfill({status: 200, contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg"/>'});
      return;
    }
    try {
      const response = await route.fetch({url: route.request().url().replace(production, 'http://127.0.0.1:4322')});
      await route.fulfill({response});
    } catch (error) {
      // A reload or Astro swap can cancel an in-flight prefetch.
      if (!route.request().failure() && !(error instanceof Error && /Route is already handled|Fetch response has been disposed/.test(error.message))) throw error;
    }
  });
  await context.route(/https:\/\/[^/]*(google-analytics\.com|googletagmanager\.com|analytics\.google\.com)\//, async (route) => {
    googleRequests.push(route.request().url());
    await route.fulfill({status: 200, contentType: 'application/javascript', body: '/* Google intentionally mocked */'});
  });
  return googleRequests;
}

async function commands(page: Page) {
  return page.evaluate(() => {
    const host = window as Window & {dataLayer?: IArguments[]};
    return (host.dataLayer || []).map((args) => Array.from(args));
  });
}

test('rejecting keeps Google unloaded across navigation and reload', async ({page, context}) => {
  const requests = await prepare(context);
  await page.goto(production);
  await expect(page.getByRole('region', {name: 'Optional analytics'})).toBeVisible();
  expect(requests).toEqual([]);
  expect(await commands(page)).toEqual([]);
  await page.getByRole('button', {name: 'Reject analytics', exact: true}).click();
  await page.getByRole('link', {name: 'projects', exact: true}).click();
  await expect(page).toHaveURL(`${production}/projects/`);
  await expect(page.getByRole('region', {name: 'Optional analytics'})).toBeHidden();
  await page.reload();
  expect(requests).toEqual([]);
  expect(await commands(page)).toEqual([]);
  expect((await context.cookies()).find((cookie) => cookie.name === 'analytics_consent')?.value).toBe('denied');
});

test('accepting sends one view per Astro navigation with sanitized URLs', async ({page, context}) => {
  const requests = await prepare(context);
  await page.goto(`${production}/?utm_source=linkedin&utm_medium=social&email=private%40example.com#secret`);
  await page.getByRole('button', {name: 'Accept analytics', exact: true}).click();
  await expect.poll(() => requests.length).toBe(1);
  expect(requests[0]).toBe(googleScript);
  const initial = await commands(page);
  expect(initial.find((args) => args[0] === 'config')?.[2]).toMatchObject({send_page_view: false, allow_google_signals: false, campaign_source: 'linkedin'});
  expect(initial.filter((args) => args[1] === 'page_view')).toHaveLength(1);
  expect(JSON.stringify(initial)).not.toContain('private');
  expect(JSON.stringify(initial)).not.toContain('#secret');
  await page.getByRole('link', {name: 'projects', exact: true}).click();
  await expect(page).toHaveURL(`${production}/projects/`);
  await expect.poll(async () => (await commands(page)).filter((args) => args[1] === 'page_view').length).toBe(2);
  const views = (await commands(page)).filter((args) => args[1] === 'page_view');
  expect(views[1][2]).toMatchObject({page_location: `${production}/projects/`});
  expect(requests).toHaveLength(1);
  await page.goBack();
  await expect.poll(async () => (await commands(page)).filter((args) => args[1] === 'page_view').length).toBe(3);
});

test('saved consent loads once; revoking removes cookies and stops Google', async ({page, context}) => {
  const requests = await prepare(context);
  await context.addCookies([{name: 'analytics_consent', value: 'granted', url: production}]);
  await page.goto(production);
  await expect.poll(() => requests.length).toBe(1);
  await expect(page.getByRole('region', {name: 'Optional analytics'})).toBeHidden();
  await context.addCookies([{name: '_ga', value: 'test', domain: '.nikitaosi.dev', path: '/'}]);
  await page.getByRole('button', {name: 'Analytics preferences', exact: true}).click();
  await page.getByRole('button', {name: 'Reject analytics', exact: true}).click();
  await expect.poll(async () => (await context.cookies()).find((cookie) => cookie.name === 'analytics_consent')?.value).toBe('denied');
  await expect.poll(async () => (await commands(page)).length).toBe(0);
  expect((await context.cookies()).some((cookie) => cookie.name === '_ga')).toBe(false);
  await page.getByRole('link', {name: 'projects', exact: true}).click();
  await expect(page).toHaveURL(`${production}/projects/`);
  expect(requests).toHaveLength(1);
});

test('localhost never loads Google, even after accepting', async ({page, context}) => {
  const requests = await prepare(context);
  await page.goto('/');
  await page.getByRole('button', {name: 'Accept analytics', exact: true}).click();
  await expect(page.getByRole('region', {name: 'Optional analytics'})).toBeHidden();
  expect(requests).toEqual([]);
  expect(await commands(page)).toEqual([]);
});

for (const width of [390, 1280]) {
  test(`consent banner stays compact at ${width}px`, async ({page}) => {
    await page.setViewportSize({width, height: 800});
    await page.goto('/');
    const banner = page.getByRole('region', {name: 'Optional analytics'});
    await expect(banner).toBeVisible();
    const box = await banner.boundingBox();
    expect(box!.width).toBeLessThanOrEqual(320);
    expect(box!.height).toBeLessThanOrEqual(130);
    expect(box!.x).toBeGreaterThanOrEqual(16);
    expect(box!.x + box!.width).toBeLessThanOrEqual(width - 16);
  });
}
