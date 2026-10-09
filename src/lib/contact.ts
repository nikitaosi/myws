export type ContactConfig = {
  siteKey?: string;
  turnstileSecret?: string;
  resendKey?: string;
  from?: string;
};
export type ContactValues = {name: string; email: string; message: string};
export type ContactResult = {status: number; sent: boolean; feedback: string; values: ContactValues};
const empty: ContactValues = {name: '', email: '', message: ''};
const recipient = 'nikitaosipov.51@gmail.com';

export function contactReady(config: ContactConfig): boolean {
  return Boolean(config.siteKey && config.turnstileSecret && config.resendKey && config.from);
}

export async function submitContact(request: Request, config: ContactConfig, fetcher: typeof fetch = fetch): Promise<ContactResult> {
  const result = (status: number, feedback: string, values = empty, sent = false): ContactResult => ({status, feedback, values, sent});
  if (request.headers.get('origin') !== new URL(request.url).origin) {
    return result(403, 'Please submit the form from this website.');
  }
  if (!contactReady(config)) return result(503, 'The form is temporarily unavailable. Please contact me by email or Telegram.');
  if (!request.headers.get('content-type')?.startsWith('application/x-www-form-urlencoded')) {
    return result(415, 'Please use the contact form to send your message.');
  }
  // Bound the actual stream, including requests without Content-Length.
  const reader = request.body?.getReader();
  if (!reader) return result(400, 'Please enter your email and message.');
  let text = '';
  let bytes = 0;
  const decoder = new TextDecoder();
  try {
    while (true) {
      const {done, value} = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > 64_000) {
        await reader.cancel();
        return result(413, 'Your message is too long. Please keep it under 5,000 characters.');
      }
      text += decoder.decode(value, {stream: true});
    }
    text += decoder.decode();
  } catch {
    return result(400, 'The form could not be read. Please try again.');
  } finally {
    reader.releaseLock();
  }
  const form = new URLSearchParams(text);
  if (form.get('website')) return result(400, 'The message could not be sent. Please use email or Telegram.');
  const values = {
    name: (form.get('name') ?? '').trim(),
    email: (form.get('email') ?? '').trim(),
    message: (form.get('message') ?? '').trim(),
  };
  const safeValues = {name: values.name.slice(0, 80), email: values.email.slice(0, 254), message: values.message.slice(0, 5000)};
  if (values.name.length > 80 || /[\r\n\x00]/.test(values.name)) return result(400, 'Please enter a name under 80 characters.', safeValues);
  if (values.email.length > 254 || !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(values.email) || /[\x00-\x1f\x7f]/.test(values.email)) {
    return result(400, 'Please enter a valid email address so I can reply.', safeValues);
  }
  if (values.message.length < 10 || values.message.length > 5000) return result(400, 'Please write a message between 10 and 5,000 characters.', safeValues);
  const token = form.get('cf-turnstile-response') ?? '';
  if (!token || token.length > 2048) return result(400, 'Please complete the verification and try again.', safeValues);
  try {
    const verification = await fetcher('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({secret: config.turnstileSecret, response: token}),
      signal: AbortSignal.timeout(10_000),
    });
    if (!verification.ok) return result(503, 'Verification is temporarily unavailable. Please try again or use email.', safeValues);
    const check = await verification.json() as {success?: boolean; hostname?: string; action?: string};
    if (check.success !== true || check.hostname !== new URL(request.url).hostname || check.action !== 'contact') {
      return result(400, 'Verification expired or failed. Please verify again; your message is still here.', safeValues);
    }
  } catch {
    return result(503, 'Verification is temporarily unavailable. Please try again or use email.', safeValues);
  }
  try {
    const delivery = await fetcher('https://api.resend.com/emails', {
      method: 'POST',
      headers: {'Authorization': `Bearer ${config.resendKey}`, 'Content-Type': 'application/json'},
      body: JSON.stringify({
        from: config.from,
        to: [recipient],
        reply_to: values.email,
        subject: 'New message from nikitaosi.dev',
        text: `Name: ${values.name || '(not provided)'}\nEmail: ${values.email}\n\n${values.message}`,
      }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!delivery.ok) return result(502, 'Your message could not be sent. Your text is still here — please try again or contact me by email.', safeValues);
    const receipt = await delivery.json() as {id?: string};
    if (!receipt.id) return result(502, 'Your message could not be confirmed. Please contact me by email.', safeValues);
    return result(200, 'Thanks — your message has been sent. I’ll reply to your email.', empty, true);
  } catch {
    // A timeout can occur after the provider accepts a message: do not silently resend.
    return result(502, 'Sending could not be confirmed. Your text is still here; please contact me by email if needed.', safeValues);
  }
}
