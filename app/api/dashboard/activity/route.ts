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

    // Get recent notebooks
    const recentNotebooks = await Notebook.find({
      $or: [
        { authorId: userId },
        { collaborators: userId },
      ],
    })
      .sort({ updatedAt: -1 })
      .limit(5)
      .select("title updatedAt")
      .lean();

    // Get recent protocols
    const recentProtocols = await Protocol.find({
      authorId: userId,
    })
      .sort({ updatedAt: -1 })
      .limit(5)
      .select("title status updatedAt")
      .lean();

    // Get recent replications
    const myProtocols = await Protocol.find({ authorId: userId }).select("_id").lean();
    const protocolIds = myProtocols.map((p) => p._id.toString());

    const recentReplications = await Replication.find({
      $or: [
        { replicatorId: userId },
        { protocolId: { $in: protocolIds } },
      ],
    })
      .sort({ updatedAt: -1 })
      .limit(5)
      .select("protocolTitle status updatedAt")
      .lean();

    // Combine and sort all activities
    const activities: Array<{
      type: "notebook" | "protocol" | "replication";
      title: string;
      action: string;
      timestamp: Date;
      status?: string;
    }> = [];

    recentNotebooks.forEach((nb) => {
      activities.push({
        type: "notebook",
        title: nb.title,
        action: "Updated",
        timestamp: nb.updatedAt,
      });
    });

    recentProtocols.forEach((p) => {
      activities.push({
        type: "protocol",
        title: p.title,
        action: p.status === "published" ? "Published" : "Updated",
        timestamp: p.updatedAt,
        status: p.status,
      });
    });

    recentReplications.forEach((r) => {
      const action = r.status === "verified"
        ? "Verified"
        : r.status === "completed"
        ? "Completed"
        : "Started";
      activities.push({
        type: "replication",
        title: r.protocolTitle,
        action: `Replication ${action}`,
        timestamp: r.updatedAt,
        status: r.status,
      });
    });

    // Sort by timestamp and limit to 10 most recent
    activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    const recentActivities = activities.slice(0, 10);

    return NextResponse.json({
      activities: recentActivities.map((activity) => ({
        ...activity,
        timestamp: activity.timestamp.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Error fetching recent activity:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch activity";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

