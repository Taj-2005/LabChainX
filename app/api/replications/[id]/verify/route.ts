import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Replication from "@/models/Replication";
import mongoose from "mongoose";
import { signData, generateKeyPair } from "@/lib/crypto";

export async function POST(
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

    const { notes, verified } = await req.json();

    await connectDB();

    const replication = await Replication.findById(id);

    if (!replication) {
      return NextResponse.json(
        { error: "Replication not found" },
        { status: 404 }
      );
    }

    // Check if replication is completed
    if (replication.status !== "completed" && replication.status !== "verified") {
      return NextResponse.json(
        { error: "Replication must be completed before verification" },
        { status: 400 }
      );
    }

    // Check if already verified by this user
    const alreadyVerified = replication.verifications.some(
      (v) => v.verifiedBy === session.user.id
    );

    if (alreadyVerified) {
      return NextResponse.json(
        { error: "You have already verified this replication" },
        { status: 400 }
      );
    }

    // Create verification signature
    const verificationData = JSON.stringify({
      replicationId: id,
      verifiedBy: session.user.id,
      timestamp: new Date().toISOString(),
      results: replication.results,
    });

    // Generate a signature (in production, use institution's private key)
    const keyPair = generateKeyPair();
    const signature = signData(verificationData, keyPair.privateKey);

    // Add verification
    const verification = {
      verifiedBy: session.user.id,
      verifiedAt: new Date(),
      institution: (session.user as { institution?: string }).institution || "Unknown Institution",
      signature,
      notes: notes || "",
    };

    replication.verifications.push(verification);

    // Update status if verified
    if (verified !== false) {
      replication.status = "verified";
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
      verification,
    });
  } catch (error) {
    console.error("Error verifying replication:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to verify replication";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

