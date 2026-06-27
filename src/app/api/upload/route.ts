import { NextRequest, NextResponse } from "next/server";
import { uploadToCloudinary } from "@/lib/cloudinary";
import type { ApiResponse } from "@/types";

const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

// ─── POST /api/upload ───────────────────────────────────────────────────────
// Accepts multipart/form-data with a `file` field.
// TODO: once Auth.js admin login is wired up, gate this route to admins only —
// right now anyone with the endpoint URL could upload. Fine for local/dev,
// not fine for production.

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");
    const folder = (formData.get("folder") as string) || "studentos";

    if (!file || !(file instanceof File)) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: "No file provided" },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: "File must be JPEG, PNG, WebP, or GIF" },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: "File must be under 8MB" },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await uploadToCloudinary(buffer, folder);

    return NextResponse.json<ApiResponse<typeof result>>(
      { success: true, data: result },
      { status: 201 }
    );
  } catch (err) {
    console.error("[POST /api/upload]", err);
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: "Upload failed. Please try again." },
      { status: 500 }
    );
  }
}
