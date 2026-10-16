import { ConfidentialClientApplication } from '@azure/msal-node';
import { env } from '../config/env.js';
import { logger } from './logger.js';

// Outgoing email through Microsoft 365 (Microsoft Graph sendMail), sent from the mailbox in MAIL_FROM.
// Uses the Entra app from M365_TENANT_ID / M365_CLIENT_ID / M365_CLIENT_SECRET, which needs the
// Graph *application* permission Mail.Send with admin consent.
//
// Without MAIL_FROM, messages are written to the server log instead (development / not set up yet).
// In development every message is also logged, so links can be copied from the terminal.

const GRAPH = 'https://graph.microsoft.com/v1.0';
let msal = null;

function getClient() {
  msal ??= new ConfidentialClientApplication({
    auth: {
      clientId: env.m365.clientId,
      authority: `https://login.microsoftonline.com/${env.m365.tenantId}`,
      clientSecret: env.m365.clientSecret,
    },
  });
  return msal;
}

// App-only token for Graph; MSAL caches it until shortly before it expires.
async function graphToken() {
  const result = await getClient().acquireTokenByClientCredential({ scopes: ['https://graph.microsoft.com/.default'] });
  if (!result?.accessToken) throw new Error('No access token from Microsoft Entra ID');
  return result.accessToken;
}

const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

// Plain text -> simple branded HTML email (URLs become clickable links, line breaks kept).
export function toHtml(text) {
  const body = escapeHtml(text)
    .replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" style="color:#5c297c;font-weight:bold;word-break:break-all">$1</a>')
    .replace(/\n/g, '<br>');
  return `<!doctype html><html><body style="margin:0;background:#f8f5f9;font-family:Segoe UI,Roboto,Arial,sans-serif;color:#1b1024">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #ebe6ef">
<tr><td style="background:#2e0046;padding:18px 24px;color:#ffb736;font-weight:bold;font-size:15px;letter-spacing:1px">MCU ALUMNI</td></tr>
<tr><td style="padding:24px;font-size:15px;line-height:1.6">${body}</td></tr>
<tr><td style="padding:16px 24px;background:#f8f5f9;color:#625a6e;font-size:12px">Manila Central University Alumni Relations Office · EDSA, Caloocan City · alumni@mcu.edu.ph</td></tr>
</table></td></tr></table></body></html>`;
}

async function sendWithGraph({ to, subject, text }) {
  const res = await fetch(`${GRAPH}/users/${encodeURIComponent(env.mail.from)}/sendMail`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${await graphToken()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: {
        subject,
        body: { contentType: 'HTML', content: toHtml(text) },
        from: { emailAddress: { address: env.mail.from, name: env.mail.fromName } },
        toRecipients: [{ emailAddress: { address: to } }],
      },
      saveToSentItems: false,
    }),
  });
  if (res.status !== 202) {
    const detail = await res.json().catch(() => ({}));
    throw new Error(`Graph sendMail ${res.status}: ${detail?.error?.code || ''} ${detail?.error?.message || ''}`.trim());
  }
}

// Never throws: a failed email must not undo the action that triggered it (the alumnus can ask for it again).
export async function sendMail({ to, subject, text }) {
  if (!env.isProduction) logger.info(`[mail] To: ${to} | ${subject}\n${text}`);

  if (!env.mail.enabled) {
    if (env.isProduction) logger.warn(`[mail] MAIL_FROM is not set; "${subject}" to ${to} was not sent.`);
    return { delivered: false };
  }

  try {
    await sendWithGraph({ to, subject, text });
    logger.info(`[mail] Sent "${subject}" to ${to} via Microsoft 365`);
    return { delivered: true };
  } catch (err) {
    logger.error(`[mail] Could not send "${subject}" to ${to}: ${err.message}`);
    return { delivered: false, error: err.message };
  }
}
