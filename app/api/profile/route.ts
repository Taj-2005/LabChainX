import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";

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

    const user = await User.findById(session.user.id).select("-password");

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

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
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch profile";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { name, institution, bio, password, currentPassword, profilePicture } = await req.json();

    await connectDB();

    const user = await User.findById(session.user.id).select("+password");

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Update name
    if (name !== undefined) {
      user.name = name;
    }

    // Update institution
    if (institution !== undefined) {
      user.institution = institution;
    }

    // Update bio
    if (bio !== undefined) {
      user.bio = bio;
    }

    // Update profile picture
    if (profilePicture !== undefined) {
      user.profilePicture = profilePicture;
    }

    // Update password if provided
    if (password && currentPassword) {
      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isPasswordValid) {
        return NextResponse.json(
          { error: "Current password is incorrect" },
          { status: 400 }
        );
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      user.password = hashedPassword;
    }

    await user.save();

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
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to update profile";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

