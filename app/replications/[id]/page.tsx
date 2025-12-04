"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  CheckCircle,
  Shield,
  Verified,
  Copy,
  Check,
} from "lucide-react";

interface Replication {
  id: string;
  protocolId: string;
  protocolTitle: string;
  replicatorId: string;
  replicatorName: string;
  replicatorInstitution: string;
  status: "pending" | "in-progress" | "completed" | "verified" | "failed";
  results: {
    success: boolean;
    data?: Record<string, unknown>;
    observations?: string;
    notes?: string;
  };
  verifications: Array<{
    verifiedBy: string;
    verifiedAt: string;
    institution: string;
    signature: string;
    notes?: string;
  }>;
  startedAt: string;
  completedAt?: string;
  signedAt?: string;
  signature?: string;
}

export default function ReplicationDetailPage() {
  const params = useParams();
  const replicationId = params?.id as string;

  const [replication, setReplication] = useState<Replication | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedSignature, setCopiedSignature] = useState(false);

  useEffect(() => {
    if (!replicationId) return;

    const fetchReplication = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/replications/${replicationId}`);
        
        if (!res.ok) {
          throw new Error("Failed to fetch replication");
        }

        const data = await res.json();
        setReplication(data.replication);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    fetchReplication();
  }, [replicationId]);

  const copySignature = () => {
    if (replication?.signature) {
      navigator.clipboard.writeText(replication.signature);
      setCopiedSignature(true);
      setTimeout(() => setCopiedSignature(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-gray-600">Loading replication details...</p>
        </div>
      </div>
    );
  }

  if (error || !replication) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-red-600">Error: {error || "Replication not found"}</p>
          <Link href="/replications">
            <Button variant="outline" className="mt-4">
              Back to Replications
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/replications">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{replication.protocolTitle}</h1>
            <p className="text-gray-600 mt-1">
              Replicated by {replication.replicatorName} • {replication.replicatorInstitution}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {replication.status === "verified" && (
            <Verified className="h-6 w-6 text-green-600" />
          )}
          <Badge
            variant={
              replication.status === "verified"
                ? "success"
                : replication.status === "completed"
                ? "default"
                : replication.status === "failed"
                ? "warning"
                : "secondary"
            }
          >
            {replication.status.charAt(0).toUpperCase() + replication.status.slice(1)}
          </Badge>
        </div>
      </div>

      {/* Status Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Timeline</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-sm font-medium">Started</p>
              <p className="text-xs text-gray-500">
                {new Date(replication.startedAt).toLocaleString()}
              </p>
            </div>
          </div>
          {replication.completedAt && (
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium">Completed</p>
                <p className="text-xs text-gray-500">
                  {new Date(replication.completedAt).toLocaleString()}
                </p>
              </div>
            </div>
          )}
          {replication.signedAt && (
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium">Cryptographically Signed</p>
                <p className="text-xs text-gray-500">
                  {new Date(replication.signedAt).toLocaleString()}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader>
          <CardTitle>Results</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium text-gray-700 mb-1">Status</p>
            <Badge
              variant={replication.results.success ? "success" : "warning"}
            >
              {replication.results.success ? "Success" : "Failed"}
            </Badge>
          </div>
          {replication.results.observations && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">Observations</p>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">
                {replication.results.observations}
              </p>
            </div>
          )}
          {replication.results.notes && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">Notes</p>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">
                {replication.results.notes}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cryptographic Signature */}
      {replication.signature && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Cryptographic Signature
            </CardTitle>
            <CardDescription>
              ECDSA signature for data integrity verification
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 rounded-lg p-4 font-mono text-xs break-all relative">
              {replication.signature}
              <button
                onClick={copySignature}
                className="absolute top-2 right-2 p-2 hover:bg-gray-200 rounded"
                title="Copy signature"
              >
                {copiedSignature ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4 text-gray-500" />
                )}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              This signature verifies the integrity of the replication results.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Verifications */}
      {replication.verifications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Verified className="h-5 w-5" />
              Institution Verifications ({replication.verifications.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {replication.verifications.map((verification, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg p-4 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{verification.institution}</p>
                    <p className="text-xs text-gray-500">
                      Verified {new Date(verification.verifiedAt).toLocaleString()}
                    </p>
                  </div>
                  <Shield className="h-5 w-5 text-green-600" />
                </div>
                {verification.notes && (
                  <p className="text-sm text-gray-600">{verification.notes}</p>
                )}
                <div className="bg-gray-50 rounded p-2 font-mono text-xs break-all">
                  <p className="text-xs text-gray-500 mb-1">Institution Signature:</p>
                  {verification.signature.substring(0, 64)}...
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <Link href={`/protocols/${replication.protocolId}`}>
          <Button variant="outline">View Original Protocol</Button>
        </Link>
      </div>
    </div>
  );
}

