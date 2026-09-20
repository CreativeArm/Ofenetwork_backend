const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ??
  "http://127.0.0.1:4000/api";

/**
 * Compresses an image Data URL using HTML5 Canvas to keep file sizes
 * small (< 500KB) for ultra-fast mobile upload over cellular/LTE.
 */
export async function compressImageDataUrl(
  dataUrl: string,
  maxWidth = 1920,
  maxHeight = 1920,
  quality = 0.82,
): Promise<string> {
  // If not an image (e.g. PDF), return original
  if (!dataUrl.startsWith("data:image/")) {
    return dataUrl;
  }

  // If already small (< 300KB), no need to compress
  if (dataUrl.length < 300 * 1024) {
    return dataUrl;
  }

  if (typeof window === "undefined" || typeof document === "undefined") {
    return dataUrl;
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(dataUrl);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const compressed = canvas.toDataURL("image/jpeg", quality);
        resolve(compressed);
      } catch {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

export async function uploadToCloudinary(
  fileOrDataUrl: string,
  folder: "proofs" | "kyc" | "avatars" | "general" = "general",
): Promise<string> {
  // If already a remote URL (e.g., https://...), don't re-upload
  if (
    fileOrDataUrl.startsWith("http://") ||
    fileOrDataUrl.startsWith("https://")
  ) {
    return fileOrDataUrl;
  }

  // Compress image if needed before sending to reduce upload payload
  const payloadData = await compressImageDataUrl(fileOrDataUrl);

  const response = await fetch(`${API_BASE_URL}/upload`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      data: payloadData,
      folder,
    }),
  });

  if (!response.ok) {
    let message = "Failed to upload image";
    try {
      const errorData = await response.json();
      message = errorData.message || message;
    } catch {
      // fallback
    }
    throw new Error(message);
  }

  const result = await response.json();
  return result.url;
}
