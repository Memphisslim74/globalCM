const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } });
const clean = (value, max = 2000) => String(value ?? '').replace(/\0/g, '').trim().slice(0, max);
const escapeHtml = (value) => clean(value, 10000).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[char]);
const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

async function sendEmail(env, payload) {
  const response = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.message || 'Email delivery failed.');
  return result;
}

const shell = (eyebrow, title, intro, body) => `<!doctype html><html><body style="margin:0;background:#f7f1e7;padding:24px;font-family:Arial,sans-serif;color:#102f38"><table role="presentation" width="100%"><tr><td align="center"><table role="presentation" width="100%" style="max-width:680px;background:#fff;border-radius:20px;overflow:hidden"><tr><td style="background:#082229;padding:30px;text-align:center;color:#fff"><div style="font-family:Georgia,serif;font-size:26px">THE GLOBAL CO-MISSION</div><div style="margin-top:7px;color:#e2a94b;font-size:12px;letter-spacing:1.5px">DEMONSTRATING THE GOSPEL WORLDWIDE, TOGETHER</div></td></tr><tr><td style="padding:34px"><div style="color:#d9674b;font-size:12px;font-weight:bold;letter-spacing:1.2px">${eyebrow}</div><h1 style="font-family:Georgia,serif;font-weight:normal;font-size:34px;margin:10px 0">${title}</h1><p style="color:#5f6f72;line-height:1.6">${intro}</p>${body}</td></tr><tr><td style="background:#f7f1e7;padding:22px;text-align:center;color:#5f6f72;font-size:13px">The Global Co-Mission · <a href="https://www.gcom.world" style="color:#d9674b">gcom.world</a></td></tr></table></td></tr></table></body></html>`;

export async function onRequestPost({ request, env }) {
  if (!env.RESEND_API_KEY) return json({ ok: false, message: 'The contact form is not configured yet. Please email connect@gcom.world.' }, 500);
  let body;
  try { body = await request.json(); } catch { return json({ ok: false, message: 'Invalid submission.' }, 400); }
  if (clean(body.company_website, 200)) return json({ ok: true, message: 'Thank you.' });

  const name = clean(body.name, 100);
  const email = clean(body.email, 200);
  const phone = clean(body.phone, 50);
  const organization = clean(body.organization, 160);
  const location = clean(body.location, 120);
  const interest = clean(body.interest, 120);
  const message = clean(body.message, 5000);
  const source = clean(body.source_page, 300) || '/';
  if (!name || !email || !message) return json({ ok: false, message: 'Please provide your name, email, and message.' }, 400);
  if (!isEmail(email)) return json({ ok: false, message: 'Please enter a valid email address.' }, 400);

  const from = env.CONTACT_FROM_EMAIL || 'The Global Co-Mission <forms@gcom.world>';
  const to = env.CONTACT_TO_EMAIL || 'connect@gcom.world';
  const details = `<div style="margin-top:24px;background:#f7f1e7;padding:20px;border-radius:12px;line-height:1.7"><strong>Name:</strong> ${escapeHtml(name)}<br><strong>Email:</strong> ${escapeHtml(email)}<br><strong>Phone:</strong> ${escapeHtml(phone || 'Not provided')}<br><strong>Church / organization:</strong> ${escapeHtml(organization || 'Not provided')}<br><strong>Location:</strong> ${escapeHtml(location || 'Not provided')}<br><strong>Interest:</strong> ${escapeHtml(interest || 'General inquiry')}<br><strong>Source:</strong> ${escapeHtml(source)}<hr style="border:0;border-top:1px solid #d9d1c5"><div style="white-space:pre-wrap">${escapeHtml(message)}</div></div>`;
  const adminHtml = shell('NEW MESSAGE', `A new message from ${escapeHtml(name)}`, 'A visitor submitted the GCOM website contact form.', details);
  const customerHtml = shell('MESSAGE RECEIVED', `Thank you, ${escapeHtml(name)}.`, 'We received your message. A member of The Global Co-Mission team will review it and follow up as soon as possible.', `${details}<div style="margin-top:24px"><strong>What happens next</strong><ol style="line-height:1.7"><li>Our team reviews your message.</li><li>We route it to the right ministry leader.</li><li>We follow up using the contact information you provided.</li></ol></div>`);

  try {
    const sent = await sendEmail(env, { from, to: [to], reply_to: email, subject: `New GCOM website message: ${name}${interest ? ` — ${interest}` : ''}`, html: adminHtml, text: `Name: ${name}\nEmail: ${email}\nPhone: ${phone}\nOrganization: ${organization}\nLocation: ${location}\nInterest: ${interest}\nSource: ${source}\n\n${message}` });
    let confirmationSent = true;
    try { await sendEmail(env, { from, to: [email], reply_to: to, subject: 'We received your message — The Global Co-Mission', html: customerHtml, text: `Thank you, ${name}. We received your message and will follow up soon.\n\n${message}\n\nhttps://www.gcom.world` }); } catch (error) { confirmationSent = false; console.error('Confirmation email failed', error); }
    return json({ ok: true, confirmationSent, id: sent.id });
  } catch (error) {
    console.error('Contact delivery failed', error);
    return json({ ok: false, message: 'We could not send your message. Please email connect@gcom.world.' }, 502);
  }
}

export function onRequestGet() { return json({ ok: false, message: 'Method not allowed.' }, 405); }
