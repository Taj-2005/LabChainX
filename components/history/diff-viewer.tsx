"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, X } from "lucide-react";

interface DiffViewerProps {
  version1: {
    content: string;
    versionNumber?: number;
    savedAt: string | Date;
  };
  version2: {
    content: string;
    versionNumber?: number;
    savedAt: string | Date;
  };
  onClose: () => void;
}

function computeDiff(text1: string, text2: string): Array<{
  type: "added" | "removed" | "unchanged";
  text: string;
  lineNumber?: number;
}> {
  const lines1 = text1.split("\n");
  const lines2 = text2.split("\n");
  const diff: Array<{
    type: "added" | "removed" | "unchanged";
    text: string;
    lineNumber?: number;
  }> = [];

  let i = 0;
  let j = 0;
  let lineNum = 1;

  while (i < lines1.length || j < lines2.length) {
    if (i >= lines1.length) {
      // Only lines2 remaining
      diff.push({ type: "added", text: lines2[j], lineNumber: lineNum });
      j++;
      lineNum++;
    } else if (j >= lines2.length) {
      // Only lines1 remaining
      diff.push({ type: "removed", text: lines1[i], lineNumber: lineNum });
      i++;
      lineNum++;
    } else if (lines1[i] === lines2[j]) {
      // Lines match
      diff.push({ type: "unchanged", text: lines1[i], lineNumber: lineNum });
      i++;
      j++;
      lineNum++;
    } else {
      // Lines differ - check if line was moved or changed
      const nextMatch1 = lines2.slice(j + 1).indexOf(lines1[i]);
      const nextMatch2 = lines1.slice(i + 1).indexOf(lines2[j]);

      if (nextMatch1 !== -1 && (nextMatch2 === -1 || nextMatch1 < nextMatch2)) {
        // Line from text1 appears later in text2 - it was removed here
        diff.push({ type: "removed", text: lines1[i], lineNumber: lineNum });
        i++;
        lineNum++;
      } else if (nextMatch2 !== -1 && (nextMatch1 === -1 || nextMatch2 < nextMatch1)) {
        // Line from text2 appears later in text1 - it was added here
        diff.push({ type: "added", text: lines2[j], lineNumber: lineNum });
        j++;
        lineNum++;
      } else {
        // Lines are different
        diff.push({ type: "removed", text: lines1[i], lineNumber: lineNum });
        diff.push({ type: "added", text: lines2[j], lineNumber: lineNum + 0.5 });
        i++;
        j++;
        lineNum++;
      }
    }
  }

  return diff;
}

export function DiffViewer({ version1, version2, onClose }: DiffViewerProps) {
  const diff = computeDiff(version1.content, version2.content);

  return (
    <Card className="fixed inset-4 z-50 flex flex-col max-w-7xl mx-auto">
      <CardHeader className="flex-shrink-0 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-normal text-gray-600">Version {version1.versionNumber || "A"}</span>
              <ArrowRight className="h-4 w-4 text-gray-400" />
              <span className="text-sm font-normal text-gray-600">Version {version2.versionNumber || "B"}</span>
            </div>
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
          <span>
            {new Date(version1.savedAt).toLocaleString()} → {new Date(version2.savedAt).toLocaleString()}
          </span>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto p-0">
        <div className="grid grid-cols-2 h-full">
          {/* Version 1 */}
          <div className="border-r border-gray-200 overflow-auto">
            <div className="sticky top-0 bg-gray-50 border-b border-gray-200 px-4 py-2">
              <h3 className="text-sm font-medium text-gray-900">
                Version {version1.versionNumber || "A"}
              </h3>
            </div>
            <div className="p-4 font-mono text-sm">
              {diff.map((item, idx) => {
                if (item.type === "removed" || item.type === "unchanged") {
                  return (
                    <div
                      key={idx}
                      className={`${
                        item.type === "removed"
                          ? "bg-red-50 text-red-900 line-through"
                          : "text-gray-700"
                      } whitespace-pre-wrap`}
                    >
                      {item.text || " "}
                    </div>
                  );
                }
                return null;
              })}
            </div>
          </div>

          {/* Version 2 */}
          <div className="overflow-auto">
            <div className="sticky top-0 bg-gray-50 border-b border-gray-200 px-4 py-2">
              <h3 className="text-sm font-medium text-gray-900">
                Version {version2.versionNumber || "B"}
              </h3>
            </div>
            <div className="p-4 font-mono text-sm">
              {diff.map((item, idx) => {
                if (item.type === "added" || item.type === "unchanged") {
                  return (
                    <div
                      key={idx}
                      className={`${
                        item.type === "added"
                          ? "bg-green-50 text-green-900"
                          : "text-gray-700"
                      } whitespace-pre-wrap`}
                    >
                      {item.text || " "}
                    </div>
                  );
                }
                return null;
              })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

