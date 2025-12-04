/**
 * Utilities for Pull Request operations
 */

import { PRChange } from "@/models/PullRequest";
import { ProtocolStep } from "@/types";

/**
 * Apply PR changes to protocol steps
 */
export function applyPRChanges(
  currentSteps: ProtocolStep[],
  changes: PRChange[]
): ProtocolStep[] {
  // Create a copy to avoid mutating the original
  const newSteps = [...currentSteps];

  // Sort changes by order to maintain consistency
  const sortedChanges = [...changes].sort((a, b) => {
    const aOrder = a.step?.order || a.oldStep?.order || 0;
    const bOrder = b.step?.order || b.oldStep?.order || 0;
    return aOrder - bOrder;
  });

  for (const change of sortedChanges) {
    if (change.type === "add") {
      if (change.step) {
        // Insert at the correct position
        const insertIndex = newSteps.findIndex(
          (s) => s.order >= change.step!.order
        );
        if (insertIndex === -1) {
          newSteps.push(change.step);
        } else {
          newSteps.splice(insertIndex, 0, change.step);
        }
      }
    } else if (change.type === "edit") {
      if (change.stepId && change.step) {
        const stepIndex = newSteps.findIndex((s) => s.id === change.stepId);
        if (stepIndex !== -1) {
          newSteps[stepIndex] = change.step;
        }
      } else if (change.step) {
        // Find by order if no stepId
        const stepIndex = newSteps.findIndex(
          (s) => s.order === change.step.order
        );
        if (stepIndex !== -1) {
          newSteps[stepIndex] = change.step;
        }
      }
    } else if (change.type === "delete") {
      if (change.stepId) {
        const stepIndex = newSteps.findIndex((s) => s.id === change.stepId);
        if (stepIndex !== -1) {
          newSteps.splice(stepIndex, 1);
        }
      } else if (change.oldStep) {
        const stepIndex = newSteps.findIndex(
          (s) => s.id === change.oldStep!.id
        );
        if (stepIndex !== -1) {
          newSteps.splice(stepIndex, 1);
        }
      }
    }
  }

  // Reorder steps to ensure sequential ordering
  return newSteps.map((step, index) => ({
    ...step,
    order: index + 1,
  }));
}

/**
 * Compute diff between two step arrays
 */
export function computeStepDiff(
  oldSteps: ProtocolStep[],
  newSteps: ProtocolStep[]
): PRChange[] {
  const changes: PRChange[] = [];
  const oldStepsMap = new Map(oldSteps.map((s) => [s.id, s]));
  const newStepsMap = new Map(newSteps.map((s) => [s.id, s]));

  // Find deleted steps
  for (const oldStep of oldSteps) {
    if (!newStepsMap.has(oldStep.id)) {
      changes.push({
        type: "delete",
        stepId: oldStep.id,
        oldStep,
      });
    }
  }

  // Find added and modified steps
  for (const newStep of newSteps) {
    const oldStep = oldStepsMap.get(newStep.id);
    if (!oldStep) {
      changes.push({
        type: "add",
        step: newStep,
      });
    } else {
      // Check if step was modified
      const isModified =
        oldStep.title !== newStep.title ||
        JSON.stringify(oldStep.reagents || []) !==
          JSON.stringify(newStep.reagents || []) ||
        oldStep.timing !== newStep.timing ||
        JSON.stringify(oldStep.equipment || []) !==
          JSON.stringify(newStep.equipment || []) ||
        oldStep.notes !== newStep.notes ||
        oldStep.order !== newStep.order;

      if (isModified) {
        changes.push({
          type: "edit",
          stepId: newStep.id,
          step: newStep,
          oldStep,
        });
      }
    }
  }

  return changes;
}

