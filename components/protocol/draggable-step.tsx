"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { StepEditor } from "./step-editor";
import { ProtocolStep } from "@/types";

interface DraggableStepProps {
  step: ProtocolStep;
  onUpdate: (step: ProtocolStep) => void;
  onDelete: () => void;
}

export function DraggableStep({ step, onUpdate, onDelete }: DraggableStepProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: step.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <div className="relative">
        <div
          {...attributes}
          {...listeners}
          className="absolute left-0 top-6 cursor-grab active:cursor-grabbing z-10 p-2 hover:bg-gray-100 rounded"
        >
          <GripVertical className="h-5 w-5 text-gray-400" />
        </div>
        <div className="pl-10">
          <StepEditor step={step} onUpdate={onUpdate} onDelete={onDelete} />
        </div>
      </div>
    </div>
  );
}

