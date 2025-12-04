"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DiffViewer } from "@/components/pr/diff-viewer";
import { PRComments } from "@/components/pr/pr-comments";
import {
  ArrowLeft,
  GitMerge,
  CheckCircle,
  XCircle,
  MessageSquare,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { LoadingSpinner } from "@/components/loading";
import { ProtocolStep } from "@/types";
import { PRChange } from "@/models/PullRequest";

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

interface PRComment {
  id?: string;
  authorId: string;
  author: PRAuthor | null;
  text: string;
  path?: string;
  createdAt: Date;
}

interface PullRequest {
  id: string;
  protocolId: string;
  protocol: {
    id: string;
    title: string;
    steps: ProtocolStep[];
    currentBranch: string;
  } | null;
  authorId: string;
  author: PRAuthor | null;
  branch: string;
  title: string;
  description?: string;
  status: "open" | "changes_requested" | "approved" | "merged" | "closed";
  changes: PRChange[];
  reviewers: PRReviewer[];
  comments: PRComment[];
  mergedBy?: string;
  mergedByUser?: PRAuthor | null;
  mergedAt?: Date;
  createdAt: string;
  updatedAt: string;
}

export default function PullRequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const prId = params?.prId as string;

  const [pr, setPr] = useState<PullRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMerging, setIsMerging] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (prId) {
      loadPullRequest();
    }
  }, [prId]);

  const loadPullRequest = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/pr/${prId}`);
      
      if (!res.ok) {
        throw new Error("Failed to load pull request");
      }

      const data = await res.json();
      setPr(data.pullRequest);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load pull request";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReview = async (status: "approved" | "changes_requested") => {
    try {
      setIsReviewing(true);
      const res = await fetch(`/api/pr/${prId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to submit review");
      }

      toast.success(`Review ${status} successfully`);
      loadPullRequest();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to submit review";
      toast.error(errorMessage);
    } finally {
      setIsReviewing(false);
    }
  };

  const handleMerge = async () => {
    if (!confirm("Are you sure you want to merge this pull request?")) {
      return;
    }

    try {
      setIsMerging(true);
      const res = await fetch(`/api/pr/${prId}/merge`, {
        method: "POST",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to merge pull request");
      }

      toast.success("Pull request merged successfully!");
      loadPullRequest();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to merge pull request";
      toast.error(errorMessage);
    } finally {
      setIsMerging(false);
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

  const formatDate = (dateString: string | Date) => {
    const date = typeof dateString === "string" ? new Date(dateString) : dateString;
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !pr) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-red-600">{error || "Pull request not found"}</p>
            <Button onClick={() => router.back()} className="mt-4">
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const canMerge = pr.status === "open" || pr.status === "approved";
  const canReview = pr.status === "open" || pr.status === "changes_requested";

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-3xl font-bold">{pr.title}</h1>
        {getStatusBadge(pr.status)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 whitespace-pre-wrap">
                {pr.description || "No description provided"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Changes</CardTitle>
            </CardHeader>
            <CardContent>
              <DiffViewer
                changes={pr.changes}
                currentSteps={pr.protocol?.steps || []}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Comments ({pr.comments.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PRComments
                prId={prId}
                comments={pr.comments}
                onCommentAdded={loadPullRequest}
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm font-semibold text-gray-600">Author</div>
                <div className="text-sm">{pr.author?.name || "Unknown"}</div>
                {pr.author?.institution && (
                  <div className="text-xs text-gray-500">{pr.author.institution}</div>
                )}
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-600">Branch</div>
                <div className="text-sm font-mono">{pr.branch}</div>
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-600">Created</div>
                <div className="text-sm">{formatDate(pr.createdAt)}</div>
              </div>
              {pr.mergedAt && (
                <div>
                  <div className="text-sm font-semibold text-gray-600">Merged</div>
                  <div className="text-sm">{formatDate(pr.mergedAt)}</div>
                  {pr.mergedByUser && (
                    <div className="text-xs text-gray-500">by {pr.mergedByUser.name}</div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Reviewers</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {pr.reviewers.length === 0 ? (
                <p className="text-sm text-gray-500">No reviewers assigned</p>
              ) : (
                pr.reviewers.map((reviewer) => (
                  <div key={reviewer.userId} className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium">
                        {reviewer.user?.name || "Unknown"}
                      </div>
                      {reviewer.reviewedAt && (
                        <div className="text-xs text-gray-500">
                          {formatDate(reviewer.reviewedAt)}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {reviewer.status === "approved" ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : reviewer.status === "changes_requested" ? (
                        <XCircle className="h-5 w-5 text-yellow-600" />
                      ) : (
                        <Clock className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {canReview && (
            <Card>
              <CardHeader>
                <CardTitle>Review Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  onClick={() => handleReview("approved")}
                  disabled={isReviewing}
                  className="w-full"
                  variant="outline"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve
                </Button>
                <Button
                  onClick={() => handleReview("changes_requested")}
                  disabled={isReviewing}
                  className="w-full"
                  variant="outline"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Request Changes
                </Button>
              </CardContent>
            </Card>
          )}

          {canMerge && (
            <Card>
              <CardHeader>
                <CardTitle>Merge</CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={handleMerge}
                  disabled={isMerging}
                  className="w-full"
                >
                  <GitMerge className="h-4 w-4 mr-2" />
                  {isMerging ? "Merging..." : "Merge Pull Request"}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

