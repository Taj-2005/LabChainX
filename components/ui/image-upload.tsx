"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react";
import { useImageUpload, CloudinaryImage } from "@/hooks/use-image-upload";
import { LoadingSpinner } from "@/components/loading";

interface ImageUploadProps {
  onUploadComplete: (image: CloudinaryImage) => void;
  onRemove?: () => void;
  currentImage?: CloudinaryImage | null;
  folder?: string;
  label?: string;
  accept?: string;
  maxSize?: number; // in MB
  className?: string;
  variant?: "profile" | "attachment" | "default";
}

export function ImageUpload({
  onUploadComplete,
  onRemove,
  currentImage,
  folder,
  label = "Upload Image",
  accept = "image/*",
  maxSize = 10,
  className = "",
  variant = "default",
}: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(
    currentImage?.secure_url || null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { uploadImage, isUploading } = useImageUpload({
    folder,
    onSuccess: (image) => {
      setPreview(image.secure_url);
      onUploadComplete(image);
    },
  });

  const handleFileSelect = useCallback(
    async (file: File) => {
      if (maxSize && file.size > maxSize * 1024 * 1024) {
        alert(`File size must be less than ${maxSize}MB`);
        return;
      }

      // Show preview immediately
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Upload to Cloudinary
      await uploadImage(file);
    },
    [uploadImage, maxSize]
  );

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      handleFileSelect(file);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    onRemove?.();
  };

  if (variant === "profile") {
    return (
      <div className={className}>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
        <div className="flex items-center gap-4">
          <div className="relative">
            {preview ? (
              <div className="relative">
                <img
                  src={preview}
                  alt="Preview"
                  className="w-24 h-24 rounded-full object-cover border-2 border-gray-200"
                />
                {!isUploading && (
                  <button
                    onClick={handleRemove}
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            ) : (
              <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center border-2 border-gray-200">
                {isUploading ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <ImageIcon className="h-8 w-8 text-gray-400" />
                )}
              </div>
            )}
          </div>
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept={accept}
              onChange={handleFileInputChange}
              className="hidden"
              disabled={isUploading}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  {preview ? "Change Picture" : "Upload Picture"}
                </>
              )}
            </Button>
            <p className="text-xs text-gray-500 mt-1">Max {maxSize}MB, JPG/PNG</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          isDragging
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 hover:border-gray-400"
        } ${isUploading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
        onClick={() => !isUploading && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileInputChange}
          className="hidden"
          disabled={isUploading}
        />

        {isUploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <p className="text-sm text-gray-600">Uploading...</p>
          </div>
        ) : preview ? (
          <div className="space-y-2">
            <img
              src={preview}
              alt="Preview"
              className="max-h-48 mx-auto rounded-lg border border-gray-200"
            />
            <div className="flex items-center justify-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
              >
                Change Image
              </Button>
              {onRemove && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove();
                  }}
                >
                  <X className="h-4 w-4 mr-2" />
                  Remove
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <Upload className="h-12 w-12 mx-auto text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-700">
                Drag and drop an image, or click to select
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Max {maxSize}MB • JPG, PNG, GIF, WebP
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

