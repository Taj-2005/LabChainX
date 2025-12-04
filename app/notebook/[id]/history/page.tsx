"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { VersionTimeline } from "@/components/history/version-timeline";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { LoadingSpinner } from "@/components/loading";

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

  // Include current version in history
  const allVersions = [
    {
      versionNumber: notebook.version,
      content: notebook.content,
      savedAt: new Date().toISOString(),
      savedBy: "Current",
    },
    ...(notebook.versions || []).map((v) => ({
      versionNumber: undefined,
      content: v.content,
      savedAt: v.savedAt,
      savedBy: v.savedBy,
    })),
  ];

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

      <VersionTimeline
        versions={allVersions}
        currentVersion={notebook.version}
        type="notebook"
      />
    </div>
  );
}

