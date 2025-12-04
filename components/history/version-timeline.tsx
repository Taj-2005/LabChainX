"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, User, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

interface Version {
  versionNumber?: number;
  savedAt: string | Date;
  savedBy: string;
  content?: string;
  title?: string;
  description?: string;
  steps?: unknown[];
}

interface VersionTimelineProps {
  versions: Version[];
  currentVersion?: number;
  type?: "notebook" | "protocol";
}

function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleString();
}

function getVersionPreview(version: Version, type: "notebook" | "protocol"): string {
  if (type === "notebook" && version.content) {
    const preview = version.content.substring(0, 100).replace(/\n/g, " ");
    return preview.length < 100 ? preview : `${preview}...`;
  }
  if (type === "protocol" && version.title) {
    return version.title;
  }
  return "No preview available";
}

export function VersionTimeline({ versions, currentVersion, type = "notebook" }: VersionTimelineProps) {
  const [expandedVersion, setExpandedVersion] = useState<number | null>(null);

  if (!versions || versions.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-gray-500">
          No version history available
        </CardContent>
      </Card>
    );
  }

  // Sort versions by date (newest first)
  const sortedVersions = [...versions].sort((a, b) => {
    const dateA = new Date(a.savedAt).getTime();
    const dateB = new Date(b.savedAt).getTime();
    return dateB - dateA;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Version History ({versions.length} version{versions.length !== 1 ? "s" : ""})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sortedVersions.map((version, index) => {
            const versionNum = version.versionNumber || versions.length - index;
            const isCurrent = versionNum === currentVersion;
            const isExpanded = expandedVersion === index;
            const preview = getVersionPreview(version, type);

            return (
              <div
                key={index}
                className={`relative pl-8 pb-4 border-l-2 ${
                  isCurrent ? "border-blue-500" : "border-gray-200"
                }`}
              >
                {/* Timeline dot */}
                <div
                  className={`absolute -left-2 top-1 h-4 w-4 rounded-full border-2 ${
                    isCurrent
                      ? "bg-blue-500 border-blue-500"
                      : "bg-white border-gray-300"
                  }`}
                />

                {/* Version header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">
                        Version {versionNum}
                        {isCurrent && (
                          <span className="ml-2 text-xs text-blue-600 font-normal">
                            (Current)
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(version.savedAt)}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {version.savedBy || "Unknown"}
                      </span>
                    </div>
                    {preview && (
                      <p className="text-sm text-gray-600 mt-2 line-clamp-2">{preview}</p>
                    )}
                  </div>
                  {version.content && (
                    <button
                      onClick={() =>
                        setExpandedVersion(isExpanded ? null : index)
                      }
                      className="ml-4 p-1 hover:bg-gray-100 rounded"
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-gray-500" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-gray-500" />
                      )}
                    </button>
                  )}
                </div>

                {/* Expanded content */}
                {isExpanded && version.content && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <pre className="text-xs font-mono whitespace-pre-wrap text-gray-700 max-h-64 overflow-auto">
                      {version.content}
                    </pre>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

