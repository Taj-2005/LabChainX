import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Verification from "@/models/Verification";
import Institution from "@/models/Institution";
import User from "@/models/User";

/**
 * GET /api/verification/network - Get verification network graph data
 * Query params: subjectId, subjectType, timeRange (optional)
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
    const subjectId = searchParams.get("subjectId");
    const subjectType = searchParams.get("subjectType") || "protocol";
    const timeRange = searchParams.get("timeRange"); // e.g., "30d", "1y"

    // Build query
    const query: Record<string, unknown> = {};
    if (subjectId) {
      query.subjectId = subjectId;
      query.subjectType = subjectType;
    }

    // Apply time range filter
    if (timeRange) {
      const now = new Date();
      let startDate: Date;
      if (timeRange === "30d") {
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      } else if (timeRange === "1y") {
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      } else {
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      }
      query.timestamp = { $gte: startDate };
    }

    // Fetch verifications
    const verifications = await Verification.find(query)
      .sort({ timestamp: -1 })
      .lean();

    // Get unique institutions and verifiers
    const institutionIds = new Set<string>();
    const verifierIds = new Set<string>();

    verifications.forEach((v) => {
      institutionIds.add(v.institutionId);
      verifierIds.add(v.verifierId);
    });

    // Fetch institutions
    const institutions = await Institution.find({
      name: { $in: Array.from(institutionIds) },
    }).lean();

    // Fetch verifiers
    const verifiers = await User.find({
      _id: { $in: Array.from(verifierIds).map((id) => id) },
    })
      .select("name email institution")
      .lean();

    // Build nodes (institutions)
    const nodes = institutions.map((inst) => ({
      id: inst.name,
      label: inst.abbreviation || inst.name,
      type: "institution",
      trustScore: inst.trustScore,
      metadata: inst.metadata,
      verificationCount: inst.verificationCount,
      verifiedCount: inst.verifiedCount,
    }));

    // Build edges (verifications)
    const edges = verifications.map((v) => {
      const verifier = verifiers.find((u) => u._id.toString() === v.verifierId);
      return {
        id: `edge-${v._id}`,
        from: v.institutionId,
        to: v.subjectId,
        label: `${verifier?.name || "Unknown"} - ${v.subjectType}`,
        timestamp: v.timestamp,
        status: v.status,
        notes: v.notes,
        verifier: verifier
          ? {
              id: verifier._id.toString(),
              name: verifier.name,
              email: verifier.email,
            }
          : null,
      };
    });

    // Calculate trust scores if not set
    for (const node of nodes) {
      if (node.trustScore === 50) {
        // Compute based on verification count and success rate
        const instVerifications = verifications.filter(
          (v) => v.institutionId === node.id
        );
        const successCount = instVerifications.filter(
          (v) => v.status === "verified"
        ).length;
        const successRate = instVerifications.length > 0
          ? successCount / instVerifications.length
          : 0.5;
        node.trustScore = Math.round(50 + successRate * 50);
      }
    }

    return NextResponse.json({
      nodes,
      edges,
      stats: {
        totalInstitutions: nodes.length,
        totalVerifications: edges.length,
        timeRange: timeRange || "all",
      },
    });
  } catch (error) {
    console.error("Error fetching verification network:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch verification network";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

