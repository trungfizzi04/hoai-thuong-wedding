"use client";

const MAX_DIMENSION = 1200;
const OUTPUT_QUALITY = 0.82;

/**
 * Compress & resize an image in the browser using Canvas before upload.
 * Keeps portrait/full-body photos crisp (max 1200px) while shrinking 6–12 MB camera photos to ~120–250 KB.
 */
export async function compressImageFile(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Vui lòng chọn tệp hình ảnh (JPG, PNG hoặc WebP).");
  }

  // If already small WebP/JPEG (< 300 KB), skip re-encoding to preserve exact bytes & SHA-256 hash.
  if (file.size <= 300 * 1024 && (file.type === "image/webp" || file.type === "image/jpeg")) {
    return file;
  }

  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const targetWidth = Math.max(1, Math.round(bitmap.width * scale));
    const targetHeight = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return file;
    }

    ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/webp", OUTPUT_QUALITY);
    });

    if (!blob) {
      return file;
    }

    const baseName = file.name.replace(/\.[^.]+$/, "") || "photo";
    return new File([blob], `${baseName}.webp`, { type: "image/webp" });
  } finally {
    bitmap.close();
  }
}
