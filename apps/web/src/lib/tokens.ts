import { randomBytes } from "crypto";
import { eq, and, gt } from "drizzle-orm";
import { db } from "./db";
import { verificationTokens, passwordResetTokens } from "@/db";

const TOKEN_EXPIRY_HOURS = 24;

function generateToken(): string {
  return randomBytes(32).toString("hex");
}

function getExpiryDate(): Date {
  const expiry = new Date();
  expiry.setHours(expiry.getHours() + TOKEN_EXPIRY_HOURS);
  return expiry;
}

export async function createVerificationToken(email: string): Promise<string> {
  const token = generateToken();
  const expires = getExpiryDate();

  await db.insert(verificationTokens).values({
    identifier: email,
    token,
    expires,
  });

  return token;
}

export async function validateVerificationToken(
  token: string,
): Promise<{ identifier: string } | null> {
  const result = await db.query.verificationTokens.findFirst({
    where: and(eq(verificationTokens.token, token), gt(verificationTokens.expires, new Date())),
  });

  if (!result) return null;

  await db
    .delete(verificationTokens)
    .where(
      and(
        eq(verificationTokens.identifier, result.identifier),
        eq(verificationTokens.token, token),
      ),
    );

  return { identifier: result.identifier };
}

export async function createPasswordResetToken(userId: string): Promise<string> {
  const token = generateToken();
  const expires = getExpiryDate();

  await db.insert(passwordResetTokens).values({
    userId,
    token,
    expires,
  });

  return token;
}

export async function validatePasswordResetToken(
  token: string,
): Promise<{ userId: string } | null> {
  const result = await db.query.passwordResetTokens.findFirst({
    where: and(eq(passwordResetTokens.token, token), gt(passwordResetTokens.expires, new Date())),
  });

  if (!result) return null;

  await db.delete(passwordResetTokens).where(eq(passwordResetTokens.token, token));

  return { userId: result.userId };
}
