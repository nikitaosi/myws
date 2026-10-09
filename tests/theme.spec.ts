import {expect, test} from '@playwright/test';

const themes = [
  {label: 'without a cookie, light OS', name: 'system', cookie: undefined, system: 'light', dark: false, color: 'rgb(1, 44, 86)'},
  {label: 'without a cookie, dark OS', name: 'system', cookie: undefined, system: 'dark', dark: true, color: 'rgb(234, 237, 243)'},
  {label: 'invalid cookie, dark OS', name: 'system', cookie: 'invalid', system: 'dark', dark: true, color: 'rgb(234, 237, 243)'},
  {label: 'light cookie, dark OS', name: 'light', cookie: 'light', system: 'dark', dark: false, color: 'rgb(1, 44, 86)'},
  {label: 'dark cookie, light OS', name: 'dark', cookie: 'dark', system: 'light', dark: true, color: 'rgb(234, 237, 243)'},
] as const;

for (const {label, name, cookie, color, system, dark} of themes) {
  test(`renders the ${name} theme on the first response ${label}`, async ({context, page}) => {
    await page.emulateMedia({colorScheme: system});
    if (cookie) {
      await context.addCookies([{name: 'theme', value: cookie, url: 'http://127.0.0.1:4322'}]);
    }

    const response = await page.goto('/');
    expect(response?.status()).toBe(200);
    expect(await response!.text()).toMatch(new RegExp(`<html[^>]*class="${name}"`));

    await expect(page.locator('html')).toHaveClass(name);
    await expect(page.getByRole('checkbox', {name: 'Toggle theme'})).toBeChecked({checked: dark});
    await expect(page.locator('body')).toHaveCSS('color', color);
  });
}

test('keeps the selected theme across navigation and reload', async ({page}) => {
  await page.emulateMedia({colorScheme: 'light'});
  await page.goto('/');
  const toggle = page.getByRole('checkbox', {name: 'Toggle theme'});

  await toggle.check();
  await expect(page.locator('html')).toHaveClass('dark');

  await page.getByRole('link', {name: 'projects'}).click();
  await expect(page).toHaveURL(/\/projects\/$/);
  await expect(page.locator('html')).toHaveClass('dark');
  await expect(page.getByRole('checkbox', {name: 'Toggle theme'})).toBeChecked();

  await page.reload();
  await expect(page.locator('html')).toHaveClass('dark');
  await expect(page.getByRole('checkbox', {name: 'Toggle theme'})).toBeChecked();
});

for (const colorScheme of ['light', 'dark'] as const) {
  test(`system ${colorScheme} colors work without JavaScript`, async ({browser}) => {
    const context = await browser.newContext({javaScriptEnabled: false, colorScheme});
    try {
      const page = await context.newPage();
      await page.goto('http://127.0.0.1:4322/');
      await expect(page.locator('html')).toHaveClass('system');
      await expect(page.locator('body')).toHaveCSS('color', colorScheme === 'dark' ? 'rgb(234, 237, 243)' : 'rgb(1, 44, 86)');
      expect((await context.cookies()).some((cookie) => cookie.name === 'theme')).toBe(false);
    } finally {
      await context.close();
    }
  });
}

test('follows OS changes until a manual choice and keeps that choice', async ({page, context}) => {
  await page.emulateMedia({colorScheme: 'dark'});
  await page.goto('/');
  const toggle = page.getByRole('checkbox', {name: 'Toggle theme'});
  await expect(toggle).toBeChecked();
  expect((await context.cookies()).some((cookie) => cookie.name === 'theme')).toBe(false);
  await page.emulateMedia({colorScheme: 'light'});
  await expect(toggle).not.toBeChecked();
  await expect(page.locator('body')).toHaveCSS('color', 'rgb(1, 44, 86)');
  await page.emulateMedia({colorScheme: 'dark'});
  await expect(toggle).toBeChecked();
  await toggle.uncheck();
  await expect(page.locator('html')).toHaveClass('light');
  expect((await context.cookies()).find((cookie) => cookie.name === 'theme')?.value).toBe('light');
  await page.getByRole('link', {name: 'projects'}).click();
  await expect(page.locator('html')).toHaveClass('light');
  await page.reload();
  await expect(page.locator('body')).toHaveCSS('color', 'rgb(1, 44, 86)');
  await expect(page.getByRole('checkbox', {name: 'Toggle theme'})).not.toBeChecked();
});
