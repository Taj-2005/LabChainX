import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Replication from "@/models/Replication";
import Protocol from "@/models/Protocol";

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

    const searchParams = req.nextUrl.searchParams;
    const filter = searchParams.get("filter"); // "my-replications" or "of-my-protocols"

    let replications;

    if (filter === "of-my-protocols") {
      // Get replications of protocols created by the user
      const userProtocols = await Protocol.find({ authorId: session.user.id }).select("_id");
      const protocolIds = userProtocols.map((p) => p._id.toString());

      replications = await Replication.find({
        protocolId: { $in: protocolIds },
      })
        .sort({ createdAt: -1 })
        .limit(50);
    } else {
      // Get replications created by the user
      replications = await Replication.find({
        replicatorId: session.user.id,
      })
        .sort({ createdAt: -1 })
        .limit(50);
    }

    return NextResponse.json({
      replications: replications.map((rep) => ({
        id: rep._id.toString(),
        protocolId: rep.protocolId,
        protocolTitle: rep.protocolTitle,
        replicatorId: rep.replicatorId,
        replicatorName: rep.replicatorName,
        replicatorInstitution: rep.replicatorInstitution,
        status: rep.status,
        results: rep.results,
        verifications: rep.verifications,
        startedAt: rep.startedAt,
        completedAt: rep.completedAt,
        signedAt: rep.signedAt,
        signature: rep.signature,
        createdAt: rep.createdAt,
        updatedAt: rep.updatedAt,
      })),
    });
  } catch (error) {
    console.error("Error fetching replications:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch replications";
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

    const { protocolId } = await req.json();

    if (!protocolId) {
      return NextResponse.json(
        { error: "Protocol ID is required" },
        { status: 400 }
      );
    }

    await connectDB();

    // Get protocol details
    const protocol = await Protocol.findById(protocolId);
    if (!protocol) {
      return NextResponse.json(
        { error: "Protocol not found" },
        { status: 404 }
      );
    }

    // Check if replication already exists
    const existing = await Replication.findOne({
      protocolId,
      replicatorId: session.user.id,
    });

    if (existing) {
      return NextResponse.json(
        { error: "You have already started replicating this protocol" },
        { status: 400 }
      );
    }

    // Create replication
    const replication = await Replication.create({
      protocolId,
      protocolTitle: protocol.title,
      replicatorId: session.user.id,
      replicatorName: session.user.name || "Unknown",
      replicatorInstitution: (session.user as { institution?: string }).institution || "Unknown",
      status: "pending",
      results: {
        success: false,
      },
      verifications: [],
    });

    return NextResponse.json(
      {
        replication: {
          id: replication._id.toString(),
          protocolId: replication.protocolId,
          protocolTitle: replication.protocolTitle,
          replicatorId: replication.replicatorId,
          replicatorName: replication.replicatorName,
          replicatorInstitution: replication.replicatorInstitution,
          status: replication.status,
          results: replication.results,
          startedAt: replication.startedAt,
          createdAt: replication.createdAt,
          updatedAt: replication.updatedAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating replication:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to create replication";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

