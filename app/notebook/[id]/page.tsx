"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";

export default function NotebookDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const [content, setContent] = useState("");

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Notebook #{params.id}</h1>
        <p className="text-gray-600 mt-1">Real-time collaborative editing</p>
      </div>

      <Card>
        <CardContent className="p-6">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Start writing your lab notes here... Voice-to-text coming soon!"
            className="w-full h-[600px] resize-none border-none outline-none text-sm font-mono text-gray-700 leading-relaxed"
          />
        </CardContent>
      </Card>
    </div>
  );
}

