import nodemailer from "nodemailer";

const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_PASS = process.env.GMAIL_APP_PASSWORD;
const APP_NAME   = "ESO Auditing System";

// Reuse the same transporter for the lifetime of the process
const transporter = (GMAIL_USER && GMAIL_PASS)
    ? nodemailer.createTransport({ service: "gmail", auth: { user: GMAIL_USER, pass: GMAIL_PASS } })
    : null;

async function send(to: string, subject: string, html: string): Promise<void> {
    if (!transporter) {
        // Dev fallback: print to console so the system still works without email configured
        console.log(`[email] To: ${to} | Subject: ${subject}`);
        return;
    }
    await transporter.sendMail({
        from: `"${APP_NAME}" <${GMAIL_USER}>`,
        to,
        subject,
        html,
    });
}

function baseTemplate(title: string, body: string): string {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
    <body style="margin:0;padding:0;background:#111;font-family:Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#111;padding:32px 0;">
        <tr><td align="center">
          <table width="520" cellpadding="0" cellspacing="0" style="background:#1a1a1a;border-radius:12px;overflow:hidden;max-width:520px;width:100%;">
            <tr>
              <td style="background:linear-gradient(90deg,#f97316,#ea580c);padding:24px 32px;">
                <p style="margin:0;color:#fff;font-size:11px;letter-spacing:2px;text-transform:uppercase;opacity:.8;">
                  Marinduque State University &middot; College of Engineering
                </p>
                <h1 style="margin:6px 0 0;color:#fff;font-size:20px;font-weight:700;">
                  Engineering Student Organization
                </h1>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <h2 style="margin:0 0 16px;color:#f97316;font-size:18px;">${title}</h2>
                ${body}
              </td>
            </tr>
            <tr>
              <td style="padding:16px 32px;border-top:1px solid #2a2a2a;">
                <p style="margin:0;color:#555;font-size:11px;">
                  This email was sent by the ESO Auditing System. Do not reply to this email.
                </p>
              </td>
            </tr>
          </table>
        </td></tr>
      </table>
    </body>
    </html>`;
}

export async function sendVerificationEmail(to: string, token: string): Promise<void> {
    const appUrl = process.env.APP_URL || "http://localhost:5173";
    const link   = `${appUrl}/verify-email?token=${token}`;
    const body   = `
      <p style="color:#ccc;font-size:14px;line-height:1.6;margin:0 0 20px;">
        Welcome! Please verify your email address to activate your ESO account.
        Click the button below &mdash; the link expires in <strong style="color:#f97316;">24 hours</strong>.
      </p>
      <a href="${link}" style="display:inline-block;background:#f97316;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:700;font-size:14px;">
        Verify My Email
      </a>
      <p style="color:#555;font-size:12px;margin:20px 0 0;">
        If the button does not work, copy and paste this link into your browser:<br>
        <a href="${link}" style="color:#f97316;word-break:break-all;">${link}</a>
      </p>`;
    await send(to, "Verify your ESO account", baseTemplate("Verify Your Email", body));
}

export async function sendPasswordResetEmail(to: string, token: string): Promise<void> {
    const appUrl = process.env.APP_URL || "http://localhost:5173";
    const link   = `${appUrl}/reset-password?token=${token}`;
    const body   = `
      <p style="color:#ccc;font-size:14px;line-height:1.6;margin:0 0 20px;">
        We received a request to reset your ESO account password. Click the button below to set a new password.
        This link expires in <strong style="color:#f97316;">1 hour</strong>.
      </p>
      <a href="${link}" style="display:inline-block;background:#f97316;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:700;font-size:14px;">
        Reset My Password
      </a>
      <p style="color:#555;font-size:12px;margin:20px 0 0;">
        If you did not request this, you can safely ignore this email. Your password will not change.<br><br>
        If the button does not work, copy and paste this link into your browser:<br>
        <a href="${link}" style="color:#f97316;word-break:break-all;">${link}</a>
      </p>`;
    await send(to, "Reset your ESO password", baseTemplate("Password Reset Request", body));
}
