# Nikita Osipov's website

Personal website built with Astro and deployed at [nikitaosi.dev](https://nikitaosi.dev/).

Use Node.js 24 (see `.nvmrc`). The repository includes Yarn, so no global Yarn installation is required.

```sh
node .yarn/releases/yarn-4.1.1.cjs install --immutable
node .yarn/releases/yarn-4.1.1.cjs dev
```

The theme is read from a cookie during server rendering so the correct colors are present in the first HTML response. The browser script only handles theme changes.

To run the browser tests, install Playwright's headless Chromium once, then run the tests:

```sh
node node_modules/playwright/cli.js install chromium --only-shell
node .yarn/releases/yarn-4.1.1.cjs test:e2e
```

Run the production build with `node .yarn/releases/yarn-4.1.1.cjs build`.
