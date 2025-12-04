import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Notebook from "@/models/Notebook";
import mongoose from "mongoose";

/**
 * GET /api/experiments/:id/data - Get experiment data for visualization
 * Query params: format (json|csv), fields (comma-separated)
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
        { error: "Invalid experiment ID" },
        { status: 400 }
      );
    }

    await connectDB();

    const notebook = await Notebook.findById(id).lean();

    if (!notebook) {
      return NextResponse.json(
        { error: "Experiment not found" },
        { status: 404 }
      );
    }

    // Check access (author or collaborator)
    if (
      notebook.authorId !== session.user.id &&
      !notebook.collaborators?.includes(session.user.id) &&
      session.user.role !== "admin"
    ) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const format = searchParams.get("format") || "json";
    const fieldsParam = searchParams.get("fields");

    // Try to extract structured data from notebook content
    // This is a simplified parser - in production, you'd want more robust parsing
    let data: Record<string, unknown>[] = [];
    
    try {
      // Look for JSON data in the content
      const jsonMatch = notebook.content.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[1]);
        if (Array.isArray(parsed)) {
          data = parsed;
        } else if (typeof parsed === "object") {
          data = [parsed];
        }
      } else {
        // Try to parse as CSV-like structure
        const lines = notebook.content.split("\n").filter((line) => line.trim());
        if (lines.length > 1) {
          const headers = lines[0].split(",").map((h) => h.trim());
          data = lines.slice(1).map((line) => {
            const values = line.split(",").map((v) => v.trim());
            const row: Record<string, unknown> = {};
            headers.forEach((header, index) => {
              const value = values[index];
              // Try to parse as number
              const numValue = Number(value);
              row[header] = isNaN(numValue) ? value : numValue;
            });
            return row;
          });
        }
      }
    } catch (parseError) {
      // If parsing fails, return empty data array
      console.warn("Failed to parse experiment data:", parseError);
    }

    // Filter fields if specified
    if (fieldsParam && data.length > 0) {
      const fields = fieldsParam.split(",").map((f) => f.trim());
      data = data.map((row) => {
        const filtered: Record<string, unknown> = {};
        fields.forEach((field) => {
          if (row[field] !== undefined) {
            filtered[field] = row[field];
          }
        });
        return filtered;
      });
    }

    if (format === "csv") {
      // Convert to CSV
      if (data.length === 0) {
        return NextResponse.json(
          { error: "No data to export" },
          { status: 400 }
        );
      }

      const headers = Object.keys(data[0]);
      const csvRows = [
        headers.join(","),
        ...data.map((row) =>
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
          "Content-Disposition": `attachment; filename="experiment-${id}.csv"`,
        },
      });
    }

    return NextResponse.json({
      experimentId: id,
      experimentTitle: notebook.title,
      data,
      fields: data.length > 0 ? Object.keys(data[0]) : [],
      count: data.length,
    });
  } catch (error) {
    console.error("Error fetching experiment data:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch experiment data";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

