import {defineConfig} from '@playwright/test';

const baseURL = 'http://127.0.0.1:4322';

export default defineConfig({
  testDir: './tests',
  use: {baseURL},
  webServer: {
    command: `${JSON.stringify(process.execPath)} .yarn/releases/yarn-4.1.1.cjs dev --host 127.0.0.1 --port 4322`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {ASTRO_TELEMETRY_DISABLED: '1'},
  },
});
