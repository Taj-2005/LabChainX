import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import PullRequest from "@/models/PullRequest";
import mongoose from "mongoose";

/**
 * POST /api/pr/:id/comment - Add a comment to a pull request
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid PR ID" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { text, path } = body;

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return NextResponse.json(
        { error: "Comment text is required" },
        { status: 400 }
      );
    }

    await connectDB();

    const pr = await PullRequest.findById(id);

    if (!pr) {
      return NextResponse.json(
        { error: "Pull request not found" },
        { status: 404 }
      );
    }

    // Check if PR is closed/merged (can still comment but warn)
    if (pr.status === "closed" || pr.status === "merged") {
      // Allow comments but note the status
    }

    // Add comment
    pr.comments.push({
      authorId: session.user.id,
      text: text.trim(),
      path: path || undefined,
      createdAt: new Date(),
    });

    await pr.save();

    // Populate comment author
    const User = (await import("@/models/User")).default;
    const commentAuthor = await User.findById(session.user.id)
      .select("name email institution profileImage")
      .lean();

    const newComment = pr.comments[pr.comments.length - 1];

    return NextResponse.json({
      comment: {
        id: newComment._id?.toString(),
        authorId: newComment.authorId,
        author: commentAuthor ? {
          id: commentAuthor._id.toString(),
          name: commentAuthor.name,
          email: commentAuthor.email,
          institution: commentAuthor.institution,
          profileImage: commentAuthor.profileImage,
        } : null,
        text: newComment.text,
        path: newComment.path,
        createdAt: newComment.createdAt,
      },
    }, { status: 201 });
  } catch (error) {
    console.error("Error adding comment:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to add comment";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

