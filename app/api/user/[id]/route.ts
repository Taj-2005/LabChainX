import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Notebook from "@/models/Notebook";
import Protocol from "@/models/Protocol";
import Replication from "@/models/Replication";
import mongoose from "mongoose";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;

    // Allow viewing profiles even without auth (public profiles)
    // But require auth for some details

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid user ID" },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findById(id).select("-password");

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Get user's contributions
    const notebooks = await Notebook.find({ authorId: id })
      .sort({ updatedAt: -1 })
      .limit(10)
      .select("title createdAt updatedAt")
      .lean();

    const protocols = await Protocol.find({ authorId: id })
      .sort({ updatedAt: -1 })
      .limit(10)
      .select("title status createdAt updatedAt")
      .lean();

    const replications = await Replication.find({ replicatorId: id })
      .sort({ updatedAt: -1 })
      .limit(10)
      .select("protocolTitle status results createdAt")
      .lean();

    // Get statistics
    const notebookCount = await Notebook.countDocuments({ authorId: id });
    const protocolCount = await Protocol.countDocuments({ authorId: id });
    const replicationCount = await Replication.countDocuments({ replicatorId: id });
    
    const completedReplications = await Replication.find({
      replicatorId: id,
      status: { $in: ["completed", "verified"] },
    });
    const successCount = completedReplications.filter((r) => r.results?.success === true).length;
    const successRate = completedReplications.length > 0
      ? Math.round((successCount / completedReplications.length) * 100)
      : 0;

    return NextResponse.json({
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        institution: user.institution,
        role: user.role,
        verified: user.verified,
        bio: user.bio,
        profilePicture: user.profilePicture,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      contributions: {
        notebooks: notebooks.map((nb) => ({
          id: nb._id.toString(),
          title: nb.title,
          createdAt: nb.createdAt,
          updatedAt: nb.updatedAt,
        })),
        protocols: protocols.map((p) => ({
          id: p._id.toString(),
          title: p.title,
          status: p.status,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
        })),
        replications: replications.map((r) => ({
          id: r._id.toString(),
          protocolTitle: r.protocolTitle,
          status: r.status,
          success: r.results?.success,
          createdAt: r.createdAt,
        })),
      },
      stats: {
        notebookCount,
        protocolCount,
        replicationCount,
        successRate,
      },
      isOwnProfile: session?.user?.id === id,
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch user profile";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

