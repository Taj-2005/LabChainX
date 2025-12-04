"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Plus } from "lucide-react";
import { ProtocolStep } from "@/types";

interface StepEditorProps {
  step: ProtocolStep;
  onUpdate: (step: ProtocolStep) => void;
  onDelete: () => void;
}

export function StepEditor({ step, onUpdate, onDelete }: StepEditorProps) {
  const [localStep, setLocalStep] = useState<ProtocolStep>(step);
  const [newReagent, setNewReagent] = useState("");
  const [newEquipment, setNewEquipment] = useState("");

  useEffect(() => {
    setLocalStep(step);
  }, [step]);

  const handleChange = (field: keyof ProtocolStep, value: string | string[] | undefined) => {
    const updated = { ...localStep, [field]: value };
    setLocalStep(updated);
    onUpdate(updated);
  };

  const addReagent = () => {
    if (newReagent.trim()) {
      const reagents = [...(localStep.reagents || []), newReagent.trim()];
      handleChange("reagents", reagents);
      setNewReagent("");
    }
  };

  const removeReagent = (index: number) => {
    const reagents = localStep.reagents?.filter((_, i) => i !== index) || [];
    handleChange("reagents", reagents);
  };

  const addEquipment = () => {
    if (newEquipment.trim()) {
      const equipment = [...(localStep.equipment || []), newEquipment.trim()];
      handleChange("equipment", equipment);
      setNewEquipment("");
    }
  };

  const removeEquipment = (index: number) => {
    const equipment = localStep.equipment?.filter((_, i) => i !== index) || [];
    handleChange("equipment", equipment);
  };

  return (
    <Card className="mb-4">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg">Step {step.order}</CardTitle>
        <Button variant="ghost" size="icon" onClick={onDelete}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">
            Step Title
          </label>
          <input
            type="text"
            value={localStep.title}
            onChange={(e) => handleChange("title", e.target.value)}
            placeholder="Enter step title"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">
            Reagents
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={newReagent}
              onChange={(e) => setNewReagent(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && addReagent()}
              placeholder="Add reagent"
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            <Button type="button" size="sm" onClick={addReagent}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {localStep.reagents?.map((reagent, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm"
              >
                {reagent}
                <button
                  type="button"
                  onClick={() => removeReagent(index)}
                  className="hover:text-blue-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">
            Timing
          </label>
          <input
            type="text"
            value={localStep.timing || ""}
            onChange={(e) => handleChange("timing", e.target.value)}
            placeholder="e.g., 30 minutes, 2 hours"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">
            Equipment
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={newEquipment}
              onChange={(e) => setNewEquipment(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && addEquipment()}
              placeholder="Add equipment"
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            <Button type="button" size="sm" onClick={addEquipment}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {localStep.equipment?.map((item, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded text-sm"
              >
                {item}
                <button
                  type="button"
                  onClick={() => removeEquipment(index)}
                  className="hover:text-green-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">
            Notes
          </label>
          <textarea
            value={localStep.notes || ""}
            onChange={(e) => handleChange("notes", e.target.value)}
            placeholder="Additional notes for this step"
            rows={3}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
          />
        </div>
      </CardContent>
    </Card>
  );
}

