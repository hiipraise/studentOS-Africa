import { v2 as cloudinary } from "cloudinary";
import { getEnv } from "@/lib/env";
function configureCloudinary() {
  const env = getEnv();
  cloudinary.config({ cloud_name: env.CLOUDINARY_CLOUD_NAME, api_key: env.CLOUDINARY_API_KEY, api_secret: env.CLOUDINARY_API_SECRET, secure: true });
}

export interface UploadResult {
  url: string;
  publicId: string;
  width: number;
  height: number;
}

/**
 * Uploads a file buffer to Cloudinary via the upload_stream API.
 * Server-side only — never expose CLOUDINARY_API_SECRET to the client.
 */
export function uploadToCloudinary(
  buffer: Buffer,
  folder = "studentos"
): Promise<UploadResult> {
  configureCloudinary();
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        // Reasonable cap so a stray huge upload doesn't balloon storage
        transformation: [{ width: 2000, height: 2000, crop: "limit" }],
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error("Cloudinary upload returned no result"));
          return;
        }
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          width: result.width,
          height: result.height,
        });
      }
    );
    stream.end(buffer);
  });
}

/** Deletes an image from Cloudinary by its public_id — used when admin replaces/removes an image */
export async function deleteFromCloudinary(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId);
}

export default cloudinary;
