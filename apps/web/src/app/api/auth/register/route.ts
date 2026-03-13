import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/db";
import { registerSchema } from "@smoke-shop/validators";
import { createVerificationToken } from "@/lib/tokens";
import { sendVerificationEmail } from "@/lib/email";
import { checkRateLimit, registerRateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const { success } = await checkRateLimit(`register:${ip}`, registerRateLimit);
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body = await req.json();
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const { fullName, email, password, role } = parsed.data;
  const normalizedEmail = email.toLowerCase();

  const existing = await db.query.users.findFirst({
    where: eq(users.email, normalizedEmail),
  });

  if (existing) {
    // Generic error to prevent user enumeration
    return NextResponse.json({ error: "Registration failed" }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const [user] = await db
    .insert(users)
    .values({
      email: normalizedEmail,
      passwordHash,
      fullName,
      name: fullName,
      role,
    })
    .returning({ id: users.id });

  if (!user) {
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }

  const token = await createVerificationToken(normalizedEmail);
  await sendVerificationEmail(normalizedEmail, token);

  logger.info("User registered", { userId: user.id, role });

  return NextResponse.json({ success: true }, { status: 201 });
}
