"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DiffViewer } from "@/components/pr/diff-viewer";
import { ArrowLeft, GitBranch, Save, Plus } from "lucide-react";
import { toast } from "sonner";
import { LoadingSpinner } from "@/components/loading";
import { ProtocolStep } from "@/types";
import { PRChange } from "@/models/PullRequest";
import { computeStepDiff } from "@/lib/pr-utils";

export default function CreatePullRequestPage() {
  const params = useParams();
  const router = useRouter();
  const protocolId = params?.id as string;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [branch, setBranch] = useState("");
  const [currentSteps, setCurrentSteps] = useState<ProtocolStep[]>([]);
  const [proposedSteps, setProposedSteps] = useState<ProtocolStep[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (protocolId) {
      loadProtocol();
    }
  }, [protocolId]);

  const loadProtocol = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/protocols/${protocolId}`);
      
      if (!res.ok) {
        throw new Error("Failed to fetch protocol");
      }

      const data = await res.json();
      setCurrentSteps(data.protocol.steps || []);
      setProposedSteps(data.protocol.steps || []);
      setBranch(data.protocol.currentBranch || "main");
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStepUpdate = (stepId: string, updatedStep: ProtocolStep) => {
    setProposedSteps((steps) =>
      steps.map((s) => (s.id === stepId ? updatedStep : s))
    );
  };

  const handleStepDelete = (stepId: string) => {
    setProposedSteps((steps) => steps.filter((s) => s.id !== stepId));
  };

  const handleStepAdd = () => {
    const newStep: ProtocolStep = {
      id: `step-${Date.now()}`,
      order: proposedSteps.length + 1,
      title: "New Step",
      reagents: [],
      equipment: [],
    };
    setProposedSteps((steps) => [...steps, newStep]);
  };

  const handleCreatePR = async () => {
    if (!title.trim()) {
      toast.error("Please provide a title");
      return;
    }

    if (!branch.trim()) {
      toast.error("Please provide a branch name");
      return;
    }

    const changes = computeStepDiff(currentSteps, proposedSteps);

    if (changes.length === 0) {
      toast.error("No changes to propose");
      return;
    }

    try {
      setIsCreating(true);
      const res = await fetch("/api/pr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          protocolId,
          branch: branch.trim(),
          title: title.trim(),
          description: description.trim() || undefined,
          changes,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create pull request");
      }

      const data = await res.json();
      toast.success("Pull request created successfully!");
      router.push(`/pr/${data.pullRequest.id}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create pull request";
      toast.error(errorMessage);
    } finally {
      setIsCreating(false);
    }
  };

  const changes = computeStepDiff(currentSteps, proposedSteps);

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
            <Button onClick={() => router.back()} className="mt-4">
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-3xl font-bold">Create Pull Request</h1>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Pull Request Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Add temperature control step"
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Branch Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                placeholder="e.g., feature/temperature-control"
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the changes you're proposing..."
                rows={4}
                className="w-full p-2 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Proposed Changes ({changes.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {changes.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <GitBranch className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p>No changes detected. Modify the protocol steps below to create a diff.</p>
              </div>
            ) : (
              <DiffViewer changes={changes} currentSteps={currentSteps} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Edit Protocol Steps</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {proposedSteps.map((step, index) => (
              <div key={step.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold">Step {index + 1}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleStepDelete(step.id)}
                  >
                    Delete
                  </Button>
                </div>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={step.title}
                    onChange={(e) =>
                      handleStepUpdate(step.id, { ...step, title: e.target.value })
                    }
                    placeholder="Step title"
                    className="w-full p-2 border border-gray-300 rounded-md text-sm"
                  />
                  <textarea
                    value={step.notes || ""}
                    onChange={(e) =>
                      handleStepUpdate(step.id, { ...step, notes: e.target.value })
                    }
                    placeholder="Notes (optional)"
                    rows={2}
                    className="w-full p-2 border border-gray-300 rounded-md text-sm resize-none"
                  />
                </div>
              </div>
            ))}
            <Button onClick={handleStepAdd} variant="outline" className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Step
            </Button>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button
            onClick={handleCreatePR}
            disabled={isCreating || !title.trim() || !branch.trim() || changes.length === 0}
          >
            <Save className="h-4 w-4 mr-2" />
            {isCreating ? "Creating..." : "Create Pull Request"}
          </Button>
        </div>
      </div>
    </div>
  );
}

