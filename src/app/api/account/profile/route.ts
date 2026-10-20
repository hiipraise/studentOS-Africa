import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb, Collections } from "@/lib/db";
import { z } from "zod";
import type { StudentUser } from "@/types";

const ProfileSchema = z.object({
  name: z.string().max(120).optional(),
  country: z.string().max(60).optional(),
  level: z.enum(["highschool", "undergraduate", "postgraduate", "phd", "professional"]).optional(),
  fields: z.array(z.string().max(60)).max(10).optional(),
});

export async function PATCH(req: NextRequest) {
  const session = await auth();
  const email = session?.user?.email?.toLowerCase();
  if (!email) return NextResponse.json({ success: false, error: "unauthorized" }, { status: 401 });
  const parsed = ProfileSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 400 });
  const db = await getDb();
  const now = new Date();
  await db.collection<StudentUser>(Collections.users).updateOne(
    { email },
    {
      $set: { ...parsed.data, updatedAt: now },
      $setOnInsert: { email, role: "student", createdAt: now, consentAt: now },
    },
    { upsert: true }
  );
  return NextResponse.json({ success: true });
}
