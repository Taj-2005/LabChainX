"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Send } from "lucide-react";
import { toast } from "sonner";

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

interface PRComment {
  id?: string;
  authorId: string;
  author: PRAuthor | null;
  text: string;
  path?: string;
  createdAt: Date | string;
}

interface PRCommentsProps {
  prId: string;
  comments: PRComment[];
  onCommentAdded: () => void;
}

export function PRComments({ prId, comments, onCommentAdded }: PRCommentsProps) {
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newComment.trim()) {
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch(`/api/pr/${prId}/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: newComment.trim() }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to add comment");
      }

      toast.success("Comment added");
      setNewComment("");
      onCommentAdded();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to add comment";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

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

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-2">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          className="w-full p-3 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
        />
        <Button type="submit" disabled={isSubmitting || !newComment.trim()}>
          <Send className="h-4 w-4 mr-2" />
          {isSubmitting ? "Posting..." : "Post Comment"}
        </Button>
      </form>

      <div className="space-y-4">
        {comments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p>No comments yet</p>
          </div>
        ) : (
          comments.map((comment) => (
            <Card key={comment.id || comment.authorId + comment.createdAt}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm">
                        {comment.author?.name || "Unknown"}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatDate(comment.createdAt)}
                      </span>
                    </div>
                    {comment.path && (
                      <div className="text-xs text-blue-600 mb-1">
                        Comment on: {comment.path}
                      </div>
                    )}
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {comment.text}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

