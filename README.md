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
