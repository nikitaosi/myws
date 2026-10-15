import {expect, test} from '@playwright/test';
import {profile} from '../src/lib/profile';

const pageTypes = {'/': 'ProfilePage', '/experience/': 'AboutPage', '/projects/': 'CollectionPage', '/contact/': 'ContactPage'};

for (const [path, pageType] of Object.entries(pageTypes)) {
  test(`serves discovery metadata in the initial HTML for ${path}`, async ({request}) => {
    const response = await request.get(`${path}?ref=test`);
    expect(response.status()).toBe(200);
    const html = await response.text();
    expect(html).toContain(`rel="canonical" href="https://nikitaosi.dev${path}"`);
    expect(html).toMatch(/<meta name="description" content="[^"]+"/);
    expect(html).toContain('rel="describedby" href="/llms.txt"');
    expect((html.match(/rel="canonical"/g) || [])).toHaveLength(1);
    expect((html.match(/type="application\/ld\+json"/g) || [])).toHaveLength(1);
    expect(html).toContain(`property="og:url" content="https://nikitaosi.dev${path}"`);
    expect(html).toContain('property="og:image" content="https://nikitaosi.dev/images/social-card.png"');
    expect(html).toContain('property="og:image:width" content="1200"');
    expect(html).toContain('property="og:image:height" content="630"');
    expect(html).toContain('name="twitter:card" content="summary_large_image"');
    expect(html).not.toMatch(/noindex|nofollow/);
    const schema = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)![1]);
    expect(schema['@context']).toBe('https://schema.org');
    expect(schema['@graph'].find((node: Record<string, unknown>) => node['@type'] === pageType)).toMatchObject({
      '@id': `https://nikitaosi.dev${path}#webpage`,
      url: `https://nikitaosi.dev${path}`,
      isPartOf: {'@id': 'https://nikitaosi.dev/#website'},
    });
  });
}

test('serves a Person matching the visible profile without JavaScript', async ({request}) => {
  const html = await (await request.get('/')).text();
  const json = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1];
  expect(json).toBeTruthy();
  const graph = JSON.parse(json!)['@graph'];
  const person = graph.find((node: Record<string, unknown>) => node['@type'] === 'Person');
  expect(person['@type']).toBe('Person');
  expect(person.name).toBe(profile.name);
  expect(person.description).toBe(profile.description);
  expect(person.knowsAbout).toEqual(profile.skills);
  expect(person.sameAs).toEqual(profile.sameAs);
  expect(person.image).toMatch(/^https:\/\/nikitaosi\.dev\//);
  expect(graph.find((node: Record<string, unknown>) => node['@type'] === 'ProfilePage').mainEntity).toEqual({'@id': person['@id']});
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
  for (const path of Object.keys(pageTypes)) {
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

test('project schema matches visible cards without invented ratings', async ({request}) => {
  const html = await (await request.get('/projects/')).text();
  const graph = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)![1])['@graph'];
  const list = graph.find((node: Record<string, unknown>) => node['@type'] === 'CollectionPage').mainEntity;
  expect(list['@type']).toBe('ItemList');
  expect(list.numberOfItems).toBe(2);
  for (const [index, entry] of list.itemListElement.entries()) {
    expect(entry.position).toBe(index + 1);
    expect(entry.item['@type']).toBe('SoftwareSourceCode');
    expect(html).toContain(entry.item.name);
    expect(html).toContain(entry.item.description);
    for (const url of entry.item.codeRepository) expect(html).toContain(`href="${url}"`);
    expect(html).toContain(`href="${entry.item.targetProduct.url}"`);
    expect(entry.item.aggregateRating).toBeUndefined();
    expect(entry.item.offers).toBeUndefined();
  }
});

test('social preview is a publicly served 1200 × 630 PNG', async ({request}) => {
  const image = await request.get('/images/social-card.png');
  expect(image.status()).toBe(200);
  expect(image.headers()['content-type']).toContain('image/png');
  const png = await image.body();
  expect(png.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
  expect(png.readUInt32BE(16)).toBe(1200);
  expect(png.readUInt32BE(20)).toBe(630);
});

test('missing pages return a real 404', async ({request}) => {
  expect((await request.get('/nonexistent-seo-test-page/')).status()).toBe(404);
});

test('Astro navigation replaces page metadata and JSON-LD without duplicates', async ({page}) => {
  await page.goto('/');
  await page.getByRole('link', {name: 'projects', exact: true}).click();
  await expect(page).toHaveURL(/\/projects\/$/);
  await expect(page.locator('head link[rel="canonical"]')).toHaveCount(1);
  await expect(page.locator('head link[rel="canonical"]')).toHaveAttribute('href', 'https://nikitaosi.dev/projects/');
  const schema = page.locator('head script[type="application/ld+json"]');
  await expect(schema).toHaveCount(1);
  const graph = JSON.parse((await schema.textContent())!)['@graph'];
  expect(graph.find((node: Record<string, unknown>) => node['@type'] === 'CollectionPage')).toBeTruthy();
  expect(graph.some((node: Record<string, unknown>) => node['@type'] === 'ProfilePage')).toBe(false);
  await expect(page.locator('head meta[property="og:title"]')).toHaveAttribute('content', 'Projects — Nikita Osipov');
});
