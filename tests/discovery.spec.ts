import {expect, test} from '@playwright/test';
import {profile} from '../src/lib/profile';

for (const path of ['/', '/experience/', '/projects/']) {
  test(`serves discovery metadata in the initial HTML for ${path}`, async ({request}) => {
    const response = await request.get(`${path}?ref=test`);
    expect(response.status()).toBe(200);
    const html = await response.text();
    expect(html).toContain(`rel="canonical" href="https://nikitaosi.dev${path}"`);
    expect(html).toMatch(/<meta name="description" content="[^"]+"/);
    expect(html).toContain('rel="describedby" href="/llms.txt"');
  });
}

test('serves a Person matching the visible profile without JavaScript', async ({request}) => {
  const html = await (await request.get('/')).text();
  const json = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1];
  expect(json).toBeTruthy();
  const person = JSON.parse(json!);
  expect(person['@type']).toBe('Person');
  expect(person.name).toBe(profile.name);
  expect(person.description).toBe(profile.description);
  expect(person.knowsAbout).toEqual(profile.skills);
  expect(person.sameAs).toEqual(profile.sameAs);
  expect(html).toContain(profile.description);
});

test('allows crawling and exposes sitemap and agent summary', async ({request}) => {
  const robots = await request.get('/robots.txt');
  expect(robots.status()).toBe(200);
  expect(await robots.text()).toContain('Allow: /');
  expect(await robots.text()).not.toMatch(/Disallow:\s*\//);
  expect(await robots.text()).toContain('Sitemap: https://nikitaosi.dev/sitemap.xml');

  const sitemap = await request.get('/sitemap.xml');
  expect(sitemap.status()).toBe(200);
  expect(sitemap.headers()['content-type']).toContain('application/xml');
  const xml = await sitemap.text();
  for (const path of ['/', '/experience/', '/projects/']) {
    expect(xml).toContain(`<loc>https://nikitaosi.dev${path}</loc>`);
  }

  const summary = await request.get('/llms.txt');
  expect(summary.status()).toBe(200);
  expect(summary.headers()['content-type']).toContain('text/plain');
  const text = await summary.text();
  expect(text).toContain(profile.description);
  expect(text).toContain(profile.skills.join(', '));
  expect(text).toContain('https://nikitaosi.dev/CV_Nikita_Osipov.pdf');
});
