"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, GitBranch, Plus, MessageSquare, CheckCircle, XCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import { LoadingSpinner } from "@/components/loading";

interface PRAuthor {
  id: string;
  name: string;
  email: string;
  institution?: string;
  profileImage?: {
    public_id: string;
    secure_url: string;
  };
}

interface PRReviewer {
  userId: string;
  status: "pending" | "approved" | "changes_requested";
  reviewedAt?: Date;
  user: PRAuthor | null;
}

interface PullRequest {
  id: string;
  protocolId: string;
  protocolTitle: string;
  authorId: string;
  author: PRAuthor | null;
  branch: string;
  title: string;
  description?: string;
  status: "open" | "changes_requested" | "approved" | "merged" | "closed";
  changes: unknown[];
  reviewers: PRReviewer[];
  commentsCount: number;
  mergedBy?: string;
  mergedAt?: Date;
  createdAt: string;
  updatedAt: string;
}

export default function PullRequestsPage() {
  const params = useParams();
  const router = useRouter();
  const protocolId = params?.id as string;

  const [prs, setPrs] = useState<PullRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (protocolId) {
      loadPullRequests();
    }
  }, [protocolId]);

  const loadPullRequests = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/pr?protocolId=${protocolId}`);
      
      if (!res.ok) {
        throw new Error("Failed to load pull requests");
      }

      const data = await res.json();
      setPrs(data.pullRequests || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load pull requests";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: PullRequest["status"]) => {
    const variants: Record<string, "default" | "success" | "warning"> = {
      open: "default",
      approved: "success",
      merged: "success",
      changes_requested: "warning",
      closed: "default",
    };

    return (
      <Badge variant={variants[status] || "default"}>
        {status.replace("_", " ").toUpperCase()}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-red-600">{error}</p>
            <Button onClick={loadPullRequests} className="mt-4">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => router.push(`/protocols/${protocolId}`)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Protocol
          </Button>
          <h1 className="text-3xl font-bold">Pull Requests</h1>
        </div>
        <Button
          onClick={() => router.push(`/protocols/${protocolId}/pull-requests/new`)}
        >
          <Plus className="h-4 w-4 mr-2" />
          New Pull Request
        </Button>
      </div>

      {prs.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <GitBranch className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No pull requests yet</h3>
            <p className="text-gray-500 mb-4">
              Create your first pull request to propose changes to this protocol.
            </p>
            <Button
              onClick={() => router.push(`/protocols/${protocolId}/pull-requests/new`)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Pull Request
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {prs.map((pr) => (
            <Card key={pr.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Link
                        href={`/pr/${pr.id}`}
                        className="text-xl font-semibold hover:text-blue-600"
                      >
                        {pr.title}
                      </Link>
                      {getStatusBadge(pr.status)}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {pr.description || "No description"}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>
                        by {pr.author?.name || "Unknown"} • {formatDate(pr.createdAt)}
                      </span>
                      <span className="flex items-center gap-1">
                        <GitBranch className="h-3 w-3" />
                        {pr.branch}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        {pr.commentsCount} comments
                      </span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {pr.reviewers.map((reviewer) => (
                      <div
                        key={reviewer.userId}
                        className="flex items-center gap-1 text-sm"
                        title={reviewer.user?.name || "Unknown"}
                      >
                        {reviewer.status === "approved" ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : reviewer.status === "changes_requested" ? (
                          <XCircle className="h-4 w-4 text-yellow-600" />
                        ) : (
                          <Clock className="h-4 w-4 text-gray-400" />
                        )}
                      </div>
                    ))}
                    {pr.reviewers.length === 0 && (
                      <span className="text-sm text-gray-400">No reviewers assigned</span>
                    )}
                  </div>
                  <Link href={`/pr/${pr.id}`}>
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

