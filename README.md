# Nikita Osipov's website

Personal website built with Astro and deployed at [nikitaosi.dev](https://nikitaosi.dev/).

Use Node.js 24 (see `.nvmrc`). The repository includes Yarn, so no global Yarn installation is required.

```sh
node .yarn/releases/yarn-4.1.1.cjs install --immutable
node .yarn/releases/yarn-4.1.1.cjs dev
```

The server uses an explicit theme cookie when present; otherwise it renders system mode. CSS `prefers-color-scheme` resolves system mode before the first paint, including without JavaScript. The browser script synchronizes the toggle and only writes a theme cookie after a manual choice.

To run the browser tests, install Playwright's headless Chromium once, then run the tests:

```sh
node node_modules/playwright/cli.js install chromium --only-shell
node .yarn/releases/yarn-4.1.1.cjs test:e2e
```

Run the production build with `node .yarn/releases/yarn-4.1.1.cjs build`.

## Dependency security

`package.json` pins `ipx/sharp` to 0.35.5 to address the libvips and libheif advisories affecting the older version pulled in by Netlify's local image tooling. Remove this resolution when `ipx` adopts a patched version of `sharp` in its supported dependency range.

Netlify's current compatible development tooling still pulls in `extract-zip` 2.0.1, which has two open symlink/path-traversal advisories and no patched release. Local Netlify features are disabled via `devFeatures: false` in `astro.config.mjs`; this reduces exposure but does not fix the dependency. Recheck when the Astro Netlify adapter supports the newer Netlify tooling that no longer uses `extract-zip`.


## Search and social metadata

`BaseLayout.astro` emits unique titles/descriptions, a query-free production canonical, Open Graph metadata and X/Twitter large-image cards on all four pages. The shared Schema.org graph in `src/lib/seo.ts` links `Person`, `WebSite` and the current page using stable IDs. The homepage is a `ProfilePage`, experience an `AboutPage`, projects a `CollectionPage` with an `ItemList` of source-code projects, and contact a `ContactPage`. Project descriptions and repository links come directly from the visible cards. No ratings, reviews or prices are invented for rich-result eligibility.

The 1200 × 630 PNG at `/images/social-card.png` is committed so social crawlers can fetch it without JavaScript or cookies. Run `yarn generate:social` after changing the card design or profile name/title. Its source is `scripts/generate-social-card.mjs`; `sharp` is a build/development dependency, not a browser library.

The public `/robots.txt` allows crawling and references `/sitemap.xml`. Search Console domain ownership is verified by DNS (keep that TXT record), and the sitemap contains the four public pages. The discovery tests check HTML metadata, graph relationships, PNG dimensions, sitemap entries and real 404 responses. After deploying changes, use Google's Rich Results Test and Schema.org's validator to check the live URLs. Valid Schema.org markup does not guarantee a Google rich result, indexing or ranking. Open Graph controls link previews, not search ranking.

## Google Analytics

GA4 uses the public Measurement ID `G-Y3NDRQ23RY` in `src/lib/analytics.ts`. Google is only loaded on `nikitaosi.dev` / `www.nikitaosi.dev`, after an explicit opt-in. Local and Netlify preview visits are not tracked. The consent choice is saved for 180 days in the first-party `analytics_consent` cookie; the footer's **Analytics preferences** button allows changing it. Rejecting after accepting clears this site's `_ga` cookies and reloads without loading Google. Theme preferences are independent.

This is a basic consent implementation: before acceptance there is no Google tag, preconnect or cookieless Google ping. Ads storage, ad personalization and Google Signals are disabled. The code sends manual page views on `astro:page-load`, including the first accepted view, with page titles and referrers. It does not send form field contents, email addresses or arbitrary URL parameters. Only standard UTM campaign parameters are retained; do not put personal data in campaign links.

**GA4 property setup:** Enhanced measurement is switched off for this site's web stream. The explicit page views still provide visitor, page and traffic-source reports, without automatic form-interaction or other enhanced events. Keep Enhanced measurement off, or at least disable **Page changes based on browser history events** if enabling other automatic events later. `send_page_view: false` only disables initial automatic views, not history-based ones.

Verify with GA4 Realtime after opting in on production. Ad blockers and visitors who reject analytics will not be counted; this is not a complete server-access log. The Google integration tests intercept Google requests and never send test visits to the real property.

References: [manual page views](https://developers.google.com/analytics/devguides/collection/ga4/views) and [basic consent mode](https://developers.google.com/tag-platform/security/concepts/consent-mode).

## Contact form


Step-by-step setup for this site: [Cloudflare, Resend and Netlify](docs/contact-setup.md). Run `yarn check:contact` to check local settings without printing keys or sending email.

`/contact/` accepts native form POSTs, verifies Cloudflare Turnstile on the server, and sends plain-text messages via Resend to `nikitaosipov.51@gmail.com`. The visitor's email is only used as Reply-To. No message body or secret is logged. Direct email and Telegram links stay available.

Set these **server runtime** environment variables in Netlify (Functions scope) and redeploy:

- `TURNSTILE_SITE_KEY`: public key for a Managed Turnstile widget. Allow `nikitaosi.dev` (and `www.nikitaosi.dev` only if served).
- `TURNSTILE_SECRET_KEY`: secret for the same widget.
- `RESEND_API_KEY`: a key with permission to send email.
- `CONTACT_FROM_EMAIL`: `Nikita Osipov <contact@mail.nikitaosi.dev>`, using the sending subdomain verified in Resend.

Copy `.env.example` to `.env` for local settings. Do not commit keys. The form stays disabled with a direct-contact fallback until all four settings exist. For a real local submission, use a separate Turnstile widget allowing the local hostname. Official dummy keys return test metadata that may not satisfy the handler's strict hostname and `contact` action checks. Automated tests mock verification. Do not weaken these checks to accommodate local or preview domains: register the intended hostnames in the appropriate widget instead.

Setup references: [Turnstile widget setup](https://developers.cloudflare.com/turnstile/get-started/) and [Resend domain verification](https://resend.com/docs/dashboard/domains/introduction). No paid service or account is created by this code.

Before launch, verify a real submission arrives in the mailbox, Reply-To points to the visitor, failed/expired verification blocks delivery, and both themes work on desktop and mobile. Automated contact tests mock both providers and never send real emails.
