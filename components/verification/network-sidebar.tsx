"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, User, Calendar, CheckCircle, Clock, XCircle } from "lucide-react";

interface Institution {
  id: string;
  name: string;
  abbreviation?: string;
  trustScore: number;
  metadata?: {
    country?: string;
    type?: string;
    website?: string;
    description?: string;
  };
  verificationCount?: number;
  verifiedCount?: number;
}

interface Verification {
  id: string;
  timestamp: Date | string;
  status: "verified" | "pending" | "rejected";
  notes?: string;
  institution?: Institution | null;
  verifier?: {
    id: string;
    name: string;
    email: string;
    institution?: string;
    profileImage?: {
      public_id: string;
      secure_url: string;
    };
  } | null;
}

interface NetworkSidebarProps {
  selectedNode?: Institution | null;
  selectedEdge?: {
    id: string;
    from: string;
    to: string;
    timestamp?: Date | string;
    status?: string;
    verifier?: {
      id: string;
      name: string;
      email: string;
    } | null;
  } | null;
  trustBreakdown?: {
    total: number;
    verified: number;
    pending: number;
    rejected: number;
    averageTrustScore: number;
  } | null;
  lineage?: Verification[];
}

export function NetworkSidebar({
  selectedNode,
  selectedEdge,
  trustBreakdown,
  lineage,
}: NetworkSidebarProps) {
  const formatDate = (date: Date | string) => {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case "verified":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {selectedNode && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Institution Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm font-semibold text-gray-600">Name</div>
              <div className="text-lg font-medium">{selectedNode.name}</div>
              {selectedNode.abbreviation && (
                <div className="text-sm text-gray-500">
                  {selectedNode.abbreviation}
                </div>
              )}
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-600">
                Trust Score
              </div>
              <div className="flex items-center gap-2">
                <div className="text-2xl font-bold">{selectedNode.trustScore}</div>
                <Badge
                  variant={
                    selectedNode.trustScore >= 80
                      ? "success"
                      : selectedNode.trustScore >= 60
                      ? "default"
                      : "warning"
                  }
                >
                  {selectedNode.trustScore >= 80
                    ? "High"
                    : selectedNode.trustScore >= 60
                    ? "Medium"
                    : "Low"}
                </Badge>
              </div>
            </div>
            {selectedNode.metadata && (
              <div className="space-y-2">
                {selectedNode.metadata.country && (
                  <div>
                    <div className="text-sm font-semibold text-gray-600">
                      Country
                    </div>
                    <div className="text-sm">{selectedNode.metadata.country}</div>
                  </div>
                )}
                {selectedNode.metadata.type && (
                  <div>
                    <div className="text-sm font-semibold text-gray-600">
                      Type
                    </div>
                    <div className="text-sm capitalize">
                      {selectedNode.metadata.type.replace("_", " ")}
                    </div>
                  </div>
                )}
                {selectedNode.metadata.website && (
                  <div>
                    <div className="text-sm font-semibold text-gray-600">
                      Website
                    </div>
                    <a
                      href={selectedNode.metadata.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      {selectedNode.metadata.website}
                    </a>
                  </div>
                )}
              </div>
            )}
            {selectedNode.verificationCount !== undefined && (
              <div>
                <div className="text-sm font-semibold text-gray-600">
                  Verifications
                </div>
                <div className="text-sm">
                  {selectedNode.verificationCount} performed,{" "}
                  {selectedNode.verifiedCount} verified
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {selectedEdge && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Verification Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedEdge.verifier && (
              <div>
                <div className="text-sm font-semibold text-gray-600">
                  Verifier
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-400" />
                  <div>
                    <div className="text-sm font-medium">
                      {selectedEdge.verifier.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {selectedEdge.verifier.email}
                    </div>
                  </div>
                </div>
              </div>
            )}
            {selectedEdge.timestamp && (
              <div>
                <div className="text-sm font-semibold text-gray-600">Date</div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  {formatDate(selectedEdge.timestamp)}
                </div>
              </div>
            )}
            {selectedEdge.status && (
              <div>
                <div className="text-sm font-semibold text-gray-600">
                  Status
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(selectedEdge.status)}
                  <span className="text-sm capitalize">
                    {selectedEdge.status}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {trustBreakdown && (
        <Card>
          <CardHeader>
            <CardTitle>Trust Score Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm font-semibold text-gray-600">
                Average Trust Score
              </div>
              <div className="text-2xl font-bold">
                {trustBreakdown.averageTrustScore}
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Total Verifications</span>
                <span className="font-medium">{trustBreakdown.total}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3 text-green-600" />
                  Verified
                </span>
                <span className="font-medium">{trustBreakdown.verified}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3 text-yellow-600" />
                  Pending
                </span>
                <span className="font-medium">{trustBreakdown.pending}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1">
                  <XCircle className="h-3 w-3 text-red-600" />
                  Rejected
                </span>
                <span className="font-medium">{trustBreakdown.rejected}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {lineage && lineage.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Verification Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {lineage.map((verification) => (
                <div
                  key={verification.id}
                  className="border-l-2 border-gray-200 pl-4 pb-3"
                >
                  <div className="flex items-center gap-2 mb-1">
                    {getStatusIcon(verification.status)}
                    <span className="text-sm font-medium">
                      {verification.institution?.name || "Unknown Institution"}
                    </span>
                  </div>
                  {verification.verifier && (
                    <div className="text-xs text-gray-500 mb-1">
                      by {verification.verifier.name}
                    </div>
                  )}
                  <div className="text-xs text-gray-400">
                    {formatDate(verification.timestamp)}
                  </div>
                  {verification.notes && (
                    <div className="text-sm text-gray-600 mt-1">
                      {verification.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {!selectedNode && !selectedEdge && !trustBreakdown && (
        <Card>
          <CardContent className="p-6 text-center text-gray-500">
            <p>Select a node or edge to view details</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

