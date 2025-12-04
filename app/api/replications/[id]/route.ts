import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Replication from "@/models/Replication";
import mongoose from "mongoose";
import { signReplication } from "@/lib/crypto";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid replication ID" },
        { status: 400 }
      );
    }

    await connectDB();

    const replication = await Replication.findById(id);

    if (!replication) {
      return NextResponse.json(
        { error: "Replication not found" },
        { status: 404 }
      );
    }

    // Check access - user must be replicator or protocol owner
    // For now, allow access to all authenticated users (can be restricted later)
    
    return NextResponse.json({
      replication: {
        id: replication._id.toString(),
        protocolId: replication.protocolId,
        protocolTitle: replication.protocolTitle,
        replicatorId: replication.replicatorId,
        replicatorName: replication.replicatorName,
        replicatorInstitution: replication.replicatorInstitution,
        status: replication.status,
        results: replication.results,
        verifications: replication.verifications,
        startedAt: replication.startedAt,
        completedAt: replication.completedAt,
        signedAt: replication.signedAt,
        signature: replication.signature,
        createdAt: replication.createdAt,
        updatedAt: replication.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error fetching replication:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch replication";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid replication ID" },
        { status: 400 }
      );
    }

    const { status, results, sign } = await req.json();

    await connectDB();

    const replication = await Replication.findById(id);

    if (!replication) {
      return NextResponse.json(
        { error: "Replication not found" },
        { status: 404 }
      );
    }

    // Check if user is the replicator
    if (replication.replicatorId !== session.user.id) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    // Update status
    if (status) {
      replication.status = status;
      
      if (status === "completed" || status === "verified") {
        replication.completedAt = new Date();
      }
    }

    // Update results
    if (results) {
      replication.results = {
        ...replication.results,
        ...results,
      };
    }

    // Sign results if requested
    if (sign && replication.status === "completed") {
      const signatureData = {
        protocolId: replication.protocolId,
        replicatorId: replication.replicatorId,
        results: replication.results,
        timestamp: new Date().toISOString(),
      };

      const { signature } = signReplication(signatureData);
      replication.signature = signature;
      replication.signedAt = new Date();
    }

    await replication.save();

    return NextResponse.json({
      replication: {
        id: replication._id.toString(),
        protocolId: replication.protocolId,
        protocolTitle: replication.protocolTitle,
        replicatorId: replication.replicatorId,
        replicatorName: replication.replicatorName,
        replicatorInstitution: replication.replicatorInstitution,
        status: replication.status,
        results: replication.results,
        verifications: replication.verifications,
        startedAt: replication.startedAt,
        completedAt: replication.completedAt,
        signedAt: replication.signedAt,
        signature: replication.signature,
        createdAt: replication.createdAt,
        updatedAt: replication.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error updating replication:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to update replication";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

