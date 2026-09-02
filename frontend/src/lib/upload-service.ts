const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ??
  "http://127.0.0.1:4000/api";

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

  const response = await fetch(`${API_BASE_URL}/upload`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      data: fileOrDataUrl,
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
