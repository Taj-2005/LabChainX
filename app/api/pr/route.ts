import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import PullRequest from "@/models/PullRequest";
import Protocol from "@/models/Protocol";
import User from "@/models/User";
import mongoose from "mongoose";

/**
 * GET /api/pr - List pull requests
 * Query params: protocolId (optional)
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const protocolId = searchParams.get("protocolId");

    const query: Record<string, unknown> = {};
    if (protocolId) {
      if (!mongoose.Types.ObjectId.isValid(protocolId)) {
        return NextResponse.json(
          { error: "Invalid protocol ID" },
          { status: 400 }
        );
      }
      query.protocolId = protocolId;
    }

    const prs = await PullRequest.find(query)
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    // Populate author and reviewer info
    const prsWithUsers = await Promise.all(
      prs.map(async (pr) => {
        const [author, protocol] = await Promise.all([
          User.findById(pr.authorId).select("name email institution profileImage").lean(),
          Protocol.findById(pr.protocolId).select("title").lean(),
        ]);

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

        return {
          id: pr._id.toString(),
          protocolId: pr.protocolId,
          protocolTitle: protocol?.title || "Unknown Protocol",
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
          commentsCount: pr.comments?.length || 0,
          mergedBy: pr.mergedBy,
          mergedAt: pr.mergedAt,
          createdAt: pr.createdAt,
          updatedAt: pr.updatedAt,
        };
      })
    );

    return NextResponse.json({ pullRequests: prsWithUsers });
  } catch (error) {
    console.error("Error fetching pull requests:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch pull requests";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * POST /api/pr - Create a new pull request
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { protocolId, branch, title, description, changes, reviewers } = body;

    if (!protocolId || !branch || !title || !changes || !Array.isArray(changes)) {
      return NextResponse.json(
        { error: "Missing required fields: protocolId, branch, title, changes" },
        { status: 400 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(protocolId)) {
      return NextResponse.json(
        { error: "Invalid protocol ID" },
        { status: 400 }
      );
    }

    await connectDB();

    // Verify protocol exists and user has access
    const protocol = await Protocol.findById(protocolId);
    if (!protocol) {
      return NextResponse.json(
        { error: "Protocol not found" },
        { status: 404 }
      );
    }

    // Check if user is author or has permission
    if (protocol.authorId !== session.user.id && session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    // Validate reviewers if provided
    if (reviewers && Array.isArray(reviewers)) {
      for (const reviewerId of reviewers) {
        if (!mongoose.Types.ObjectId.isValid(reviewerId)) {
          return NextResponse.json(
            { error: `Invalid reviewer ID: ${reviewerId}` },
            { status: 400 }
          );
        }
        const reviewer = await User.findById(reviewerId);
        if (!reviewer) {
          return NextResponse.json(
            { error: `Reviewer not found: ${reviewerId}` },
            { status: 404 }
          );
        }
      }
    }

    // Create PR
    const pr = new PullRequest({
      protocolId,
      authorId: session.user.id,
      branch,
      title,
      description,
      changes,
      reviewers: reviewers?.map((userId: string) => ({
        userId,
        status: "pending" as const,
      })) || [],
      status: "open",
    });

    await pr.save();

    // Populate author info
    const author = await User.findById(session.user.id)
      .select("name email institution profileImage")
      .lean();

    return NextResponse.json({
      pullRequest: {
        id: pr._id.toString(),
        protocolId: pr.protocolId,
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
        reviewers: pr.reviewers,
        comments: pr.comments,
        createdAt: pr.createdAt,
        updatedAt: pr.updatedAt,
      },
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating pull request:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to create pull request";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

