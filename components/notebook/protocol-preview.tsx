"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, CheckCircle, Clock, FlaskConical, Wrench } from "lucide-react";
import { StandardizeResponse } from "@/lib/ml-api";

interface ProtocolPreviewProps {
  protocol: StandardizeResponse["protocol"] | null;
  confidence: number;
  onClose: () => void;
  onUseProtocol: (protocol: StandardizeResponse["protocol"]) => void;
}

export function ProtocolPreview({
  protocol,
  confidence,
  onClose,
  onUseProtocol,
}: ProtocolPreviewProps) {
  if (!protocol) return null;

  return (
    <Card className="fixed right-6 top-20 w-96 max-h-[calc(100vh-6rem)] overflow-y-auto z-50 shadow-lg">
      <CardHeader className="sticky top-0 bg-white border-b z-10">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">AI Extracted Protocol</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <CheckCircle className="h-3 w-3 text-green-600" />
            {Math.round(confidence * 100)}% confidence
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        <div>
          <h3 className="font-semibold text-gray-900 mb-1">{protocol.title}</h3>
          {protocol.description && (
            <p className="text-sm text-gray-600">{protocol.description}</p>
          )}
        </div>

        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700">Extracted Steps:</h4>
          {protocol.steps.map((step, idx) => (
            <div key={step.id || idx} className="border border-gray-200 rounded-lg p-3 space-y-2">
              <div className="flex items-start gap-2">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-medium flex items-center justify-center">
                  {step.order || idx + 1}
                </span>
                <div className="flex-1">
                  <p className="font-medium text-sm text-gray-900">{step.title}</p>
                </div>
              </div>

              {step.reagents && step.reagents.length > 0 && (
                <div className="flex items-start gap-2 text-xs text-gray-600">
                  <FlaskConical className="h-3 w-3 mt-0.5 text-purple-600" />
                  <div>
                    <span className="font-medium">Reagents:</span> {step.reagents.join(", ")}
                  </div>
                </div>
              )}

              {step.equipment && step.equipment.length > 0 && (
                <div className="flex items-start gap-2 text-xs text-gray-600">
                  <Wrench className="h-3 w-3 mt-0.5 text-blue-600" />
                  <div>
                    <span className="font-medium">Equipment:</span> {step.equipment.join(", ")}
                  </div>
                </div>
              )}

              {step.timing && (
                <div className="flex items-start gap-2 text-xs text-gray-600">
                  <Clock className="h-3 w-3 mt-0.5 text-orange-600" />
                  <div>
                    <span className="font-medium">Timing:</span> {step.timing}
                  </div>
                </div>
              )}

              {step.notes && (
                <p className="text-xs text-gray-500 mt-1">{step.notes}</p>
              )}
            </div>
          ))}
        </div>

        <div className="pt-4 border-t">
          <Button
            onClick={() => onUseProtocol(protocol)}
            className="w-full"
            size="sm"
          >
            Use This Protocol
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

