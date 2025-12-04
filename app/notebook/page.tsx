"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, BookOpen } from "lucide-react";

interface Notebook {
  id: string;
  title: string;
  content: string;
  authorId: string;
  collaborators?: string[];
  version: number;
  createdAt: string;
  updatedAt: string;
}

export default function NotebookPage() {
  const router = useRouter();
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchNotebooks = async () => {
      try {
        const res = await fetch("/api/notebooks");
        if (res.ok) {
          const data = await res.json();
          setNotebooks(data.notebooks || []);
        }
      } catch (err) {
        console.error("Error fetching notebooks:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotebooks();
  }, []);

  const handleNewNotebook = async () => {
    try {
      const res = await fetch("/api/notebooks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: "Untitled Notebook",
          content: "",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        router.push(`/notebook/${data.notebook.id}`);
      }
    } catch (err) {
      console.error("Error creating notebook:", err);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Lab Notebook</h1>
          <p className="text-gray-600 mt-1">Your collaborative research notebooks</p>
        </div>
        <Button onClick={handleNewNotebook}>
          <Plus className="h-4 w-4 mr-2" />
          New Notebook
        </Button>
      </div>

      {/* Notebooks Grid */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-gray-600">Loading notebooks...</p>
        </div>
      ) : notebooks.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">No notebooks yet</p>
          <Button onClick={handleNewNotebook}>
            <Plus className="h-4 w-4 mr-2" />
            Create your first notebook
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {notebooks.map((notebook) => (
            <Link key={notebook.id} href={`/notebook/${notebook.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <BookOpen className="h-5 w-5 text-blue-600" />
                    <CardTitle>{notebook.title}</CardTitle>
                  </div>
                  <CardDescription>
                    Last updated {new Date(notebook.updatedAt).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {notebook.content || "No content yet..."}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
