import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { standardizeProtocol, autocompleteStep } from "@/lib/ml-api";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { content, action, currentSteps, partialText } = await req.json();

    if (!content && !currentSteps) {
      return NextResponse.json(
        { error: "Content or currentSteps is required" },
        { status: 400 }
      );
    }

    // Action: 'standardize' or 'autocomplete'
    const actionType = action || "standardize";

    if (actionType === "standardize" && content) {
      try {
        const result = await standardizeProtocol(content);
        return NextResponse.json({
          success: true,
          action: "standardize",
          data: result,
        });
      } catch (error) {
        console.error("ML standardization error:", error);
        return NextResponse.json(
          { 
            success: false, 
            error: "Failed to process content. ML server may be unavailable.",
            action: "standardize",
          },
          { status: 503 }
        );
      }
    }

    if (actionType === "autocomplete" && currentSteps) {
      try {
        const result = await autocompleteStep(currentSteps, partialText);
        return NextResponse.json({
          success: true,
          action: "autocomplete",
          data: result,
        });
      } catch (error) {
        console.error("ML autocomplete error:", error);
        return NextResponse.json(
          { 
            success: false, 
            error: "Failed to get autocomplete. ML server may be unavailable.",
            action: "autocomplete",
          },
          { status: 503 }
        );
      }
    }

    return NextResponse.json(
      { error: "Invalid action or missing parameters" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error processing AI request:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to process request";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

