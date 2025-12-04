import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import PullRequest from "@/models/PullRequest";
import Protocol from "@/models/Protocol";
import { applyPRChanges } from "@/lib/pr-utils";
import mongoose from "mongoose";

/**
 * POST /api/pr/:id/merge - Merge a pull request
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

    await connectDB();

    const pr = await PullRequest.findById(id);

    if (!pr) {
      return NextResponse.json(
        { error: "Pull request not found" },
        { status: 404 }
      );
    }

    // Check if PR is already merged or closed
    if (pr.status === "merged") {
      return NextResponse.json(
        { error: "Pull request is already merged" },
        { status: 400 }
      );
    }

    if (pr.status === "closed") {
      return NextResponse.json(
        { error: "Cannot merge a closed pull request" },
        { status: 400 }
      );
    }

    // Get protocol
    const protocol = await Protocol.findById(pr.protocolId);

    if (!protocol) {
      return NextResponse.json(
        { error: "Protocol not found" },
        { status: 404 }
      );
    }

    // Check permissions: protocol author or admin can merge
    const canMerge =
      protocol.authorId === session.user.id ||
      session.user.role === "admin" ||
      pr.authorId === session.user.id; // PR author can merge their own PR

    if (!canMerge) {
      return NextResponse.json(
        { error: "You do not have permission to merge this pull request" },
        { status: 403 }
      );
    }

    // Check if PR is approved (optional - can be configured)
    const hasRequiredApprovals = pr.reviewers.length > 0
      ? pr.reviewers.some((r) => r.status === "approved")
      : true; // Allow merge without reviewers if none assigned

    if (!hasRequiredApprovals && pr.reviewers.length > 0) {
      return NextResponse.json(
        { error: "Pull request requires at least one approval before merging" },
        { status: 400 }
      );
    }

    // Apply changes to protocol
    const currentSteps = protocol.steps || [];
    const newSteps = applyPRChanges(currentSteps, pr.changes);

    // Create version snapshot before merging
    const versionSnapshot = {
      title: protocol.title,
      description: protocol.description,
      steps: currentSteps,
      savedAt: new Date(),
      savedBy: session.user.id,
      versionNumber: protocol.currentVersion,
    };

    // Update protocol
    protocol.steps = newSteps;
    protocol.currentVersion = (protocol.currentVersion || 1) + 1;
    protocol.versions.push(versionSnapshot);
    protocol.currentBranch = pr.branch || protocol.currentBranch || "main";

    // Update branch metadata if needed
    if (pr.branch && pr.branch !== "main") {
      const branchExists = protocol.branches?.some((b) => b.name === pr.branch);
      if (!branchExists) {
        protocol.branches = protocol.branches || [];
        protocol.branches.push({
          name: pr.branch,
          createdAt: new Date(),
          createdBy: pr.authorId,
          baseVersion: protocol.currentVersion - 1,
        });
      }
    }

    await protocol.save();

    // Update PR status
    pr.status = "merged";
    pr.mergedBy = session.user.id;
    pr.mergedAt = new Date();

    await pr.save();

    return NextResponse.json({
      success: true,
      message: "Pull request merged successfully",
      pullRequest: {
        id: pr._id.toString(),
        status: pr.status,
        mergedBy: pr.mergedBy,
        mergedAt: pr.mergedAt,
      },
      protocol: {
        id: protocol._id.toString(),
        version: protocol.currentVersion,
        stepsCount: protocol.steps.length,
      },
    });
  } catch (error) {
    console.error("Error merging pull request:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to merge pull request";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

