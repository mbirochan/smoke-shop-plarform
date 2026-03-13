import { logger } from "./logger";
import { PLATFORM_NAME } from "./constants";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

async function sendEmail(options: EmailOptions): Promise<void> {
  // In development, log the email instead of sending
  // Replace with Resend or other provider in production
  logger.info("Email sent", {
    to: options.to,
    subject: options.subject,
  });

  if (process.env.NODE_ENV === "development") {
    logger.debug("Email content", { html: options.html });
  }
}

export async function sendVerificationEmail(email: string, token: string): Promise<void> {
  const url = `${process.env.NEXTAUTH_URL}/verify-email/${token}`;

  await sendEmail({
    to: email,
    subject: `Verify your ${PLATFORM_NAME} account`,
    html: `
      <h1>Verify your email</h1>
      <p>Click the link below to verify your ${PLATFORM_NAME} account:</p>
      <a href="${url}">Verify Email</a>
      <p>This link expires in 24 hours.</p>
      <p>If you did not create an account, you can ignore this email.</p>
    `,
  });
}

export async function sendPasswordResetEmail(email: string, token: string): Promise<void> {
  const url = `${process.env.NEXTAUTH_URL}/reset-password/${token}`;

  await sendEmail({
    to: email,
    subject: `Reset your ${PLATFORM_NAME} password`,
    html: `
      <h1>Reset your password</h1>
      <p>Click the link below to reset your password:</p>
      <a href="${url}">Reset Password</a>
      <p>This link expires in 24 hours.</p>
      <p>If you did not request a password reset, you can ignore this email.</p>
    `,
  });
}
