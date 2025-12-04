"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Save, Users } from "lucide-react";
import { useNotebook } from "@/hooks/use-notebook";
import { useSocket } from "@/hooks/use-socket";
import { useVoiceToText } from "@/hooks/use-voice-to-text";

export default function NotebookDetailPage() {
  const params = useParams();
  const notebookId = params?.id as string;
  const { notebook, isLoading, error, updateNotebook } = useNotebook();
  const {
    isConnected,
    roomMembers,
    emitContentChange,
  } = useSocket(notebookId);
  
  const {
    isListening,
    transcript,
    error: voiceError,
    startListening,
    stopListening,
    clearTranscript,
  } = useVoiceToText();

  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Initialize content from notebook
  useEffect(() => {
    if (notebook) {
      setContent(notebook.content || "");
      setTitle(notebook.title || "");
    }
  }, [notebook]);

  // Handle voice transcription
  useEffect(() => {
    if (transcript && textareaRef.current) {
      const cursorPosition = textareaRef.current.selectionStart;
      const textBefore = content.substring(0, cursorPosition);
      const textAfter = content.substring(cursorPosition);
      const newContent = textBefore + transcript + textAfter;
      
      setContent(newContent);
      clearTranscript();
      
      // Move cursor after inserted text
      setTimeout(() => {
        if (textareaRef.current) {
          const newPosition = cursorPosition + transcript.length;
          textareaRef.current.setSelectionRange(newPosition, newPosition);
        }
      }, 0);
    }
  }, [transcript, content, clearTranscript]);

  // Auto-save every 3 seconds
  const autoSave = useCallback(async () => {
    if (!notebookId || isSaving) return;

    try {
      setIsSaving(true);
      await updateNotebook({
        content,
        title,
        autoSave: true,
      });
      setLastSaved(new Date());
      
      // Emit real-time update
      emitContentChange(content);
    } catch (err) {
      console.error("Auto-save failed:", err);
    } finally {
      setIsSaving(false);
    }
  }, [content, title, notebookId, isSaving, updateNotebook, emitContentChange]);

  // Handle content changes
  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    
    // Clear existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    
    // Emit real-time update immediately
    emitContentChange(newContent);
    
    // Schedule auto-save after 3 seconds
    autoSaveTimeoutRef.current = setTimeout(() => {
      autoSave();
    }, 3000);
  };

  // Handle title changes
  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    
    // Clear existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    
    // Schedule auto-save after 3 seconds
    autoSaveTimeoutRef.current = setTimeout(() => {
      autoSave();
    }, 3000);
  };

  // Manual save
  const handleManualSave = async () => {
    try {
      setIsSaving(true);
      await updateNotebook({
        content,
        title,
        autoSave: false,
      });
      setLastSaved(new Date());
    } catch (err) {
      console.error("Save failed:", err);
    } finally {
      setIsSaving(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  // Real-time updates are handled via Socket.IO in useSocket hook

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-gray-600">Loading notebook...</p>
        </div>
      </div>
    );
  }

  if (error || !notebook) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-red-600">Error loading notebook: {error || "Not found"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <input
            type="text"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            className="text-3xl font-bold text-gray-900 bg-transparent border-none outline-none focus:outline-none w-full"
            placeholder="Untitled Notebook"
          />
          <div className="flex items-center gap-4 mt-2">
            <p className="text-sm text-gray-600">Real-time collaborative editing</p>
            {isConnected && (
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <span className="text-xs text-gray-500">Connected</span>
              </div>
            )}
            {roomMembers.length > 0 && (
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-gray-500" />
                <span className="text-xs text-gray-500">
                  {roomMembers.length} collaborator{roomMembers.length > 1 ? "s" : ""}
                </span>
              </div>
            )}
            {lastSaved && (
              <span className="text-xs text-gray-500">
                Saved {lastSaved.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={isListening ? "default" : "outline"}
            size="sm"
            onClick={isListening ? stopListening : startListening}
            disabled={voiceError !== null}
          >
            {isListening ? (
              <>
                <MicOff className="h-4 w-4 mr-2" />
                Stop Voice
              </>
            ) : (
              <>
                <Mic className="h-4 w-4 mr-2" />
                Voice Input
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleManualSave}
            disabled={isSaving}
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      {voiceError && (
        <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-3 text-sm text-yellow-700">
          Voice recognition: {voiceError}
        </div>
      )}

      {/* Editor */}
      <Card>
        <CardContent className="p-6">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            placeholder="Start writing your lab notes here... Use voice input for hands-free transcription!"
            className="w-full h-[600px] resize-none border-none outline-none text-sm font-mono text-gray-700 leading-relaxed focus:outline-none"
          />
        </CardContent>
      </Card>

      {/* AI Autocomplete stub */}
      <div className="text-xs text-gray-500 text-center">
        AI autocomplete coming soon - will integrate with ML server
      </div>
    </div>
  );
}
