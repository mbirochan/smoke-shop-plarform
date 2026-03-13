import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/db";
import { validateVerificationToken } from "@/lib/tokens";
import { logger } from "@/lib/logger";
import { z } from "zod";

const schema = z.object({
  token: z.string().min(1),
});

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const result = await validateVerificationToken(parsed.data.token);
  if (!result) {
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });
  }

  await db
    .update(users)
    .set({ emailVerified: new Date(), updatedAt: new Date() })
    .where(eq(users.email, result.identifier));

  logger.info("Email verified", { email: result.identifier });

  return NextResponse.json({ success: true });
}
