/**
 * ML Server API Client
 * Functions to interact with the LabChain ML server
 */

const ML_SERVER_URL = process.env.NEXT_PUBLIC_ML_SERVER_URL || "http://localhost:8000";

export interface StandardizeResponse {
  protocol: {
    title: string;
    description: string;
    steps: Array<{
      id: string;
      order: number;
      title: string;
      reagents: string[];
      timing: string;
      equipment: string[];
      notes: string;
    }>;
  };
  confidence: number;
  extracted_steps: Array<{
    id: string;
    order: number;
    title: string;
    reagents: string[];
    timing: string;
    equipment: string[];
    notes: string;
  }>;
}

export interface AutocompleteResponse {
  suggestions: Array<{
    title: string;
    reagents: string[];
    timing: string;
    equipment: string[];
    notes: string;
  }>;
  confidence: number;
  reasoning?: string;
}

export interface DetectMissingResponse {
  missing_params: string[];
  suggestions: Record<string, unknown>;
  completeness_score: number;
}

/**
 * Standardize a free-text protocol into structured format
 */
export async function standardizeProtocol(
  text: string,
  context?: Record<string, unknown>
): Promise<StandardizeResponse> {
  try {
    const response = await fetch(`${ML_SERVER_URL}/standardize`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        context,
      }),
    });

    if (!response.ok) {
      throw new Error(`ML Server error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error standardizing protocol:", error);
    throw error;
  }
}

/**
 * Get autocomplete suggestions for next protocol step
 */
export async function autocompleteStep(
  currentSteps: Array<Record<string, unknown>>,
  partialText?: string,
  context?: Record<string, unknown>
): Promise<AutocompleteResponse> {
  try {
    const response = await fetch(`${ML_SERVER_URL}/autocomplete`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        current_steps: currentSteps,
        partial_text: partialText,
        context,
      }),
    });

    if (!response.ok) {
      throw new Error(`ML Server error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error getting autocomplete:", error);
    throw error;
  }
}

/**
 * Detect missing parameters in a protocol
 */
export async function detectMissingParameters(
  protocol: Record<string, unknown>,
  stepIndex?: number
): Promise<DetectMissingResponse> {
  try {
    const response = await fetch(`${ML_SERVER_URL}/detect-missing`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        protocol,
        step_index: stepIndex,
      }),
    });

    if (!response.ok) {
      throw new Error(`ML Server error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error detecting missing parameters:", error);
    throw error;
  }
}

/**
 * Check ML server health
 */
export async function checkMLServerHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${ML_SERVER_URL}/health`);
    return response.ok;
  } catch {
    return false;
  }
}

