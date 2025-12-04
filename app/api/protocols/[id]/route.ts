import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Protocol from "@/models/Protocol";
import mongoose from "mongoose";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid protocol ID" },
        { status: 400 }
      );
    }

    await connectDB();

    const protocol = await Protocol.findById(id);

    if (!protocol) {
      return NextResponse.json(
        { error: "Protocol not found" },
        { status: 404 }
      );
    }

    // Check if user has access (only author for now)
    if (protocol.authorId !== session.user.id) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      protocol: {
        id: protocol._id.toString(),
        title: protocol.title,
        description: protocol.description,
        steps: protocol.steps,
        authorId: protocol.authorId,
        version: protocol.version,
        currentVersion: protocol.currentVersion,
        versions: protocol.versions,
        status: protocol.status,
        createdAt: protocol.createdAt,
        updatedAt: protocol.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error fetching protocol:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch protocol";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid protocol ID" },
        { status: 400 }
      );
    }

    const { title, description, steps, status, createVersion } = await req.json();

    await connectDB();

    const protocol = await Protocol.findById(id);

    if (!protocol) {
      return NextResponse.json(
        { error: "Protocol not found" },
        { status: 404 }
      );
    }

    // Check if user has access
    if (protocol.authorId !== session.user.id) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    // Update fields
    if (title !== undefined) protocol.title = title;
    if (description !== undefined) protocol.description = description;
    if (steps !== undefined) protocol.steps = steps;
    if (status !== undefined) protocol.status = status;

    // Create version snapshot if requested
    if (createVersion) {
      const newVersion = {
        title: protocol.title,
        description: protocol.description,
        steps: protocol.steps,
        savedAt: new Date(),
        savedBy: session.user.id,
        versionNumber: protocol.currentVersion + 1,
      };

      protocol.versions.push(newVersion);
      protocol.currentVersion = newVersion.versionNumber;
      protocol.version = newVersion.versionNumber;

      // Keep only last 50 versions
      if (protocol.versions.length > 50) {
        protocol.versions.shift();
      }
    } else {
      // Increment version for tracking
      protocol.version += 1;
    }

    await protocol.save();

    return NextResponse.json({
      protocol: {
        id: protocol._id.toString(),
        title: protocol.title,
        description: protocol.description,
        steps: protocol.steps,
        authorId: protocol.authorId,
        version: protocol.version,
        currentVersion: protocol.currentVersion,
        status: protocol.status,
        createdAt: protocol.createdAt,
        updatedAt: protocol.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error updating protocol:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to update protocol";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

