"use client";

import { PRChange } from "@/models/PullRequest";
import { ProtocolStep } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Minus, Edit } from "lucide-react";

interface DiffViewerProps {
  changes: PRChange[];
  currentSteps: ProtocolStep[];
}

export function DiffViewer({ changes, currentSteps }: DiffViewerProps) {
  const getChangeIcon = (type: PRChange["type"]) => {
    switch (type) {
      case "add":
        return <Plus className="h-4 w-4 text-green-600" />;
      case "delete":
        return <Minus className="h-4 w-4 text-red-600" />;
      case "edit":
        return <Edit className="h-4 w-4 text-blue-600" />;
    }
  };

  const getChangeBadge = (type: PRChange["type"]) => {
    const variants: Record<string, "default" | "success"> = {
      add: "success",
      edit: "default",
      delete: "default",
    };

    return (
      <Badge variant={variants[type] || "default"}>
        {type.toUpperCase()}
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      {changes.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-gray-500">
            No changes to display
          </CardContent>
        </Card>
      ) : (
        changes.map((change, index) => (
          <Card key={index} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                {getChangeIcon(change.type)}
                {getChangeBadge(change.type)}
                <span className="text-sm font-medium">
                  {change.type === "add"
                    ? "New Step"
                    : change.type === "edit"
                    ? `Step ${change.stepId || change.step?.id || "Unknown"}`
                    : `Step ${change.stepId || change.oldStep?.id || "Unknown"}`}
                </span>
              </div>

              {change.type === "add" && change.step && (
                <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
                  <div className="font-semibold mb-2">{change.step.title}</div>
                  {change.step.reagents && change.step.reagents.length > 0 && (
                    <div className="text-sm text-gray-600 mb-1">
                      <strong>Reagents:</strong> {change.step.reagents.join(", ")}
                    </div>
                  )}
                  {change.step.timing && (
                    <div className="text-sm text-gray-600 mb-1">
                      <strong>Timing:</strong> {change.step.timing}
                    </div>
                  )}
                  {change.step.equipment && change.step.equipment.length > 0 && (
                    <div className="text-sm text-gray-600 mb-1">
                      <strong>Equipment:</strong> {change.step.equipment.join(", ")}
                    </div>
                  )}
                  {change.step.notes && (
                    <div className="text-sm text-gray-600">
                      <strong>Notes:</strong> {change.step.notes}
                    </div>
                  )}
                </div>
              )}

              {change.type === "edit" && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                    <div className="text-sm font-semibold mb-2 text-red-700">
                      Before
                    </div>
                    {change.oldStep && (
                      <>
                        <div className="font-semibold mb-2">{change.oldStep.title}</div>
                        {change.oldStep.reagents && change.oldStep.reagents.length > 0 && (
                          <div className="text-sm text-gray-600 mb-1">
                            <strong>Reagents:</strong> {change.oldStep.reagents.join(", ")}
                          </div>
                        )}
                        {change.oldStep.timing && (
                          <div className="text-sm text-gray-600 mb-1">
                            <strong>Timing:</strong> {change.oldStep.timing}
                          </div>
                        )}
                        {change.oldStep.notes && (
                          <div className="text-sm text-gray-600">
                            <strong>Notes:</strong> {change.oldStep.notes}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
                    <div className="text-sm font-semibold mb-2 text-green-700">
                      After
                    </div>
                    {change.step && (
                      <>
                        <div className="font-semibold mb-2">{change.step.title}</div>
                        {change.step.reagents && change.step.reagents.length > 0 && (
                          <div className="text-sm text-gray-600 mb-1">
                            <strong>Reagents:</strong> {change.step.reagents.join(", ")}
                          </div>
                        )}
                        {change.step.timing && (
                          <div className="text-sm text-gray-600 mb-1">
                            <strong>Timing:</strong> {change.step.timing}
                          </div>
                        )}
                        {change.step.notes && (
                          <div className="text-sm text-gray-600">
                            <strong>Notes:</strong> {change.step.notes}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}

              {change.type === "delete" && change.oldStep && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                  <div className="font-semibold mb-2">{change.oldStep.title}</div>
                  {change.oldStep.reagents && change.oldStep.reagents.length > 0 && (
                    <div className="text-sm text-gray-600 mb-1">
                      <strong>Reagents:</strong> {change.oldStep.reagents.join(", ")}
                    </div>
                  )}
                  {change.oldStep.timing && (
                    <div className="text-sm text-gray-600 mb-1">
                      <strong>Timing:</strong> {change.oldStep.timing}
                    </div>
                  )}
                  {change.oldStep.notes && (
                    <div className="text-sm text-gray-600">
                      <strong>Notes:</strong> {change.oldStep.notes}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}

