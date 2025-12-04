import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { uploadToCloudinary, validateImageFile } from "@/lib/cloudinary";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const folder = formData.get("folder") as string | null;
    const resourceType = (formData.get("resource_type") as string) || "image";

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file if it's an image
    if (resourceType === "image") {
      const validation = validateImageFile(file);
      if (!validation.valid) {
        return NextResponse.json(
          { error: validation.error },
          { status: 400 }
        );
      }
    }

    // Upload to Cloudinary
    try {
      const result = await uploadToCloudinary(file, folder || undefined, {
        resource_type: resourceType as "image" | "video" | "raw" | "auto",
      });

      return NextResponse.json({
        success: true,
        image: {
          public_id: result.public_id,
          secure_url: result.secure_url,
        },
      });
    } catch (error) {
      console.error("Cloudinary upload error:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to upload file";
      return NextResponse.json(
        { error: `Upload failed: ${errorMessage}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in upload route:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to process upload";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

