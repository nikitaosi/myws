import {expect, test} from '@playwright/test';
import {submitContact, type ContactConfig} from '../src/lib/contact';

const config: ContactConfig = {siteKey: 'test-site', turnstileSecret: 'test-secret', resendKey: 'test-mail', from: 'Portfolio <contact@example.com>'};
const values = {name: 'Visitor', email: 'visitor@example.com', message: 'I need help with a React interface.', 'cf-turnstile-response': 'test-token'};
function request(fields: Record<string, string> = {}, origin = 'https://nikitaosi.dev') {
  return new Request('https://nikitaosi.dev/contact/', {
    method: 'POST', headers: {'Content-Type': 'application/x-www-form-urlencoded', origin},
    body: new URLSearchParams({...values, ...fields}),
  });
}
function transport(verify: Record<string, unknown> = {success: true, hostname: 'nikitaosi.dev', action: 'contact'}, mailStatus = 200) {
  const calls: {url: string; body: Record<string, unknown>}[] = [];
  const fetcher: typeof fetch = async (input, init) => {
    const url = String(input);
    calls.push({url, body: JSON.parse(String(init?.body))});
    return Response.json(url.includes('siteverify') ? verify : {id: 'mail-id'}, {status: url.includes('siteverify') ? 200 : mailStatus});
  };
  return {calls, fetcher};
}

test('delivers only after a valid captcha, to the fixed recipient with a safe reply address', async () => {
  const {fetcher, calls} = transport();
  const result = await submitContact(request(), config, fetcher);
  expect(result.sent).toBe(true);
  expect(result.values.message).toBe('');
  expect(calls).toHaveLength(2);
  expect(calls[0].url).toContain('siteverify');
  expect(calls[1].body.to).toEqual(['nikitaosipov.51@gmail.com']);
  expect(calls[1].body.reply_to).toBe(values.email);
  expect(calls[1].body.text).toContain(values.message);
});

for (const [label, fields] of [
  ['missing captcha', {'cf-turnstile-response': ''}],
  ['header injection', {email: 'visitor@example.com\r\nBcc: other@example.com'}],
  ['short message', {message: 'hello'}],
  ['long message', {message: 'a'.repeat(5001)}],
  ['honeypot', {website: 'spam.example'}],
] as const) {
  test(`rejects ${label} before making external requests`, async () => {
    const {fetcher, calls} = transport();
    expect((await submitContact(request(fields), config, fetcher)).status).toBe(400);
    expect(calls).toHaveLength(0);
  });
}

for (const check of [
  {success: false, hostname: 'nikitaosi.dev', action: 'contact'},
  {success: true, hostname: 'other.example', action: 'contact'},
  {success: true, hostname: 'nikitaosi.dev', action: 'login'},
]) {
  test(`rejects untrusted captcha result ${JSON.stringify(check)}`, async () => {
    const {fetcher, calls} = transport(check);
    const result = await submitContact(request(), config, fetcher);
    expect(result.status).toBe(400);
    expect(result.sent).toBe(false);
    expect(result.values.message).toBe(values.message);
    expect(calls).toHaveLength(1);
  });
}

test('rejects another origin and an unconfigured form without external requests', async () => {
  const {fetcher, calls} = transport();
  expect((await submitContact(request({}, 'https://other.example'), config, fetcher)).status).toBe(403);
  expect((await submitContact(request(), {}, fetcher)).status).toBe(503);
  expect(calls).toHaveLength(0);
});

test('limits streamed request bodies without relying on Content-Length', async () => {
  const {fetcher, calls} = transport();
  const result = await submitContact(request({message: 'a'.repeat(65_000)}), config, fetcher);
  expect(result.status).toBe(413);
  expect(calls).toHaveLength(0);
});

test('preserves the message when email delivery fails and never claims success', async () => {
  const {fetcher} = transport(undefined, 429);
  const result = await submitContact(request(), config, fetcher);
  expect(result.status).toBe(502);
  expect(result.sent).toBe(false);
  expect(result.values).toEqual({name: values.name, email: values.email, message: values.message});
});

test('fails closed on a verification network failure', async () => {
  const fetcher: typeof fetch = async () => {throw new Error('timeout');};
  const result = await submitContact(request(), config, fetcher);
  expect(result.status).toBe(503);
  expect(result.sent).toBe(false);
  expect(result.values.message).toBe(values.message);
});
