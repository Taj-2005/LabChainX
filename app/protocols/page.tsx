"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, ClipboardList } from "lucide-react";

interface Protocol {
  id: string;
  title: string;
  description?: string;
  steps: Array<{ id: string; title: string }>;
  authorId: string;
  version: number;
  status: "draft" | "published" | "archived";
  createdAt: string;
  updatedAt: string;
}

export default function ProtocolsPage() {
  const router = useRouter();
  const [protocols, setProtocols] = useState<Protocol[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProtocols = async () => {
      try {
        const res = await fetch("/api/protocols");
        if (res.ok) {
          const data = await res.json();
          setProtocols(data.protocols || []);
        }
      } catch (err) {
        console.error("Error fetching protocols:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProtocols();
  }, []);

  const handleNewProtocol = async () => {
    try {
      const res = await fetch("/api/protocols", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: "Untitled Protocol",
          description: "",
          steps: [],
        }),
      });

      if (res.ok) {
        const data = await res.json();
        router.push(`/protocols/${data.protocol.id}`);
      }
    } catch (err) {
      console.error("Error creating protocol:", err);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Protocols</h1>
          <p className="text-gray-600 mt-1">Build and manage your experimental protocols</p>
        </div>
        <Button onClick={handleNewProtocol}>
          <Plus className="h-4 w-4 mr-2" />
          New Protocol
        </Button>
      </div>

      {/* Protocols Grid */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-gray-600">Loading protocols...</p>
        </div>
      ) : protocols.length === 0 ? (
        <div className="text-center py-12">
          <ClipboardList className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">No protocols yet</p>
          <Button onClick={handleNewProtocol}>
            <Plus className="h-4 w-4 mr-2" />
            Create your first protocol
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {protocols.map((protocol) => (
            <Link key={protocol.id} href={`/protocols/${protocol.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <ClipboardList className="h-5 w-5 text-blue-600" />
                      <CardTitle>{protocol.title}</CardTitle>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                      v{protocol.version}
                    </span>
                  </div>
                  <CardDescription>
                    Status: <span className="capitalize">{protocol.status}</span> • {protocol.steps.length} step{protocol.steps.length !== 1 ? "s" : ""}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {protocol.description || "No description provided..."}
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
