"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import { validateImageFile } from "@/lib/cloudinary";

export interface CloudinaryImage {
  public_id: string;
  secure_url: string;
}

interface UseImageUploadOptions {
  folder?: string;
  resourceType?: "image" | "video" | "raw" | "auto";
  onSuccess?: (image: CloudinaryImage) => void;
  onError?: (error: string) => void;
}

export function useImageUpload(options: UseImageUploadOptions = {}) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const uploadImage = useCallback(
    async (file: File): Promise<CloudinaryImage | null> => {
      // Validate file if it's an image
      if (options.resourceType === "image" || !options.resourceType) {
        const validation = validateImageFile(file);
        if (!validation.valid) {
          const errorMsg = validation.error || "Invalid file";
          toast.error(errorMsg);
          options.onError?.(errorMsg);
          return null;
        }
      }

      try {
        setIsUploading(true);
        setUploadProgress(0);

        const formData = new FormData();
        formData.append("file", file);
        if (options.folder) {
          formData.append("folder", options.folder);
        }
        if (options.resourceType) {
          formData.append("resource_type", options.resourceType);
        }

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Upload failed");
        }

        const data = await response.json();
        setUploadProgress(100);

        if (data.success && data.image) {
          toast.success("Image uploaded successfully");
          options.onSuccess?.(data.image);
          return data.image;
        }

        throw new Error("Upload response missing image data");
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to upload image";
        console.error("Image upload error:", error);
        toast.error(errorMessage);
        options.onError?.(errorMessage);
        return null;
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
      }
    },
    [options]
  );

  return {
    uploadImage,
    isUploading,
    uploadProgress,
  };
}

