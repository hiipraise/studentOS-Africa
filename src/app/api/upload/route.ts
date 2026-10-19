import { NextRequest, NextResponse } from "next/server";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { requireAdminApi } from "@/lib/api-auth";
import type { ApiResponse } from "@/types";
import { enforceRateLimit } from "@/lib/rate-limit";
import sharp from "sharp";

const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

// ─── POST /api/upload ───────────────────────────────────────────────────────
// Accepts multipart/form-data with a `file` field.
// Protected: requires admin authentication.

export async function POST(req: NextRequest) {
  // Auth check
  const { errorResponse } = await requireAdminApi();
  if (errorResponse) return errorResponse;
  const limit = await enforceRateLimit(req, "upload", 30, 60 * 60_000);
  if (!limit.allowed) return NextResponse.json<ApiResponse<never>>({ success: false, error: "rate_limited" }, { status: 429, headers: { "Retry-After": String(limit.retryAfter) } });

  try {
    const formData = await req.formData();
    const file = formData.get("file");
    const folder = (formData.get("folder") as string) || "opportunities";
    const folders = ["opportunities", "benefits", "tools", "guides"];
    if (!folders.includes(folder)) return NextResponse.json({ success: false, error: "invalid_folder" }, { status: 400 });

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
    const input = Buffer.from(arrayBuffer);
    const metadata = await sharp(input, { limitInputPixels: 40_000_000 }).metadata();
    const formats: Record<string, string> = { jpeg: "image/jpeg", png: "image/png", webp: "image/webp", gif: "image/gif" };
    if (!metadata.width || !metadata.height || metadata.width > 8000 || metadata.height > 8000 || formats[metadata.format ?? ""] !== file.type) {
      return NextResponse.json({ success: false, error: "invalid_image" }, { status: 400 });
    }
    // Re-encode strips EXIF and other source metadata.
    const buffer = await sharp(input, { limitInputPixels: 40_000_000 }).rotate().webp({ quality: 85 }).toBuffer();

    const result = await uploadToCloudinary(buffer, folder);

    return NextResponse.json<ApiResponse<{url: string; publicId: string}>>(
      { success: true, data: { url: result.url, publicId: result.publicId } },
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
