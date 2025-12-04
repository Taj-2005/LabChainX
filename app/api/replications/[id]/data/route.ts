import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Replication from "@/models/Replication";
import mongoose from "mongoose";

/**
 * GET /api/replications/:id/data - Get replication data for visualization
 * Query params: format (json|csv), page, limit
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid replication ID" },
        { status: 400 }
      );
    }

    await connectDB();

    const replication = await Replication.findById(id).lean();

    if (!replication) {
      return NextResponse.json(
        { error: "Replication not found" },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(req.url);
    const format = searchParams.get("format") || "json";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "100", 10);

    // Extract data from replication results
    let data: Record<string, unknown>[] = [];
    
    if (replication.results?.data) {
      if (Array.isArray(replication.results.data)) {
        data = replication.results.data as Record<string, unknown>[];
      } else if (typeof replication.results.data === "object") {
        // Convert single object to array
        data = [replication.results.data];
      }
    }

    // Paginate
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedData = data.slice(startIndex, endIndex);
    const total = data.length;
    const totalPages = Math.ceil(total / limit);

    if (format === "csv") {
      // Convert to CSV
      if (paginatedData.length === 0) {
        return NextResponse.json(
          { error: "No data to export" },
          { status: 400 }
        );
      }

      const headers = Object.keys(paginatedData[0]);
      const csvRows = [
        headers.join(","),
        ...paginatedData.map((row) =>
          headers.map((header) => {
            const value = row[header];
            return typeof value === "string" && value.includes(",")
              ? `"${value}"`
              : value;
          }).join(",")
        ),
      ];

      return new NextResponse(csvRows.join("\n"), {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="replication-${id}.csv"`,
        },
      });
    }

    return NextResponse.json({
      replicationId: id,
      replicationTitle: replication.protocolTitle,
      data: paginatedData,
      fields: paginatedData.length > 0 ? Object.keys(paginatedData[0]) : [],
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore: endIndex < total,
      },
    });
  } catch (error) {
    console.error("Error fetching replication data:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch replication data";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

