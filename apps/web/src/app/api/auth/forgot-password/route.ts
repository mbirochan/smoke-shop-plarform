import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/db";
import { forgotPasswordSchema } from "@smoke-shop/validators";
import { createPasswordResetToken } from "@/lib/tokens";
import { sendPasswordResetEmail } from "@/lib/email";
import { checkRateLimit, forgotPasswordRateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = forgotPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { email } = parsed.data;
  const normalizedEmail = email.toLowerCase();

  const { success } = await checkRateLimit(
    `forgot-password:${normalizedEmail}`,
    forgotPasswordRateLimit,
  );
  if (!success) {
    // Still return success to prevent enumeration
    return NextResponse.json({ success: true });
  }

  const user = await db.query.users.findFirst({
    where: eq(users.email, normalizedEmail),
  });

  if (user) {
    const token = await createPasswordResetToken(user.id);
    await sendPasswordResetEmail(normalizedEmail, token);
    logger.info("Password reset requested", { userId: user.id });
  }

  // Always return success to prevent user enumeration
  return NextResponse.json({ success: true });
}
