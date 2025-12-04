"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

interface NotebookData {
  id: string;
  title: string;
  content: string;
  authorId: string;
  collaborators?: string[];
  version: number;
  createdAt: string;
  updatedAt: string;
}

export function useNotebook() {
  const params = useParams();
  const notebookId = params?.id as string;
  const [notebook, setNotebook] = useState<NotebookData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!notebookId) return;

    const fetchNotebook = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/notebooks/${notebookId}`);
        
        if (!res.ok) {
          throw new Error("Failed to fetch notebook");
        }

        const data = await res.json();
        setNotebook(data.notebook);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotebook();
  }, [notebookId]);

  const updateNotebook = async (updates: { title?: string; content?: string; autoSave?: boolean }) => {
    if (!notebookId) return;

    try {
      const res = await fetch(`/api/notebooks/${notebookId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      });

      if (!res.ok) {
        throw new Error("Failed to update notebook");
      }

      const data = await res.json();
      setNotebook(data.notebook);
    } catch (err) {
      console.error("Error updating notebook:", err);
      throw err;
    }
  };

  return {
    notebook,
    isLoading,
    error,
    updateNotebook,
    notebookId,
  };
}

