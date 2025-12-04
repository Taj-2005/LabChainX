import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import PullRequest from "@/models/PullRequest";
import Protocol from "@/models/Protocol";
import User from "@/models/User";
import mongoose from "mongoose";

/**
 * GET /api/pr/:id - Get pull request details
 */
export async function GET(
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

    await connectDB();

    const pr = await PullRequest.findById(id).lean();

    if (!pr) {
      return NextResponse.json(
        { error: "Pull request not found" },
        { status: 404 }
      );
    }

    // Get protocol for diff comparison
    const protocol = await Protocol.findById(pr.protocolId).lean();

    // Populate author
    const author = await User.findById(pr.authorId)
      .select("name email institution profileImage")
      .lean();

    // Populate reviewers
    const reviewers = await Promise.all(
      pr.reviewers.map(async (reviewer) => {
        const reviewerUser = await User.findById(reviewer.userId)
          .select("name email institution profileImage")
          .lean();
        return {
          ...reviewer,
          user: reviewerUser ? {
            id: reviewerUser._id.toString(),
            name: reviewerUser.name,
            email: reviewerUser.email,
            institution: reviewerUser.institution,
            profileImage: reviewerUser.profileImage,
          } : null,
        };
      })
    );

    // Populate comment authors
    const comments = await Promise.all(
      pr.comments.map(async (comment) => {
        const commentAuthor = await User.findById(comment.authorId)
          .select("name email institution profileImage")
          .lean();
        return {
          id: comment._id?.toString(),
          authorId: comment.authorId,
          author: commentAuthor ? {
            id: commentAuthor._id.toString(),
            name: commentAuthor.name,
            email: commentAuthor.email,
            institution: commentAuthor.institution,
            profileImage: commentAuthor.profileImage,
          } : null,
          text: comment.text,
          path: comment.path,
          createdAt: comment.createdAt,
        };
      })
    );

    // Get merged by user if applicable
    let mergedByUser = null;
    if (pr.mergedBy) {
      const mergedBy = await User.findById(pr.mergedBy)
        .select("name email institution profileImage")
        .lean();
      if (mergedBy) {
        mergedByUser = {
          id: mergedBy._id.toString(),
          name: mergedBy.name,
          email: mergedBy.email,
          institution: mergedBy.institution,
          profileImage: mergedBy.profileImage,
        };
      }
    }

    return NextResponse.json({
      pullRequest: {
        id: pr._id.toString(),
        protocolId: pr.protocolId,
        protocol: protocol ? {
          id: protocol._id.toString(),
          title: protocol.title,
          steps: protocol.steps,
          currentBranch: protocol.currentBranch,
        } : null,
        authorId: pr.authorId,
        author: author ? {
          id: author._id.toString(),
          name: author.name,
          email: author.email,
          institution: author.institution,
          profileImage: author.profileImage,
        } : null,
        branch: pr.branch,
        title: pr.title,
        description: pr.description,
        status: pr.status,
        changes: pr.changes,
        reviewers,
        comments,
        mergedBy: pr.mergedBy,
        mergedByUser,
        mergedAt: pr.mergedAt,
        createdAt: pr.createdAt,
        updatedAt: pr.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error fetching pull request:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch pull request";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

