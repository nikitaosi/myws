// Presence/format check only. Never print secret values or contact providers.
const required = ['TURNSTILE_SITE_KEY', 'TURNSTILE_SECRET_KEY', 'RESEND_API_KEY', 'CONTACT_FROM_EMAIL'];
let ready = true;
for (const key of required) {
  const present = Boolean(process.env[key]?.trim());
  console.log(`${key}: ${present ? 'configured' : 'missing'}`);
  if (!present) ready = false;
}
const sender = process.env.CONTACT_FROM_EMAIL?.trim();
if (sender && !/^(?:[^<>\r\n]+\s*<[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+>|[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+)$/.test(sender)) {
  console.log('CONTACT_FROM_EMAIL: check sender format');
  ready = false;
}
console.log(ready ? 'Settings present. Verify domain and real delivery before launch.' : 'Contact delivery is not configured yet. See docs/contact-setup.md.');
process.exitCode = ready ? 0 : 1;
