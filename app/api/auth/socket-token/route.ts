import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import jwt from "jsonwebtoken";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Create JWT token for socket authentication
    const token = jwt.sign(
      {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
      },
      process.env.NEXTAUTH_SECRET || "your-secret-key",
      { expiresIn: "24h" }
    );

    return NextResponse.json({ token });
  } catch (error) {
    console.error("Error generating socket token:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to generate token";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

