"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Save, Plus, ArrowLeft, History, Sparkles } from "lucide-react";
import { DraggableStep } from "@/components/protocol/draggable-step";
import { ProtocolStep } from "@/types";
import { autocompleteStep, checkMLServerHealth } from "@/lib/ml-api";

export default function ProtocolBuilderPage() {
  const params = useParams();
  const router = useRouter();
  const protocolId = params?.id as string;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [steps, setSteps] = useState<ProtocolStep[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAutocompleting, setIsAutocompleting] = useState(false);
  const [mlServerAvailable, setMlServerAvailable] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Load protocol
  useEffect(() => {
    if (!protocolId) return;

    const fetchProtocol = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/protocols/${protocolId}`);
        
        if (!res.ok) {
          throw new Error("Failed to fetch protocol");
        }

        const data = await res.json();
        setTitle(data.protocol.title);
        setDescription(data.protocol.description || "");
        setSteps(data.protocol.steps || []);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProtocol();
  }, [protocolId]);

  // Check ML server availability
  useEffect(() => {
    const checkMLServer = async () => {
      const available = await checkMLServerHealth();
      setMlServerAvailable(available);
    };
    checkMLServer();
  }, []);

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setSteps((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        const newItems = arrayMove(items, oldIndex, newIndex);
        
        // Update order numbers
        return newItems.map((item, index) => ({
          ...item,
          order: index + 1,
        }));
      });
    }
  };

  // Add new step
  const handleAddStep = () => {
    const newStep: ProtocolStep = {
      id: `step-${Date.now()}`,
      order: steps.length + 1,
      title: "",
      reagents: [],
      equipment: [],
      notes: "",
    };
    setSteps([...steps, newStep]);
  };

  // AI Autocomplete next step
  const handleAutocompleteStep = async () => {
    if (!mlServerAvailable) {
      setError("ML Server is not available. Please ensure it's running.");
      return;
    }

    try {
      setIsAutocompleting(true);
      setError(null);

      const response = await autocompleteStep(steps);

      if (response.suggestions && response.suggestions.length > 0) {
        const suggestion = response.suggestions[0];
        const newStep: ProtocolStep = {
          id: `step-${Date.now()}`,
          order: steps.length + 1,
          title: suggestion.title || "",
          reagents: suggestion.reagents || [],
          equipment: suggestion.equipment || [],
          timing: suggestion.timing || "",
          notes: suggestion.notes || "",
        };
        setSteps([...steps, newStep]);
      }
    } catch (err) {
      console.error("Autocomplete error:", err);
      setError("Failed to get autocomplete suggestion. Please try again.");
    } finally {
      setIsAutocompleting(false);
    }
  };

  // Update step
  const handleUpdateStep = (updatedStep: ProtocolStep) => {
    setSteps((prevSteps) =>
      prevSteps.map((step) =>
        step.id === updatedStep.id ? updatedStep : step
      )
    );
  };

  // Delete step
  const handleDeleteStep = (stepId: string) => {
    setSteps((prevSteps) => {
      const filtered = prevSteps.filter((step) => step.id !== stepId);
      // Reorder remaining steps
      return filtered.map((step, index) => ({
        ...step,
        order: index + 1,
      }));
    });
  };

  // Save protocol
  const handleSave = useCallback(async (createVersion = false) => {
    if (!protocolId) return;

    try {
      setIsSaving(true);
      const res = await fetch(`/api/protocols/${protocolId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          description,
          steps,
          createVersion,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to save protocol");
      }

      const data = await res.json();
      setSteps(data.protocol.steps);
    } catch (err) {
      console.error("Error saving protocol:", err);
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setIsSaving(false);
    }
  }, [protocolId, title, description, steps]);

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-gray-600">Loading protocol...</p>
        </div>
      </div>
    );
  }

  if (error && !protocolId) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-red-600">Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/protocols")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex-1">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Protocol Title"
              className="text-3xl font-bold text-gray-900 bg-transparent border-none outline-none focus:outline-none w-full"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSave(true)}
            disabled={isSaving}
          >
            <History className="h-4 w-4 mr-2" />
            Create Version
          </Button>
          <Button onClick={() => handleSave(false)} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      {/* Description */}
      <div>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Protocol description..."
          rows={2}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
        />
      </div>

      {/* Steps */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Protocol Steps</h2>
          <div className="flex items-center gap-2">
            {mlServerAvailable && steps.length > 0 && (
              <Button
                onClick={handleAutocompleteStep}
                size="sm"
                variant="outline"
                disabled={isAutocompleting}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                {isAutocompleting ? "AI Thinking..." : "AI Suggest Next Step"}
              </Button>
            )}
            <Button onClick={handleAddStep} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Step
            </Button>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {steps.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-600 mb-4">No steps yet. Add your first step to get started.</p>
              <Button onClick={handleAddStep}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Step
              </Button>
            </CardContent>
          </Card>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={steps.map((step) => step.id)}
              strategy={verticalListSortingStrategy}
            >
              {steps.map((step) => (
                <DraggableStep
                  key={step.id}
                  step={step}
                  onUpdate={handleUpdateStep}
                  onDelete={() => handleDeleteStep(step.id)}
                />
              ))}
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  );
}

