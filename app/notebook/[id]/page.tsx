"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Save, Users, Sparkles, History } from "lucide-react";
import Link from "next/link";
import { useNotebook } from "@/hooks/use-notebook";
import { useSocket } from "@/hooks/use-socket";
import { useVoiceToText } from "@/hooks/use-voice-to-text";
import { toast } from "sonner";
import { LoadingSpinner } from "@/components/loading";
import { standardizeProtocol, checkMLServerHealth, AutocompleteResponse, StandardizeResponse } from "@/lib/ml-api";
import { ProtocolPreview } from "@/components/notebook/protocol-preview";
import { AutocompleteDropdown } from "@/components/notebook/autocomplete-dropdown";

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
  const [isAIAssisting, setIsAIAssisting] = useState(false);
  const [mlServerAvailable, setMlServerAvailable] = useState(false);
  const [protocolPreview, setProtocolPreview] = useState<StandardizeResponse["protocol"] | null>(null);
  const [protocolConfidence, setProtocolConfidence] = useState(0);
  const [autocompleteSuggestions, setAutocompleteSuggestions] = useState<AutocompleteResponse["suggestions"]>([]);
  const [isAutocompleteLoading, setIsAutocompleteLoading] = useState(false);
  const [autocompletePosition, setAutocompletePosition] = useState<{ top: number; left: number } | null>(null);
  const [lastProcessedContent, setLastProcessedContent] = useState("");
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mlProcessTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Initialize content from notebook
  useEffect(() => {
    if (notebook) {
      setContent(notebook.content || "");
      setTitle(notebook.title || "");
    }
  }, [notebook]);

  // Check ML server availability
  useEffect(() => {
    const checkMLServer = async () => {
      const available = await checkMLServerHealth();
      setMlServerAvailable(available);
    };
    checkMLServer();
  }, []);

  // Handle voice transcription with auto-structuring
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

      // If ML server available and transcript is substantial, process it
      if (mlServerAvailable && transcript.length > 30) {
        setTimeout(() => {
          processWithML(newContent);
        }, 1000);
      }
    }
  }, [transcript, content, clearTranscript, mlServerAvailable, processWithML]);

  // Process content with ML server (on auto-save)
  const processWithML = useCallback(async (text: string) => {
    if (!mlServerAvailable || !text.trim() || text.length < 50) return;
    if (text === lastProcessedContent) return; // Skip if already processed

    try {
      const response = await fetch("/api/ai/process", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: text,
          action: "standardize",
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data?.protocol) {
          setProtocolPreview(result.data.protocol);
          setProtocolConfidence(result.data.confidence || 0);
          setLastProcessedContent(text);
        }
      }
    } catch (err) {
      // Silently fail - ML processing is optional
      console.error("ML processing failed:", err);
    }
  }, [mlServerAvailable, lastProcessedContent]);

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

      // Process with ML server if available and content changed significantly
      if (mlServerAvailable && content.trim().length > 50) {
        // Debounce ML processing - only process if content changed significantly
        if (mlProcessTimeoutRef.current) {
          clearTimeout(mlProcessTimeoutRef.current);
        }
        mlProcessTimeoutRef.current = setTimeout(() => {
          processWithML(content);
        }, 2000); // Process 2 seconds after save
      }
    } catch (err) {
      console.error("Auto-save failed:", err);
      // Don't show toast for auto-save failures to avoid spam
    } finally {
      setIsSaving(false);
    }
  }, [content, title, notebookId, isSaving, updateNotebook, emitContentChange, mlServerAvailable, processWithML]);

  // Handle content changes with autocomplete
  const handleContentChange = async (newContent: string) => {
    setContent(newContent);
    
    // Clear existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    
    // Emit real-time update immediately
    emitContentChange(newContent);
    
    // Check for autocomplete triggers (e.g., typing "Step" or "Next:")
    if (mlServerAvailable && newContent.length > 20) {
      const lines = newContent.split("\n");
      const lastLine = lines[lines.length - 1] || "";
      
      // Trigger autocomplete on certain patterns
      if (lastLine.toLowerCase().includes("step") || 
          lastLine.toLowerCase().includes("next:") ||
          lastLine.toLowerCase().includes("then")) {
        
        // Get cursor position for dropdown
        if (textareaRef.current) {
          const rect = textareaRef.current.getBoundingClientRect();
          const scrollTop = textareaRef.current.scrollTop;
          const lineHeight = 20; // Approximate line height
          const linesBeforeCursor = newContent.substring(0, textareaRef.current.selectionStart).split("\n").length;
          
          setAutocompletePosition({
            top: rect.top + (linesBeforeCursor * lineHeight) - scrollTop + 30,
            left: rect.left + 20,
          });

          // Fetch autocomplete suggestions
          setIsAutocompleteLoading(true);
          try {
            const response = await fetch("/api/ai/process", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                action: "autocomplete",
                currentSteps: lines.filter(l => l.trim().length > 0).slice(0, 5).map((line, idx) => ({
                  title: line.substring(0, 50),
                  order: idx + 1,
                })),
                partialText: lastLine,
              }),
            });

            if (response.ok) {
              const result = await response.json();
              if (result.success && result.data?.suggestions) {
                setAutocompleteSuggestions(result.data.suggestions);
              }
            }
          } catch (err) {
            console.error("Autocomplete failed:", err);
          } finally {
            setIsAutocompleteLoading(false);
          }
        }
      } else {
        // Hide autocomplete if pattern doesn't match
        setAutocompletePosition(null);
        setAutocompleteSuggestions([]);
      }
    }
    
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
      toast.success("Notebook saved successfully");
    } catch (err) {
      console.error("Save failed:", err);
      toast.error("Failed to save notebook");
    } finally {
      setIsSaving(false);
    }
  };

  // AI-assisted structure conversion
  const handleAIStructure = async () => {
    if (!mlServerAvailable) {
      toast.error("ML Server is not available. Please ensure it's running.");
      return;
    }

    if (!content.trim()) {
      toast.error("Please add some content before structuring with AI");
      return;
    }

    try {
      setIsAIAssisting(true);
      const result = await standardizeProtocol(content);
      
      if (result && result.protocol) {
        // Create structured format from protocol
        const structured = `# ${result.protocol.title || "Structured Protocol"}

${result.protocol.description || ""}

## Protocol Steps

${result.extracted_steps.map((step, idx) => `
### Step ${step.order}: ${step.title}

- **Reagents:** ${step.reagents.join(", ") || "None"}
- **Timing:** ${step.timing || "Not specified"}
- **Equipment:** ${step.equipment.join(", ") || "None"}
- **Notes:** ${step.notes || ""}
`).join("\n")}

---

*Structured by AI with ${Math.round(result.confidence * 100)}% confidence*
`;

        setContent(structured);
        toast.success("Content structured successfully!");
      }
    } catch (err) {
      console.error("AI structuring failed:", err);
      toast.error("Failed to structure content. Please try again.");
    } finally {
      setIsAIAssisting(false);
    }
  };

  // Handle autocomplete selection
  const handleAutocompleteSelect = (suggestion: AutocompleteResponse["suggestions"][0]) => {
    if (!textareaRef.current) return;

    const cursorPosition = textareaRef.current.selectionStart;
    const textBefore = content.substring(0, cursorPosition);
    const textAfter = content.substring(cursorPosition);
    
    // Insert suggestion
    const suggestionText = `\n${suggestion.title}${suggestion.notes ? ` - ${suggestion.notes}` : ""}\n`;
    const newContent = textBefore + suggestionText + textAfter;
    
    setContent(newContent);
    setAutocompletePosition(null);
    setAutocompleteSuggestions([]);
    
    // Move cursor after inserted text
    setTimeout(() => {
      if (textareaRef.current) {
        const newPosition = cursorPosition + suggestionText.length;
        textareaRef.current.setSelectionRange(newPosition, newPosition);
        textareaRef.current.focus();
      }
    }, 0);
  };

  // Handle protocol preview use
  const handleUseProtocol = (protocol: StandardizeResponse["protocol"]) => {
    const structured = `# ${protocol.title || "Structured Protocol"}

${protocol.description || ""}

## Protocol Steps

${protocol.steps.map((step) => `
### Step ${step.order}: ${step.title}

- **Reagents:** ${step.reagents.join(", ") || "None"}
- **Timing:** ${step.timing || "Not specified"}
- **Equipment:** ${step.equipment.join(", ") || "None"}
- **Notes:** ${step.notes || ""}
`).join("\n")}
`;

    setContent(structured);
    setProtocolPreview(null);
    toast.success("Protocol applied to notebook!");
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      if (mlProcessTimeoutRef.current) {
        clearTimeout(mlProcessTimeoutRef.current);
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
          {mlServerAvailable && content.trim() && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleAIStructure}
              disabled={isAIAssisting}
            >
              {isAIAssisting ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  AI Processing...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  AI Structure
                </>
              )}
            </Button>
          )}
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
          <Link href={`/notebook/${notebookId}/history`}>
            <Button variant="outline" size="sm">
              <History className="h-4 w-4 mr-2" />
              History
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={handleManualSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save
              </>
            )}
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

      {mlServerAvailable && (
        <div className="text-xs text-gray-500 text-center">
          ✨ AI assistance available - Click "AI Structure" to convert notes to structured protocol
        </div>
      )}

      {/* Protocol Preview Sidebar */}
      {protocolPreview && (
        <ProtocolPreview
          protocol={protocolPreview}
          confidence={protocolConfidence}
          onClose={() => setProtocolPreview(null)}
          onUseProtocol={handleUseProtocol}
        />
      )}

      {/* Autocomplete Dropdown */}
      {autocompletePosition && (
        <AutocompleteDropdown
          suggestions={autocompleteSuggestions}
          isLoading={isAutocompleteLoading}
          onSelect={handleAutocompleteSelect}
          position={autocompletePosition}
        />
      )}
    </div>
  );
}
