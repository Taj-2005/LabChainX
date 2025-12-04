"use client";

import { useEffect, useRef, useState } from "react";
import { Network } from "vis-network";
import { Card, CardContent } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/loading";

interface NetworkNode {
  id: string;
  label: string;
  type: "institution" | "subject";
  trustScore?: number;
  metadata?: {
    country?: string;
    type?: string;
    website?: string;
  };
}

interface NetworkEdge {
  id: string;
  from: string;
  to: string;
  label?: string;
  timestamp?: Date | string;
  status?: string;
  verifier?: {
    id: string;
    name: string;
    email: string;
  };
}

interface NetworkGraphProps {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  onNodeClick?: (nodeId: string) => void;
  onEdgeClick?: (edgeId: string) => void;
}

export function NetworkGraph({
  nodes,
  edges,
  onNodeClick,
  onEdgeClick,
}: NetworkGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const networkRef = useRef<Network | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!containerRef.current || nodes.length === 0) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    // Prepare vis-network data
    const visNodes = nodes.map((node) => ({
      id: node.id,
      label: node.label,
      color: {
        background: getNodeColor(node.trustScore || 50),
        border: getNodeBorderColor(node.trustScore || 50),
      },
      size: getNodeSize(node.trustScore || 50),
      shape: node.type === "institution" ? "box" : "ellipse",
      title: `${node.label}\nTrust Score: ${node.trustScore || 50}`,
    }));

    const visEdges = edges.map((edge) => ({
      id: edge.id,
      from: edge.from,
      to: edge.to,
      label: edge.label || "",
      arrows: "to",
      color: {
        color: edge.status === "verified" ? "#10b981" : "#f59e0b",
        highlight: "#3b82f6",
      },
      title: edge.verifier
        ? `${edge.verifier.name}\n${new Date(edge.timestamp || "").toLocaleDateString()}`
        : new Date(edge.timestamp || "").toLocaleDateString(),
    }));

    const data = {
      nodes: visNodes,
      edges: visEdges,
    };

    const options = {
      nodes: {
        borderWidth: 2,
        font: {
          size: 14,
          color: "#333",
        },
      },
      edges: {
        width: 2,
        font: {
          size: 12,
          align: "middle",
        },
        smooth: {
          type: "continuous",
        },
      },
      physics: {
        enabled: true,
        stabilization: {
          iterations: 200,
        },
      },
      interaction: {
        hover: true,
        tooltipDelay: 300,
        zoomView: true,
        dragView: true,
      },
    };

    const network = new Network(containerRef.current, data, options);

    // Event handlers
    network.on("click", (params) => {
      if (params.nodes.length > 0) {
        onNodeClick?.(params.nodes[0] as string);
      }
      if (params.edges.length > 0) {
        onEdgeClick?.(params.edges[0] as string);
      }
    });

    networkRef.current = network;
    setIsLoading(false);

    return () => {
      if (networkRef.current) {
        networkRef.current.destroy();
        networkRef.current = null;
      }
    };
  }, [nodes, edges, onNodeClick, onEdgeClick]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-64">
            <LoadingSpinner />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (nodes.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-64 text-gray-500">
            <p>No network data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div
          ref={containerRef}
          style={{ width: "100%", height: "600px", minHeight: "400px" }}
        />
      </CardContent>
    </Card>
  );
}

function getNodeColor(trustScore: number): string {
  if (trustScore >= 80) return "#10b981"; // green
  if (trustScore >= 60) return "#3b82f6"; // blue
  if (trustScore >= 40) return "#f59e0b"; // yellow
  return "#ef4444"; // red
}

function getNodeBorderColor(trustScore: number): string {
  if (trustScore >= 80) return "#059669";
  if (trustScore >= 60) return "#2563eb";
  if (trustScore >= 40) return "#d97706";
  return "#dc2626";
}

function getNodeSize(trustScore: number): number {
  // Scale size based on trust score (20-40 range)
  return 20 + (trustScore / 100) * 20;
}

