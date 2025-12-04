import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Protocol from "@/models/Protocol";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    const protocols = await Protocol.find({
      authorId: session.user.id,
    })
      .sort({ updatedAt: -1 })
      .select("title description steps authorId version status createdAt updatedAt");

    return NextResponse.json({ protocols });
  } catch (error) {
    console.error("Error fetching protocols:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch protocols";
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

    const { title, description, steps } = await req.json();

    await connectDB();

    const protocol = await Protocol.create({
      title: title || "Untitled Protocol",
      description: description || "",
      steps: steps || [],
      authorId: session.user.id,
      version: 1,
      currentVersion: 1,
      status: "draft",
      versions: [],
    });

    return NextResponse.json(
      {
        protocol: {
          id: protocol._id.toString(),
          title: protocol.title,
          description: protocol.description,
          steps: protocol.steps,
          authorId: protocol.authorId,
          version: protocol.version,
          status: protocol.status,
          createdAt: protocol.createdAt,
          updatedAt: protocol.updatedAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating protocol:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to create protocol";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

