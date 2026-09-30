import {expect, test} from '@playwright/test';

const themes = [
  {label: 'without a cookie', name: 'light', cookie: undefined, color: 'rgb(1, 44, 86)'},
  {label: 'with a light cookie', name: 'light', cookie: 'light', color: 'rgb(1, 44, 86)'},
  {label: 'with a dark cookie', name: 'dark', cookie: 'dark', color: 'rgb(234, 237, 243)'},
] as const;

for (const {label, name, cookie, color} of themes) {
  test(`renders the ${name} theme on the first response ${label}`, async ({context, page}) => {
    if (cookie) {
      await context.addCookies([{name: 'theme', value: cookie, url: 'http://127.0.0.1:4322'}]);
    }

    const response = await page.goto('/');
    expect(response?.status()).toBe(200);
    expect(await response!.text()).toMatch(new RegExp(`<html[^>]*class="${name}"`));

    await expect(page.locator('html')).toHaveClass(name);
    await expect(page.getByRole('checkbox', {name: 'Toggle theme'})).toBeChecked({checked: name === 'dark'});
    await expect(page.locator('body')).toHaveCSS('color', color);
  });
}

test('keeps the selected theme across navigation and reload', async ({page}) => {
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
