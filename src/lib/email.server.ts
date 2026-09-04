/**
 * Branded transactional email sending through the Resend connector gateway.
 * Server-only — never import this from a component.
 */

const GATEWAY_URL = "https://connector-gateway.lovable.dev/resend";

function fromAddress() {
  return process.env["RESEND_FROM_EMAIL"] || "Nirogi <onboarding@resend.dev>";
}

export function brandedEmail(opts: { heading: string; intro: string; bodyHtml?: string; ctaLabel?: string; ctaUrl?: string; footnote?: string }) {
  const { heading, intro, bodyHtml = "", ctaLabel, ctaUrl, footnote } = opts;
  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#f4f8f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f8f7;padding:32px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:20px;border:1px solid #e3ecea;overflow:hidden;">
        <tr><td style="background:linear-gradient(135deg,#0f766e,#10b981);padding:22px 28px;">
          <span style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.02em;">Nirogi</span>
          <span style="color:#d1fae5;font-size:13px;margin-left:8px;">AI health, free for everyone</span>
        </td></tr>
        <tr><td style="padding:28px;">
          <h1 style="margin:0 0 10px;font-size:20px;color:#0f172a;">${heading}</h1>
          <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#475569;">${intro}</p>
          ${bodyHtml}
          ${
            ctaLabel && ctaUrl
              ? `<p style="margin:24px 0;"><a href="${ctaUrl}" style="display:inline-block;background:#0f766e;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:13px 26px;border-radius:12px;">${ctaLabel}</a></p>
                 <p style="margin:0 0 8px;font-size:12px;color:#94a3b8;word-break:break-all;">Or paste this link into your browser:<br/>${ctaUrl}</p>`
              : ""
          }
          ${footnote ? `<p style="margin:20px 0 0;font-size:12px;color:#94a3b8;line-height:1.6;">${footnote}</p>` : ""}
        </td></tr>
        <tr><td style="padding:16px 28px;background:#f8fafc;border-top:1px solid #e3ecea;">
          <p style="margin:0;font-size:11px;color:#94a3b8;line-height:1.6;">Nirogi provides educational health information and is not a substitute for professional medical advice. In an emergency, contact your local emergency number.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

export async function sendEmail(input: { to: string; subject: string; html: string }) {
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const resendKey = process.env["RESEND_API_KEY"];
  if (!lovableKey || !resendKey) throw new Error("EMAIL_NOT_CONFIGURED");

  const res = await fetch(`${GATEWAY_URL}/emails`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": resendKey,
    },
    body: JSON.stringify({ from: fromAddress(), to: [input.to], subject: input.subject, html: input.html }),
  });
  if (!res.ok) {
    const body = await res.text();
    console.error(`Resend request failed [${res.status}]: ${body}`);
    throw new Error(`EMAIL_SEND_FAILED:${res.status}:${body}`);
  }
  return (await res.json().catch(() => ({}))) as { id?: string };
}
