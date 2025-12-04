import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Notebook from "@/models/Notebook";
import Protocol from "@/models/Protocol";
import mongoose from "mongoose";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { resourceId, resourceType, version1Index, version2Index } = await req.json();

    if (!resourceId || !resourceType || version1Index === undefined || version2Index === undefined) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(resourceId)) {
      return NextResponse.json(
        { error: "Invalid resource ID" },
        { status: 400 }
      );
    }

    await connectDB();

    if (resourceType === "notebook") {
      const notebook = await Notebook.findById(resourceId);

      if (!notebook) {
        return NextResponse.json(
          { error: "Notebook not found" },
          { status: 404 }
        );
      }

      // Check access
      const hasAccess =
        notebook.authorId === session.user.id ||
        notebook.collaborators?.includes(session.user.id);

      if (!hasAccess) {
        return NextResponse.json(
          { error: "Access denied" },
          { status: 403 }
        );
      }

      const versions = [
        { content: notebook.content, versionNumber: notebook.version, savedAt: new Date() },
        ...(notebook.versions || []),
      ].reverse(); // Oldest first

      if (version1Index < 0 || version1Index >= versions.length ||
          version2Index < 0 || version2Index >= versions.length) {
        return NextResponse.json(
          { error: "Invalid version indices" },
          { status: 400 }
        );
      }

      const v1 = versions[version1Index];
      const v2 = versions[version2Index];

      return NextResponse.json({
        version1: {
          content: v1.content,
          versionNumber: v1.versionNumber,
          savedAt: v1.savedAt,
        },
        version2: {
          content: v2.content,
          versionNumber: v2.versionNumber,
          savedAt: v2.savedAt,
        },
      });
    }

    if (resourceType === "protocol") {
      const protocol = await Protocol.findById(resourceId);

      if (!protocol) {
        return NextResponse.json(
          { error: "Protocol not found" },
          { status: 404 }
        );
      }

      // Check access
      if (protocol.authorId !== session.user.id) {
        return NextResponse.json(
          { error: "Access denied" },
          { status: 403 }
        );
      }

      const versions = [
        {
          title: protocol.title,
          description: protocol.description,
          steps: protocol.steps,
          versionNumber: protocol.currentVersion,
          savedAt: new Date(),
        },
        ...(protocol.versions || []),
      ].reverse(); // Oldest first

      if (version1Index < 0 || version1Index >= versions.length ||
          version2Index < 0 || version2Index >= versions.length) {
        return NextResponse.json(
          { error: "Invalid version indices" },
          { status: 400 }
        );
      }

      const v1 = versions[version1Index];
      const v2 = versions[version2Index];

      // Convert protocol to string for diff
      const protocolToString = (v: typeof v1) => {
        return `Title: ${v.title}\nDescription: ${v.description || ""}\n\nSteps:\n${v.steps.map((s: any) => 
          `Step ${s.order}: ${s.title}\nReagents: ${s.reagents?.join(", ") || ""}\nEquipment: ${s.equipment?.join(", ") || ""}\nTiming: ${s.timing || ""}\nNotes: ${s.notes || ""}`
        ).join("\n\n")}`;
      };

      return NextResponse.json({
        version1: {
          content: protocolToString(v1),
          versionNumber: v1.versionNumber,
          savedAt: v1.savedAt,
        },
        version2: {
          content: protocolToString(v2),
          versionNumber: v2.versionNumber,
          savedAt: v2.savedAt,
        },
      });
    }

    return NextResponse.json(
      { error: "Invalid resource type" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error comparing versions:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to compare versions";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

