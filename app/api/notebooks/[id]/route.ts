import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Notebook from "@/models/Notebook";
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
        { error: "Invalid notebook ID" },
        { status: 400 }
      );
    }

    await connectDB();

    const notebook = await Notebook.findById(id);

    if (!notebook) {
      return NextResponse.json(
        { error: "Notebook not found" },
        { status: 404 }
      );
    }

    // Check if user has access
    const hasAccess =
      notebook.authorId === session.user.id ||
      notebook.collaborators?.includes(session.user.id);

    if (!hasAccess) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      notebook: {
        id: notebook._id.toString(),
        title: notebook.title,
        content: notebook.content,
        authorId: notebook.authorId,
        collaborators: notebook.collaborators,
        version: notebook.version,
        versions: notebook.versions,
        createdAt: notebook.createdAt,
        updatedAt: notebook.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error fetching notebook:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch notebook";
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
        { error: "Invalid notebook ID" },
        { status: 400 }
      );
    }

    const { title, content, autoSave } = await req.json();

    await connectDB();

    const notebook = await Notebook.findById(id);

    if (!notebook) {
      return NextResponse.json(
        { error: "Notebook not found" },
        { status: 404 }
      );
    }

    // Check if user has access
    const hasAccess =
      notebook.authorId === session.user.id ||
      notebook.collaborators?.includes(session.user.id);

    if (!hasAccess) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    // Update content
    if (content !== undefined) {
      notebook.content = content;
    }

    // Update title
    if (title !== undefined) {
      notebook.title = title;
    }

    // If auto-save (every 3 seconds), create version history entry
    if (autoSave && content !== undefined) {
      const newVersion = {
        content: notebook.content,
        savedAt: new Date(),
        savedBy: session.user.id,
      };

      // Keep only last 50 versions
      notebook.versions.push(newVersion);
      if (notebook.versions.length > 50) {
        notebook.versions.shift();
      }

      notebook.version = notebook.versions.length;
    }

    await notebook.save();

    return NextResponse.json({
      notebook: {
        id: notebook._id.toString(),
        title: notebook.title,
        content: notebook.content,
        authorId: notebook.authorId,
        collaborators: notebook.collaborators,
        version: notebook.version,
        createdAt: notebook.createdAt,
        updatedAt: notebook.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error updating notebook:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to update notebook";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

