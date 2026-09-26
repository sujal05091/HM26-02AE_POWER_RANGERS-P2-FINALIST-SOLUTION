// SMS delivery. Real SMS only when Twilio is configured in .env.local:
//   TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM (a Twilio phone number)
// Without them, messages are recorded as "simulated" and delivered in-app only.

export function smsProvider() {
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM } = process.env;
  return TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_FROM ? 'twilio' : null;
}

export async function sendSms(to, body) {
  if (smsProvider() !== 'twilio') return { status: 'simulated' };
  const { TWILIO_ACCOUNT_SID: sid, TWILIO_AUTH_TOKEN: token, TWILIO_FROM: from } = process.env;
  try {
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ To: to.replace(/\s+/g, ''), From: from, Body: body }),
      signal: AbortSignal.timeout(15_000),
    });
    const json = await res.json().catch(() => ({}));
    return res.ok ? { status: 'sent', id: json.sid } : { status: 'failed', error: json.message || `HTTP ${res.status}` };
  } catch (err) {
    return { status: 'failed', error: err.message };
  }
}
