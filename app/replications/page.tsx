"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Repeat, CheckCircle, Clock, XCircle, Shield } from "lucide-react";

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

export default function ReplicationsPage() {
  const [replications, setReplications] = useState<Replication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"my-replications" | "of-my-protocols">("of-my-protocols");

  useEffect(() => {
    const fetchReplications = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/replications?filter=${filter}`);
        if (res.ok) {
          const data = await res.json();
          setReplications(data.replications || []);
        }
      } catch (err) {
        console.error("Error fetching replications:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReplications();
  }, [filter]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "verified":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "completed":
        return <CheckCircle className="h-5 w-5 text-blue-600" />;
      case "in-progress":
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case "failed":
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "verified":
        return <Badge variant="success">Verified</Badge>;
      case "completed":
        return <Badge variant="default">Completed</Badge>;
      case "in-progress":
        return <Badge variant="warning">In Progress</Badge>;
      case "failed":
        return <Badge variant="warning">Failed</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Replications</h1>
        <p className="text-gray-600 mt-1">Track experiment replications and verifications</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setFilter("of-my-protocols")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            filter === "of-my-protocols"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          Replications of My Protocols
        </button>
        <button
          onClick={() => setFilter("my-replications")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            filter === "my-replications"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          My Replications
        </button>
      </div>

      {/* Replications List */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-gray-600">Loading replications...</p>
        </div>
      ) : replications.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Repeat className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">
              {filter === "of-my-protocols"
                ? "No one has replicated your protocols yet"
                : "You haven't started any replications yet"}
            </p>
            {filter === "my-replications" && (
              <Link href="/protocols">
                <Button variant="outline">Browse Protocols to Replicate</Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {replications.map((replication) => (
            <Link key={replication.id} href={`/replications/${replication.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1">
                      {getStatusIcon(replication.status)}
                      <div className="flex-1">
                        <CardTitle>{replication.protocolTitle}</CardTitle>
                        <CardDescription>
                          {filter === "of-my-protocols" ? (
                            <>
                              Replicated by {replication.replicatorName} • {replication.replicatorInstitution}
                            </>
                          ) : (
                            <>
                              Started {new Date(replication.startedAt).toLocaleDateString()}
                            </>
                          )}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(replication.status)}
                      {replication.status === "verified" && (
                        <Shield className="h-5 w-5 text-green-600" />
                      )}
                      {replication.verifications.length > 0 && (
                        <Badge variant="secondary">
                          {replication.verifications.length} verification
                          {replication.verifications.length !== 1 ? "s" : ""}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      {replication.results.success !== undefined && (
                        <p className="text-sm text-gray-600">
                          Result:{" "}
                          <span
                            className={
                              replication.results.success
                                ? "text-green-700 font-medium"
                                : "text-red-700 font-medium"
                            }
                          >
                            {replication.results.success ? "Success" : "Failed"}
                          </span>
                        </p>
                      )}
                      {replication.completedAt && (
                        <p className="text-xs text-gray-500 mt-1">
                          Completed: {new Date(replication.completedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    {replication.signature && (
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Shield className="h-4 w-4" />
                        <span>Cryptographically Signed</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
