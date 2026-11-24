import crypto from "crypto";
import { v2 as cloudinary } from "cloudinary";

export const MAX_STAFF_PHOTOS = 4;
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024; // 5 MB

let isConfigured = false;

function ensureCloudinaryConfigured() {
  if (isConfigured) return;

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      "Thiếu cấu hình CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET.",
    );
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });

  isConfigured = true;
}

export function isCloudinaryConfigured(): boolean {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME?.trim() &&
      process.env.CLOUDINARY_API_KEY?.trim() &&
      process.env.CLOUDINARY_API_SECRET?.trim(),
  );
}

export function computeBufferSha256(buffer: Buffer): string {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

/**
 * Upload staff personal photo as `authenticated` (private), normalized to max 1080x1440 WebP.
 * Cloudinary strips EXIF/GPS metadata automatically during incoming transformation.
 */
export async function uploadAuthenticatedStaffPhoto(
  fileBuffer: Buffer,
  staffUserId: string,
): Promise<{ publicId: string }> {
  ensureCloudinaryConfigured();

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "hoai-thuong-wedding/staff",
        public_id: `staff_${staffUserId}_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`,
        resource_type: "image",
        type: "authenticated",
        format: "webp",
        transformation: [
          {
            width: 1080,
            height: 1440,
            crop: "limit",
            quality: "auto:good",
          },
        ],
      },
      (error, result) => {
        if (error || !result?.public_id) {
          reject(error ?? new Error("Upload Cloudinary thất bại."));
          return;
        }
        resolve({ publicId: result.public_id });
      },
    );

    uploadStream.end(fileBuffer);
  });
}

/**
 * Permanently delete an authenticated staff photo from Cloudinary.
 */
export async function deleteAuthenticatedStaffPhoto(publicId: string): Promise<void> {
  if (!publicId || !isCloudinaryConfigured()) return;
  ensureCloudinaryConfigured();

  try {
    await cloudinary.uploader.destroy(publicId, {
      resource_type: "image",
      type: "authenticated",
      invalidate: true,
    });
  } catch (err) {
    console.error("[Cloudinary] Failed to delete photo:", publicId, err);
  }
}

/**
 * Build a server-side signed URL for fetching an authenticated Cloudinary asset.
 * - `thumb`: 360x480 face-centered crop (~15-30 KB) for grids & admin lists
 * - `full`: max 1080px sharp WebP (~80-180 KB) for Lightbox inspection
 */
export function buildSignedAuthenticatedPhotoUrl(
  publicId: string,
  size: "thumb" | "full" = "full",
): string {
  ensureCloudinaryConfigured();

  const transformation =
    size === "thumb"
      ? [
          {
            width: 360,
            height: 480,
            crop: "fill",
            gravity: "auto:face",
            fetch_format: "webp",
            quality: "auto:eco",
          },
        ]
      : [
          {
            width: 1080,
            crop: "limit",
            fetch_format: "webp",
            quality: "auto:good",
          },
        ];

  return cloudinary.url(publicId, {
    resource_type: "image",
    type: "authenticated",
    sign_url: true,
    secure: true,
    transformation,
  });
}
