import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Notebook from "@/models/Notebook";
import Protocol from "@/models/Protocol";
import Replication from "@/models/Replication";

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
    const userId = session.user.id;

    // Get notebook count
    const notebookCount = await Notebook.countDocuments({
      authorId: userId,
    });

    // Get protocol count
    const protocolCount = await Protocol.countDocuments({
      authorId: userId,
    });

    // Get draft protocol count
    const draftProtocolCount = await Protocol.countDocuments({
      authorId: userId,
      status: "draft",
    });

    // Get replication count (both user's replications and replications of user's protocols)
    const myReplications = await Replication.countDocuments({
      replicatorId: userId,
    });

    const myProtocols = await Protocol.find({ authorId: userId }).select("_id");
    const protocolIds = myProtocols.map((p) => p._id.toString());
    
    const replicationsOfMyProtocols = await Replication.countDocuments({
      protocolId: { $in: protocolIds },
    });

    const totalReplications = myReplications + replicationsOfMyProtocols;

    // Get pending verification count
    const pendingVerifications = await Replication.countDocuments({
      protocolId: { $in: protocolIds },
      status: { $in: ["completed", "in-progress"] },
    });

    // Calculate success rate from completed replications
    const completedReplications = await Replication.find({
      $or: [
        { replicatorId: userId, status: { $in: ["completed", "verified"] } },
        { protocolId: { $in: protocolIds }, status: { $in: ["completed", "verified"] } },
      ],
    });

    const successfulReplications = completedReplications.filter(
      (r) => r.results?.success === true
    );

    const successRate = completedReplications.length > 0
      ? Math.round((successfulReplications.length / completedReplications.length) * 100)
      : 0;

    return NextResponse.json({
      stats: {
        notebooks: notebookCount,
        protocols: protocolCount,
        draftProtocols: draftProtocolCount,
        replications: totalReplications,
        pendingVerifications,
        successRate,
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch stats";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

