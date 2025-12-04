import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Verification from "@/models/Verification";
import Institution from "@/models/Institution";
import User from "@/models/User";

/**
 * GET /api/verification/lineage - Get verification lineage for a protocol/experiment
 * Query params: protocolId (or experimentId), subjectType
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
    const experimentId = searchParams.get("experimentId");
    const subjectType = searchParams.get("subjectType") || "protocol";

    const subjectId = protocolId || experimentId;

    if (!subjectId) {
      return NextResponse.json(
        { error: "protocolId or experimentId is required" },
        { status: 400 }
      );
    }

    // Fetch all verifications for this subject
    const verifications = await Verification.find({
      subjectId,
      subjectType,
    })
      .sort({ timestamp: -1 })
      .lean();

    // Fetch related data
    const institutionIds = new Set(verifications.map((v) => v.institutionId));
    const verifierIds = new Set(verifications.map((v) => v.verifierId));

    const institutions = await Institution.find({
      name: { $in: Array.from(institutionIds) },
    }).lean();

    const verifiers = await User.find({
      _id: { $in: Array.from(verifierIds).map((id) => id) },
    })
      .select("name email institution profileImage")
      .lean();

    // Build lineage timeline
    const lineage = verifications.map((v) => {
      const institution = institutions.find((i) => i.name === v.institutionId);
      const verifier = verifiers.find((u) => u._id.toString() === v.verifierId);

      return {
        id: v._id.toString(),
        timestamp: v.timestamp,
        status: v.status,
        notes: v.notes,
        institution: institution
          ? {
              id: institution._id.toString(),
              name: institution.name,
              abbreviation: institution.abbreviation,
              trustScore: institution.trustScore,
            }
          : null,
        verifier: verifier
          ? {
              id: verifier._id.toString(),
              name: verifier.name,
              email: verifier.email,
              institution: verifier.institution,
              profileImage: verifier.profileImage,
            }
          : null,
      };
    });

    // Calculate trust score breakdown
    const trustBreakdown = {
      total: lineage.length,
      verified: lineage.filter((l) => l.status === "verified").length,
      pending: lineage.filter((l) => l.status === "pending").length,
      rejected: lineage.filter((l) => l.status === "rejected").length,
      averageTrustScore: lineage.length > 0
        ? Math.round(
            lineage.reduce((sum, l) => sum + (l.institution?.trustScore || 50), 0) /
              lineage.length
          )
        : 50,
    };

    return NextResponse.json({
      subjectId,
      subjectType,
      lineage,
      trustBreakdown,
    });
  } catch (error) {
    console.error("Error fetching verification lineage:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch verification lineage";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

