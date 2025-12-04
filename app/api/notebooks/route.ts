import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Notebook from "@/models/Notebook";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    const notebooks = await Notebook.find({
      $or: [
        { authorId: session.user.id },
        { collaborators: session.user.id },
      ],
    })
      .sort({ updatedAt: -1 })
      .select("title content authorId collaborators version createdAt updatedAt");

    return NextResponse.json({ notebooks });
  } catch (error) {
    console.error("Error fetching notebooks:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch notebooks";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { title, content } = await req.json();

    await connectDB();

    const notebook = await Notebook.create({
      title: title || "Untitled Notebook",
      content: content || "",
      authorId: session.user.id,
      collaborators: [],
      version: 1,
      versions: [{
        content: content || "",
        savedAt: new Date(),
        savedBy: session.user.id,
      }],
    });

    return NextResponse.json(
      {
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
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating notebook:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to create notebook";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

