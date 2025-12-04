"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { VersionTimeline } from "@/components/history/version-timeline";
import { DiffViewer } from "@/components/history/diff-viewer";
import { Button } from "@/components/ui/button";
import { ArrowLeft, GitCompare } from "lucide-react";
import { LoadingSpinner } from "@/components/loading";
import { toast } from "sonner";

interface NotebookVersion {
  content: string;
  savedAt: string;
  savedBy: string;
}

interface Notebook {
  id: string;
  title: string;
  content: string;
  version: number;
  versions: NotebookVersion[];
}

export default function NotebookHistoryPage() {
  const params = useParams();
  const router = useRouter();
  const notebookId = params?.id as string;
  const [notebook, setNotebook] = useState<Notebook | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVersions, setSelectedVersions] = useState<[number | null, number | null]>([null, null]);
  const [diffData, setDiffData] = useState<{
    version1: { content: string; versionNumber?: number; savedAt: string | Date };
    version2: { content: string; versionNumber?: number; savedAt: string | Date };
  } | null>(null);
  const [isLoadingDiff, setIsLoadingDiff] = useState(false);

  useEffect(() => {
    const fetchNotebook = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/notebooks/${notebookId}`);
        if (res.ok) {
          const data = await res.json();
          setNotebook(data.notebook);
        }
      } catch (error) {
        console.error("Error fetching notebook:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (notebookId) {
      fetchNotebook();
    }
  }, [notebookId]);

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <LoadingSpinner size="sm" />
          <p className="text-gray-600 mt-4">Loading version history...</p>
        </div>
      </div>
    );
  }

  if (!notebook) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-red-600">Notebook not found</p>
        </div>
      </div>
    );
  }

  // Include current version in history (oldest first for proper timeline)
  const allVersions = [
    ...(notebook.versions || []).map((v, idx) => ({
      versionNumber: notebook.version - (notebook.versions.length - idx),
      content: v.content,
      savedAt: v.savedAt,
      savedBy: v.savedBy,
    })),
    {
      versionNumber: notebook.version,
      content: notebook.content,
      savedAt: new Date().toISOString(),
      savedBy: "Current",
    },
  ];

  const handleVersionSelect = (index: number) => {
    if (selectedVersions[0] === null) {
      setSelectedVersions([index, null]);
    } else if (selectedVersions[1] === null) {
      if (selectedVersions[0] === index) {
        setSelectedVersions([null, null]);
      } else {
        setSelectedVersions([selectedVersions[0], index]);
      }
    } else {
      setSelectedVersions([index, null]);
    }
  };

  const handleCompare = async () => {
    if (selectedVersions[0] === null || selectedVersions[1] === null) {
      toast.error("Please select two versions to compare");
      return;
    }

    try {
      setIsLoadingDiff(true);
      const res = await fetch("/api/version/compare", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          resourceId: notebookId,
          resourceType: "notebook",
          version1Index: selectedVersions[0],
          version2Index: selectedVersions[1],
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setDiffData(data);
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to compare versions");
      }
    } catch (error) {
      console.error("Error comparing versions:", error);
      toast.error("Failed to compare versions");
    } finally {
      setIsLoadingDiff(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push(`/notebook/${notebookId}`)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Notebook
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{notebook.title}</h1>
          <p className="text-gray-600 mt-1">Version History</p>
        </div>
      </div>

      {/* Compare Controls */}
      {selectedVersions[0] !== null && (
        <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex-1">
            <p className="text-sm text-gray-700">
              {selectedVersions[1] === null
                ? `Version ${allVersions[selectedVersions[0]]?.versionNumber || selectedVersions[0] + 1} selected`
                : `Comparing Version ${allVersions[selectedVersions[0]]?.versionNumber || selectedVersions[0] + 1} with Version ${allVersions[selectedVersions[1]]?.versionNumber || selectedVersions[1] + 1}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {selectedVersions[1] !== null && (
              <Button
                onClick={handleCompare}
                disabled={isLoadingDiff}
                size="sm"
              >
                <GitCompare className="h-4 w-4 mr-2" />
                {isLoadingDiff ? "Loading..." : "Compare"}
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedVersions([null, null])}
            >
              Clear
            </Button>
          </div>
        </div>
      )}

      <VersionTimeline
        versions={allVersions}
        currentVersion={notebook.version}
        type="notebook"
        onVersionSelect={handleVersionSelect}
        selectedVersions={selectedVersions}
      />

      {/* Diff Viewer Modal */}
      {diffData && (
        <DiffViewer
          version1={diffData.version1}
          version2={diffData.version2}
          onClose={() => {
            setDiffData(null);
            setSelectedVersions([null, null]);
          }}
        />
      )}
    </div>
  );
}

