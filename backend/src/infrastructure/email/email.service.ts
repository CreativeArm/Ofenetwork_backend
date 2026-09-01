import { Injectable, Logger } from "@nestjs/common";
import * as nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  auth?: {
    user: string;
    pass: string;
  };
  from: string;
  replyTo?: string;
  supportInbox?: string;
}

export interface PasswordResetEmailInput {
  to: string;
  name: string;
  resetLink: string;
  expiresInMinutes: number;
}

export interface WelcomeEmailInput {
  to: string;
  name: string;
}

export interface KycApprovedEmailInput {
  to: string;
  name: string;
}

export interface KycRejectedEmailInput {
  to: string;
  name: string;
  reason?: string;
}

export interface AdminNewKycAlertInput {
  userFullName: string;
  userEmail: string;
  documentType?: string;
  userId: string;
}

export interface TransactionStatusEmailInput {
  to: string;
  name: string;
  transactionId: string;
  service: string;
  type: string;
  amount: string;
  status: "CONFIRMED" | "REJECTED";
  note?: string;
}

export interface AdminNewTransactionAlertInput {
  userFullName: string;
  userEmail: string;
  service: string;
  type: string;
  amount: string;
  transactionId: string;
}

export interface SupportRequestEmailInput {
  ticketId: string;
  name: string;
  email: string;
  topic: string;
  message: string;
  createdAt: Date;
}

interface SendMailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

function getEnv(keys: string[]) {
  for (const key of keys) {
    const value = process.env[key]?.trim();
    if (value) {
      return value;
    }
  }

  return undefined;
}

function parseBoolean(value: string | undefined, fallback: boolean) {
  if (!value) {
    return fallback;
  }

  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter?: Transporter;
  private cachedConfig?: SmtpConfig | null;

  isConfigured() {
    const hasResend = Boolean(getEnv(["RESEND_API_KEY", "RESEND_KEY"]));
    return hasResend || this.getSmtpConfig() !== null;
  }

  assertConfigured() {
    if (!this.isConfigured()) {
      this.logger.warn(
        "Neither RESEND_API_KEY nor SMTP_HOST is configured. Email notifications will be skipped.",
      );
    }
  }

  /**
   * Primary dispatcher: Sends email via Resend HTTPS REST API if RESEND_API_KEY exists,
   * or falls back to SMTP if SMTP_HOST is configured.
   */
  async sendMail(options: SendMailOptions): Promise<boolean> {
    const resendApiKey = getEnv(["RESEND_API_KEY", "RESEND_KEY"]);
    const from =
      getEnv(["MAIL_FROM", "SMTP_FROM", "EMAIL_FROM", "RESEND_FROM"]) ??
      "OFENetworks <no-reply@ofenetwork.ng>";

    const recipients = Array.isArray(options.to) ? options.to : [options.to];

    // 1. Try Resend REST API (Runs over HTTPS port 443 - never blocked by cloud firewalls)
    if (resendApiKey) {
      try {
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from,
            to: recipients,
            reply_to: options.replyTo,
            subject: options.subject,
            html: options.html,
            text: options.text,
          }),
        });

        if (!response.ok) {
          const errorData = await response.text();
          this.logger.error(`Resend API delivery failed (${response.status}): ${errorData}`);
        } else {
          const data = (await response.json()) as { id?: string };
          this.logger.log(
            `Email delivered via Resend API to ${recipients.join(", ")} (ID: ${data.id ?? "ok"})`,
          );
          return true;
        }
      } catch (err) {
        this.logger.error(`Resend API request error: ${this.formatError(err)}`);
      }
    }

    // 2. Try SMTP fallback (e.g. smtp.resend.com, Gmail, Brevo, or cPanel)
    const config = this.getSmtpConfig();
    if (config) {
      try {
        await this.getTransporter(config).sendMail({
          from: config.from,
          to: options.to,
          replyTo: options.replyTo ?? config.replyTo,
          subject: options.subject,
          text: options.text,
          html: options.html,
        });
        this.logger.log(`Email delivered via SMTP to ${recipients.join(", ")}`);
        return true;
      } catch (error) {
        this.logger.error(
          `SMTP email delivery failed for ${recipients.join(", ")}: ${this.formatError(error)}`,
        );
        return false;
      }
    }

    this.logger.warn(
      `Email skipped (neither RESEND_API_KEY nor SMTP_HOST configured) for: ${options.subject}`,
    );
    return false;
  }

  // =========================================================================
  // 1. Welcome Email (New Account Opened)
  // =========================================================================
  async sendWelcomeEmail(input: WelcomeEmailInput) {
    const name = input.name?.trim() || "there";
    const subject = "Welcome to OFENetworks! Your Account is Ready";
    const html = this.wrapEmailTemplate({
      eyebrow: "Welcome to OFENetworks",
      headline: `Glad to have you with us, ${this.escapeHtml(name)}!`,
      body: `
        <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#334155;">
          Your OFENetworks account has been successfully created. You now have access to fast, secure, and reliable digital exchange services in Nigeria.
        </p>
        <div style="background:#f8fbf8;border:1px solid #e7eee9;border-radius:18px;padding:20px;margin:20px 0;">
          <h4 style="margin:0 0 12px;font-size:14px;color:#07111f;text-transform:uppercase;letter-spacing:0.08em;">What you can do on OFENetworks:</h4>
          <ul style="margin:0;padding-left:20px;color:#475569;font-size:14px;line-height:1.8;">
            <li><strong>Deriv Deposits & Withdrawals:</strong> Instant funding and cashouts with competitive rates.</li>
            <li><strong>Crypto Exchange:</strong> Buy and sell USDT, Bitcoin, and popular cryptocurrencies.</li>
            <li><strong>E-Wallets:</strong> Fund or withdraw from Skrill, Neteller, and PayPal seamlessly.</li>
            <li><strong>Buy 4 Me Service:</strong> Shop from international stores (Amazon, eBay, etc.) and we handle procurement.</li>
          </ul>
        </div>
        <p style="margin:0 0 18px;font-size:14px;line-height:1.6;color:#64748b;">
          To unlock higher transaction limits and instant processing, verify your identity (KYC) from your dashboard.
        </p>
      `,
      ctaText: "Go to Dashboard",
      ctaUrl: "https://ofenetwork.ng/dashboard",
    });

    const text = [
      `Hello ${name},`,
      "",
      "Welcome to OFENetworks! Your account has been created successfully.",
      "You now have access to Deriv, Crypto, E-Wallets, and Buy4Me shopping.",
      "",
      "Go to your dashboard to get started:",
      "https://ofenetwork.ng/dashboard",
      "",
      "— The OFENetworks Team",
    ].join("\n");

    return this.sendMail({
      to: input.to,
      subject,
      html,
      text,
    });
  }

  // =========================================================================
  // 2. Forgot Password / Password Reset Email
  // =========================================================================
  async sendPasswordResetEmail(input: PasswordResetEmailInput) {
    const name = input.name || "there";
    const subject = "Reset your OFENetworks password";
    const html = this.wrapEmailTemplate({
      eyebrow: "Security Alert",
      headline: "Reset Your Password",
      body: `
        <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#334155;">
          Hello ${this.escapeHtml(name)}, we received a request to reset your OFENetworks account password.
        </p>
        <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#64748b;">
          This secure password reset link will expire in <strong>${input.expiresInMinutes} minutes</strong>. If you did not make this request, you can safely disregard this email.
        </p>
      `,
      ctaText: "Reset Password",
      ctaUrl: input.resetLink,
      secondaryNotice: `If the button does not work, copy and paste this link into your browser:<br/><span style="color:#0f7b36;word-break:break-all;">${input.resetLink}</span>`,
    });

    const text = [
      `Hello ${name},`,
      "",
      "We received a request to reset your OFENetworks password.",
      `Use this secure link within ${input.expiresInMinutes} minutes:`,
      input.resetLink,
      "",
      "If you did not request this, you can ignore this email.",
      "",
      "OFENetworks.ng",
    ].join("\n");

    return this.sendMail({
      to: input.to,
      subject,
      html,
      text,
    });
  }

  // =========================================================================
  // 3. KYC Approved Celebration Email
  // =========================================================================
  async sendKycApprovedEmail(input: KycApprovedEmailInput) {
    const name = input.name?.trim() || "there";
    const subject = "Congratulations! Your KYC Verification is Approved ✓";
    const html = this.wrapEmailTemplate({
      eyebrow: "Account Verified",
      eyebrowColor: "#0f7b36",
      headline: "Your Identity has been Verified!",
      body: `
        <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#334155;">
          Hello ${this.escapeHtml(name)},
        </p>
        <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#334155;">
          Great news! Our compliance team has reviewed and <strong>approved</strong> your identity verification documents.
        </p>
        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:18px;padding:20px;margin:20px 0;text-align:center;">
          <span style="display:inline-block;background:#0f7b36;color:#ffffff;border-radius:50%;width:36px;height:36px;line-height:36px;font-size:18px;font-weight:bold;margin-bottom:8px;">✓</span>
          <h3 style="margin:4px 0;color:#0f7b36;font-size:18px;">Verified Account Status Active</h3>
          <p style="margin:0;font-size:13px;color:#166534;">You now enjoy higher transaction limits and priority processing.</p>
        </div>
        <p style="margin:0 0 18px;font-size:14px;line-height:1.6;color:#475569;">
          You can now initiate deposits, withdrawals, and international purchases with zero restrictions.
        </p>
      `,
      ctaText: "Start a Transaction",
      ctaUrl: "https://ofenetwork.ng/dashboard",
    });

    const text = [
      `Hello ${name},`,
      "",
      "Great news! Your KYC identity verification documents have been approved.",
      "Your account now has full verified status with higher transaction limits.",
      "",
      "Visit your dashboard: https://ofenetwork.ng/dashboard",
      "",
      "— The OFENetworks Team",
    ].join("\n");

    return this.sendMail({
      to: input.to,
      subject,
      html,
      text,
    });
  }

  // =========================================================================
  // 4. KYC Rejected Notice Email
  // =========================================================================
  async sendKycRejectedEmail(input: KycRejectedEmailInput) {
    const name = input.name?.trim() || "there";
    const subject = "Action Required: Update on your KYC Verification";
    const html = this.wrapEmailTemplate({
      eyebrow: "Verification Update",
      eyebrowColor: "#b45309",
      headline: "KYC Document Update Required",
      body: `
        <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#334155;">
          Hello ${this.escapeHtml(name)},
        </p>
        <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#334155;">
          Our compliance team reviewed your submitted identification documents, but we were unable to complete verification at this time.
        </p>
        ${
          input.reason
            ? `<div style="background:#fffbeb;border:1px solid #fde68a;border-radius:16px;padding:16px;margin:20px 0;">
                <p style="margin:0 0 6px;font-size:12px;font-weight:bold;text-transform:uppercase;color:#92400e;">Reason from Compliance Officer:</p>
                <p style="margin:0;font-size:14px;color:#78350f;">${this.escapeHtml(input.reason)}</p>
              </div>`
            : ""
        }
        <p style="margin:0 0 18px;font-size:14px;line-height:1.6;color:#64748b;">
          Please log in to your account and upload a clear, uncropped photo or scan of your valid government-issued ID.
        </p>
      `,
      ctaText: "Resubmit KYC Documents",
      ctaUrl: "https://ofenetwork.ng/dashboard",
    });

    const text = [
      `Hello ${name},`,
      "",
      "Our compliance team was unable to verify your identification documents.",
      input.reason ? `Reason: ${input.reason}` : "",
      "",
      "Please log in and upload a clear government ID: https://ofenetwork.ng/dashboard",
      "",
      "— The OFENetworks Team",
    ].join("\n");

    return this.sendMail({
      to: input.to,
      subject,
      html,
      text,
    });
  }

  // =========================================================================
  // 5. Admin Alert: New KYC Submission
  // =========================================================================
  async sendAdminNewKycAlert(input: AdminNewKycAlertInput) {
    const adminEmail =
      getEnv(["ADMIN_NOTIFICATION_EMAIL", "SUPPORT_EMAIL_TO"]) ??
      this.getSmtpConfig()?.supportInbox;
    if (!adminEmail) return false;

    const subject = `[Admin Alert] New KYC Submitted by ${input.userFullName}`;
    const html = this.wrapEmailTemplate({
      eyebrow: "Admin Verification Queue",
      headline: "New KYC Identity Submission",
      body: `
        <div style="background:#f8fbf8;border:1px solid #e7eee9;border-radius:18px;padding:20px;margin-bottom:20px;">
          <p style="margin:0 0 8px;font-size:14px;color:#334155;"><strong>Customer:</strong> ${this.escapeHtml(input.userFullName)}</p>
          <p style="margin:0 0 8px;font-size:14px;color:#334155;"><strong>Email:</strong> ${this.escapeHtml(input.userEmail)}</p>
          <p style="margin:0 0 8px;font-size:14px;color:#334155;"><strong>Document Type:</strong> ${this.escapeHtml(input.documentType || "Government ID")}</p>
          <p style="margin:0;font-size:14px;color:#334155;"><strong>User ID:</strong> <code style="font-family:monospace;">${this.escapeHtml(input.userId)}</code></p>
        </div>
        <p style="margin:0 0 18px;font-size:14px;color:#64748b;">
          Please review the identity document in the admin queue to approve or reject the submission.
        </p>
      `,
      ctaText: "Review in KYC Queue",
      ctaUrl: "https://ofenetwork.ng/admin/kyc",
    });

    return this.sendMail({
      to: adminEmail,
      subject,
      html,
    });
  }

  // =========================================================================
  // 6. User Transaction Status (Approved / Rejected)
  // =========================================================================
  async sendTransactionStatusEmail(input: TransactionStatusEmailInput) {
    const isApproved = input.status === "CONFIRMED";
    const subject = isApproved
      ? `Transaction Approved: ${input.service} ${input.type} (${input.amount})`
      : `Update on your ${input.service} ${input.type} (${input.amount})`;

    const html = this.wrapEmailTemplate({
      eyebrow: isApproved ? "Transaction Successful" : "Transaction Declined",
      eyebrowColor: isApproved ? "#0f7b36" : "#b91c1c",
      headline: isApproved ? "Your Transaction has been Processed!" : "Transaction Declined",
      body: `
        <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#334155;">
          Hello ${this.escapeHtml(input.name)},
        </p>
        <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#334155;">
          Your <strong>${this.escapeHtml(input.service)} ${this.escapeHtml(input.type)}</strong> has been 
          <strong>${isApproved ? "confirmed and processed" : "declined"}</strong>.
        </p>
        <div style="background:#f8fbf8;border:1px solid #e7eee9;border-radius:18px;padding:20px;margin:20px 0;">
          <p style="margin:0 0 8px;font-size:14px;color:#334155;"><strong>Service:</strong> ${this.escapeHtml(input.service)}</p>
          <p style="margin:0 0 8px;font-size:14px;color:#334155;"><strong>Type:</strong> ${this.escapeHtml(input.type)}</p>
          <p style="margin:0 0 8px;font-size:14px;color:#334155;"><strong>Amount:</strong> ${this.escapeHtml(input.amount)}</p>
          <p style="margin:0;font-size:14px;color:#334155;"><strong>Transaction ID:</strong> <code style="font-family:monospace;">${this.escapeHtml(input.transactionId)}</code></p>
        </div>
        ${
          input.note
            ? `<div style="background:#fffbeb;border:1px solid #fde68a;border-radius:14px;padding:14px;margin-bottom:20px;">
                <p style="margin:0;font-size:13px;color:#92400e;"><strong>Admin Note:</strong> ${this.escapeHtml(input.note)}</p>
              </div>`
            : ""
        }
      `,
      ctaText: "View Transaction History",
      ctaUrl: "https://ofenetwork.ng/dashboard",
    });

    const text = [
      `Hello ${input.name},`,
      "",
      `Your ${input.service} ${input.type} of ${input.amount} has been ${isApproved ? "approved and processed" : "declined"}.`,
      `Transaction ID: ${input.transactionId}`,
      input.note ? `Note: ${input.note}` : "",
      "",
      "View on dashboard: https://ofenetwork.ng/dashboard",
    ].join("\n");

    return this.sendMail({
      to: input.to,
      subject,
      html,
      text,
    });
  }

  // =========================================================================
  // 7. Admin Alert: New Transaction Submitted
  // =========================================================================
  async sendAdminNewTransactionAlert(input: AdminNewTransactionAlertInput) {
    const adminEmail =
      getEnv(["ADMIN_NOTIFICATION_EMAIL", "SUPPORT_EMAIL_TO"]) ??
      this.getSmtpConfig()?.supportInbox;
    if (!adminEmail) return false;

    const subject = `[Admin Alert] New ${input.type}: ${input.amount} by ${input.userFullName}`;
    const html = this.wrapEmailTemplate({
      eyebrow: "Action Required",
      eyebrowColor: "#d97706",
      headline: `New ${input.type} Request`,
      body: `
        <div style="background:#f8fbf8;border:1px solid #e7eee9;border-radius:18px;padding:20px;margin-bottom:20px;">
          <p style="margin:0 0 8px;font-size:14px;color:#334155;"><strong>Customer:</strong> ${this.escapeHtml(input.userFullName)} (${this.escapeHtml(input.userEmail)})</p>
          <p style="margin:0 0 8px;font-size:14px;color:#334155;"><strong>Service:</strong> ${this.escapeHtml(input.service)}</p>
          <p style="margin:0 0 8px;font-size:14px;color:#334155;"><strong>Type:</strong> ${this.escapeHtml(input.type)}</p>
          <p style="margin:0 0 8px;font-size:14px;color:#334155;"><strong>Amount:</strong> ${this.escapeHtml(input.amount)}</p>
          <p style="margin:0;font-size:14px;color:#334155;"><strong>Transaction ID:</strong> <code style="font-family:monospace;">${this.escapeHtml(input.transactionId)}</code></p>
        </div>
      `,
      ctaText: "Open Review Queue",
      ctaUrl: "https://ofenetwork.ng/admin/transactions",
    });

    return this.sendMail({
      to: adminEmail,
      subject,
      html,
    });
  }

  // =========================================================================
  // 8. Support Request Email
  // =========================================================================
  async sendSupportRequestEmail(input: SupportRequestEmailInput) {
    const config = this.getSmtpConfig();
    const to =
      getEnv(["SUPPORT_EMAIL_TO", "ADMIN_NOTIFICATION_EMAIL"]) ??
      config?.supportInbox ??
      config?.from ??
      "support@ofenetwork.ng";

    const subject = `New support request: ${input.topic}`;
    const html = this.wrapEmailTemplate({
      eyebrow: "Support Ticket",
      headline: input.topic,
      body: `
        <div style="background:#f8fbf8;border:1px solid #e7eee9;border-radius:18px;padding:18px;margin-bottom:18px;">
          <p style="margin:0 0 8px;font-size:14px;color:#475569;"><strong>Ticket ID:</strong> ${this.escapeHtml(input.ticketId)}</p>
          <p style="margin:0 0 8px;font-size:14px;color:#475569;"><strong>Name:</strong> ${this.escapeHtml(input.name)}</p>
          <p style="margin:0 0 8px;font-size:14px;color:#475569;"><strong>Email:</strong> ${this.escapeHtml(input.email)}</p>
          <p style="margin:0;font-size:14px;color:#475569;"><strong>Submitted:</strong> ${input.createdAt.toISOString()}</p>
        </div>
        <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;padding:18px;font-size:14px;line-height:1.7;color:#1e293b;">
          ${this.escapeHtml(input.message).replace(/\n/g, "<br />")}
        </div>
      `,
      ctaText: "Open Support Queue",
      ctaUrl: "https://ofenetwork.ng/admin/support",
    });

    return this.sendMail({
      to,
      replyTo: input.email,
      subject,
      html,
      text: `${input.topic}\n\nFrom: ${input.name} (${input.email})\n\n${input.message}`,
    });
  }

  // =========================================================================
  // Master Branded HTML Wrapper
  // =========================================================================
  private wrapEmailTemplate(params: {
    eyebrow: string;
    eyebrowColor?: string;
    headline: string;
    body: string;
    ctaText?: string;
    ctaUrl?: string;
    secondaryNotice?: string;
  }) {
    const eyebrowColor = params.eyebrowColor ?? "#0f7b36";

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${this.escapeHtml(params.headline)}</title>
      </head>
      <body style="margin:0;padding:0;background:#f4f8f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;-webkit-font-smoothing:antialiased;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background:#f4f8f5;padding:32px 16px;">
          <tr>
            <td align="center">
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:580px;background:#ffffff;border:1px solid #dfe9e3;border-radius:24px;overflow:hidden;box-shadow:0 10px 30px rgba(15,23,42,0.03);">
                <!-- Header Banner -->
                <tr>
                  <td style="padding:28px 32px;border-bottom:1px solid #f0f4f1;background:#fafdfb;">
                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td>
                          <span style="font-size:20px;font-weight:800;color:#0f7b36;letter-spacing:-0.5px;">OFENetworks<span style="color:#0f172a;">.ng</span></span>
                        </td>
                        <td align="right">
                          <span style="font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:${eyebrowColor};background:#f0fdf4;padding:4px 10px;border-radius:20px;border:1px solid #dcfce7;">
                            ${this.escapeHtml(params.eyebrow)}
                          </span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Body Content -->
                <tr>
                  <td style="padding:32px;">
                    <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;color:#07111f;font-weight:700;">
                      ${this.escapeHtml(params.headline)}
                    </h1>
                    
                    ${params.body}

                    ${
                      params.ctaText && params.ctaUrl
                        ? `
                        <div style="margin:28px 0 12px;text-align:center;">
                          <a href="${params.ctaUrl}" style="display:inline-block;background:#0f7b36;color:#ffffff;text-decoration:none;border-radius:14px;padding:14px 28px;font-size:14px;font-weight:700;box-shadow:0 4px 14px rgba(15,123,54,0.25);">
                            ${this.escapeHtml(params.ctaText)}
                          </a>
                        </div>
                      `
                        : ""
                    }

                    ${
                      params.secondaryNotice
                        ? `<p style="margin:20px 0 0;font-size:12px;line-height:1.6;color:#94a3b8;text-align:center;">${params.secondaryNotice}</p>`
                        : ""
                    }
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding:24px 32px;background:#f8fbf8;border-top:1px solid #f0f4f1;text-align:center;">
                    <p style="margin:0 0 6px;font-size:12px;color:#64748b;">
                      © ${new Date().getFullYear()} OFENetworks. All rights reserved.
                    </p>
                    <p style="margin:0;font-size:11px;color:#94a3b8;">
                      Need assistance? Contact our 24/7 helpdesk at <a href="mailto:support@ofenetwork.ng" style="color:#0f7b36;text-decoration:none;">support@ofenetwork.ng</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  }

  private getTransporter(config: SmtpConfig) {
    if (!this.transporter) {
      this.transporter = nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.secure,
        auth: config.auth,
      });
    }

    return this.transporter;
  }

  private getSmtpConfig() {
    if (this.cachedConfig !== undefined) {
      return this.cachedConfig;
    }

    const host = getEnv(["SMTP_HOST", "MAIL_HOST", "EMAIL_HOST"]);
    const portValue = getEnv(["SMTP_PORT", "MAIL_PORT", "EMAIL_PORT"]);
    const user = getEnv(["SMTP_USER", "MAIL_USER", "EMAIL_USER"]);
    const pass = getEnv([
      "SMTP_PASS",
      "SMTP_PASSWORD",
      "MAIL_PASS",
      "MAIL_PASSWORD",
      "EMAIL_PASS",
      "EMAIL_PASSWORD",
    ]);

    if (!host) {
      this.cachedConfig = null;
      return this.cachedConfig;
    }

    const port = Number(portValue ?? "587");
    const secure = parseBoolean(
      getEnv(["SMTP_SECURE", "MAIL_SECURE", "EMAIL_SECURE"]),
      port === 465,
    );

    this.cachedConfig = {
      host,
      port: Number.isFinite(port) ? port : 587,
      secure,
      auth: user && pass ? { user, pass } : undefined,
      from:
        getEnv(["MAIL_FROM", "SMTP_FROM", "EMAIL_FROM", "RESEND_FROM"]) ??
        (user ? `OFENetworks <${user}>` : "OFENetworks <no-reply@ofenetwork.ng>"),
      replyTo: getEnv(["MAIL_REPLY_TO", "SMTP_REPLY_TO", "EMAIL_REPLY_TO"]),
      supportInbox: getEnv(["SUPPORT_EMAIL_TO", "SUPPORT_EMAIL", "MAIL_SUPPORT_TO"]),
    };

    return this.cachedConfig;
  }

  private escapeHtml(value: string) {
    return value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  private formatError(error: unknown) {
    if (error instanceof Error) {
      return error.message;
    }

    return String(error);
  }
}
