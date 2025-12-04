import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import PullRequest from "@/models/PullRequest";
import mongoose from "mongoose";

/**
 * POST /api/pr/:id/review - Submit a review (approve or request changes)
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
    const { status: reviewStatus } = body;

    if (!reviewStatus || !["approved", "changes_requested"].includes(reviewStatus)) {
      return NextResponse.json(
        { error: "Review status must be 'approved' or 'changes_requested'" },
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

    // Check if PR is already merged or closed
    if (pr.status === "merged" || pr.status === "closed") {
      return NextResponse.json(
        { error: "Cannot review a merged or closed pull request" },
        { status: 400 }
      );
    }

    // Check if user is a reviewer
    const reviewerIndex = pr.reviewers.findIndex(
      (r) => r.userId === session.user.id
    );

    if (reviewerIndex === -1) {
      // If not in reviewers list, check if user is admin or protocol author
      const Protocol = (await import("@/models/Protocol")).default;
      const protocol = await Protocol.findById(pr.protocolId).lean();
      
      if (protocol?.authorId !== session.user.id && session.user.role !== "admin") {
        return NextResponse.json(
          { error: "You are not a reviewer for this pull request" },
          { status: 403 }
        );
      }

      // Add user as reviewer
      pr.reviewers.push({
        userId: session.user.id,
        status: reviewStatus as "approved" | "changes_requested",
        reviewedAt: new Date(),
      });
    } else {
      // Update existing review
      pr.reviewers[reviewerIndex].status = reviewStatus as "approved" | "changes_requested";
      pr.reviewers[reviewerIndex].reviewedAt = new Date();
    }

    // Update PR status based on reviews
    const allApproved = pr.reviewers.every(
      (r) => r.status === "approved" || r.userId === pr.authorId
    );
    const hasChangesRequested = pr.reviewers.some(
      (r) => r.status === "changes_requested"
    );

    if (hasChangesRequested) {
      pr.status = "changes_requested";
    } else if (allApproved && pr.reviewers.length > 0) {
      pr.status = "approved";
    }

    await pr.save();

    // Populate reviewer info
    const User = (await import("@/models/User")).default;
    const reviewerUser = await User.findById(session.user.id)
      .select("name email institution profileImage")
      .lean();

    const updatedReviewer = pr.reviewers.find(
      (r) => r.userId === session.user.id
    );

    return NextResponse.json({
      review: {
        userId: updatedReviewer?.userId,
        user: reviewerUser ? {
          id: reviewerUser._id.toString(),
          name: reviewerUser.name,
          email: reviewerUser.email,
          institution: reviewerUser.institution,
          profileImage: reviewerUser.profileImage,
        } : null,
        status: updatedReviewer?.status,
        reviewedAt: updatedReviewer?.reviewedAt,
      },
      pullRequestStatus: pr.status,
    });
  } catch (error) {
    console.error("Error submitting review:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to submit review";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

