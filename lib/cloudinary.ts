/**
 * Cloudinary Configuration and Utilities
 */

import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  width?: number;
  height?: number;
  format?: string;
  bytes?: number;
}

/**
 * Upload image to Cloudinary
 */
export async function uploadToCloudinary(
  file: File | Buffer,
  folder?: string,
  options?: {
    transformation?: unknown[];
    resource_type?: "image" | "video" | "raw" | "auto";
  }
): Promise<CloudinaryUploadResult> {
  return new Promise((resolve, reject) => {
    const uploadOptions: {
      folder?: string;
      resource_type?: string;
      transformation?: unknown[];
    } = {
      resource_type: options?.resource_type || "image",
    };

    if (folder) {
      uploadOptions.folder = folder;
    }

    if (options?.transformation) {
      uploadOptions.transformation = options.transformation;
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          reject(new Error(`Cloudinary upload failed: ${error.message}`));
          return;
        }

        if (!result) {
          reject(new Error("Cloudinary upload returned no result"));
          return;
        }

        resolve({
          public_id: result.public_id,
          secure_url: result.secure_url,
          width: result.width,
          height: result.height,
          format: result.format,
          bytes: result.bytes,
        });
      }
    );

    // Handle File or Buffer
    if (file instanceof File) {
      // Convert File to Buffer
      file.arrayBuffer().then((buffer) => {
        uploadStream.end(Buffer.from(buffer));
      }).catch(reject);
    } else {
      uploadStream.end(file);
    }
  });
}

/**
 * Delete image from Cloudinary
 */
export async function deleteFromCloudinary(publicId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(publicId, (error, result) => {
      if (error) {
        reject(new Error(`Cloudinary delete failed: ${error.message}`));
        return;
      }
      resolve();
    });
  });
}

/**
 * Validate image file
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  // Check file type
  const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
  if (!validTypes.includes(file.type)) {
    return {
      valid: false,
      error: "Invalid file type. Please upload a JPEG, PNG, GIF, or WebP image.",
    };
  }

  // Check file size (max 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return {
      valid: false,
      error: "File size must be less than 10MB.",
    };
  }

  return { valid: true };
}

export default cloudinary;

