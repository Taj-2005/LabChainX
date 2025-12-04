/**
 * Client-side Cloudinary Utilities
 * For direct uploads from the browser using upload preset
 */

export interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  width?: number;
  height?: number;
  format?: string;
  bytes?: number;
}

/**
 * Upload image directly from client to Cloudinary
 * Uses upload preset for unsigned uploads
 */
export async function uploadToCloudinaryClient(
  file: File,
  folder?: string,
  options?: {
    transformation?: string;
  }
): Promise<CloudinaryUploadResult> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName) {
    throw new Error("NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME is not configured");
  }

  if (!uploadPreset) {
    throw new Error("NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET is not configured");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);
  
  if (folder) {
    formData.append("folder", folder);
  }

  if (options?.transformation) {
    formData.append("transformation", options.transformation);
  }

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Upload failed");
    }

    const result = await response.json();

    return {
      public_id: result.public_id,
      secure_url: result.secure_url,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes,
    };
  } catch (error) {
    console.error("Cloudinary client upload error:", error);
    throw error;
  }
}

/**
 * Get Cloudinary image URL with transformations
 */
export function getCloudinaryImageUrl(
  publicId: string,
  transformations?: string
): string {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  if (!cloudName) {
    throw new Error("NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME is not configured");
  }

  const baseUrl = `https://res.cloudinary.com/${cloudName}/image/upload`;
  const transform = transformations ? `${transformations}/` : "";
  return `${baseUrl}/${transform}${publicId}`;
}

