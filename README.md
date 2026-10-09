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
