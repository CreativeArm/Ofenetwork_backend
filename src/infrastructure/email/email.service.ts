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

interface PasswordResetEmailInput {
  to: string;
  name: string;
  resetLink: string;
  expiresInMinutes: number;
}

interface SupportRequestEmailInput {
  ticketId: string;
  name: string;
  email: string;
  topic: string;
  message: string;
  createdAt: Date;
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
    return this.getSmtpConfig() !== null;
  }

  async sendPasswordResetEmail(input: PasswordResetEmailInput) {
    const config = this.getSmtpConfig();

    if (!config) {
      this.logger.warn(
        "Password reset email was skipped because SMTP is not configured.",
      );
      return false;
    }

    try {
      await this.getTransporter(config).sendMail({
        from: config.from,
        to: input.to,
        replyTo: config.replyTo,
        subject: "Reset your OFENetworks password",
        text: this.buildPasswordResetText(input),
        html: this.buildPasswordResetHtml(input),
      });

      return true;
    } catch (error) {
      this.logger.error(
        `Password reset email failed for ${input.to}: ${this.formatError(error)}`,
      );
      return false;
    }
  }

  async sendSupportRequestEmail(input: SupportRequestEmailInput) {
    const config = this.getSmtpConfig();

    if (!config) {
      this.logger.warn(
        "Support request email was skipped because SMTP is not configured.",
      );
      return false;
    }

    const to = config.supportInbox ?? config.replyTo ?? config.from;

    try {
      await this.getTransporter(config).sendMail({
        from: config.from,
        to,
        replyTo: input.email,
        subject: `New support request: ${input.topic}`,
        text: this.buildSupportRequestText(input),
        html: this.buildSupportRequestHtml(input),
      });

      return true;
    } catch (error) {
      this.logger.error(
        `Support request email failed for ${input.ticketId}: ${this.formatError(error)}`,
      );
      return false;
    }
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
        getEnv(["MAIL_FROM", "SMTP_FROM", "EMAIL_FROM"]) ??
        (user ? `OFENetworks <${user}>` : "OFENetworks <no-reply@ofenetwork.ng>"),
      replyTo: getEnv(["MAIL_REPLY_TO", "SMTP_REPLY_TO", "EMAIL_REPLY_TO"]),
      supportInbox: getEnv(["SUPPORT_EMAIL_TO", "SUPPORT_EMAIL", "MAIL_SUPPORT_TO"]),
    };

    return this.cachedConfig;
  }

  private buildPasswordResetText(input: PasswordResetEmailInput) {
    return [
      `Hello ${input.name || "there"},`,
      "",
      "We received a request to reset your OFENetworks password.",
      `Use this secure link within ${input.expiresInMinutes} minutes:`,
      input.resetLink,
      "",
      "If you did not request this, you can ignore this email.",
      "",
      "OFENetworks.ng",
    ].join("\n");
  }

  private buildPasswordResetHtml(input: PasswordResetEmailInput) {
    const name = this.escapeHtml(input.name || "there");
    const resetLink = this.escapeHtml(input.resetLink);

    return `
      <div style="margin:0;background:#f4f8f5;padding:32px 16px;font-family:Arial,sans-serif;color:#0f172a;">
        <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #dfe9e3;border-radius:24px;padding:32px;">
          <p style="margin:0 0 12px;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:#078b46;font-weight:700;">Password reset</p>
          <h1 style="margin:0 0 14px;font-size:26px;line-height:1.2;color:#07111f;">Reset your OFENetworks password</h1>
          <p style="margin:0 0 18px;font-size:15px;line-height:1.7;color:#475569;">Hello ${name}, we received a request to reset your password. This link will expire in ${input.expiresInMinutes} minutes.</p>
          <a href="${resetLink}" style="display:inline-block;background:#0f8a3b;color:#ffffff;text-decoration:none;border-radius:14px;padding:13px 20px;font-size:14px;font-weight:700;">Reset password</a>
          <p style="margin:22px 0 0;font-size:13px;line-height:1.6;color:#64748b;">If the button does not work, copy and paste this link into your browser:</p>
          <p style="margin:8px 0 0;font-size:13px;line-height:1.6;word-break:break-all;color:#0f766e;">${resetLink}</p>
          <p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:#64748b;">If you did not request this, you can safely ignore this email.</p>
        </div>
      </div>
    `;
  }

  private buildSupportRequestText(input: SupportRequestEmailInput) {
    return [
      `New support request: ${input.topic}`,
      "",
      `Ticket: ${input.ticketId}`,
      `Name: ${input.name}`,
      `Email: ${input.email}`,
      `Submitted: ${input.createdAt.toISOString()}`,
      "",
      input.message,
    ].join("\n");
  }

  private buildSupportRequestHtml(input: SupportRequestEmailInput) {
    const topic = this.escapeHtml(input.topic);
    const ticketId = this.escapeHtml(input.ticketId);
    const name = this.escapeHtml(input.name);
    const email = this.escapeHtml(input.email);
    const message = this.escapeHtml(input.message).replace(/\n/g, "<br />");

    return `
      <div style="margin:0;background:#f4f8f5;padding:32px 16px;font-family:Arial,sans-serif;color:#0f172a;">
        <div style="max-width:620px;margin:0 auto;background:#ffffff;border:1px solid #dfe9e3;border-radius:24px;padding:32px;">
          <p style="margin:0 0 12px;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:#078b46;font-weight:700;">Support request</p>
          <h1 style="margin:0 0 16px;font-size:24px;line-height:1.25;color:#07111f;">${topic}</h1>
          <p style="margin:0 0 8px;font-size:14px;color:#475569;"><strong>Ticket:</strong> ${ticketId}</p>
          <p style="margin:0 0 8px;font-size:14px;color:#475569;"><strong>Name:</strong> ${name}</p>
          <p style="margin:0 0 18px;font-size:14px;color:#475569;"><strong>Email:</strong> ${email}</p>
          <div style="background:#f8fbf8;border:1px solid #e7eee9;border-radius:18px;padding:18px;font-size:14px;line-height:1.7;color:#334155;">${message}</div>
        </div>
      </div>
    `;
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
