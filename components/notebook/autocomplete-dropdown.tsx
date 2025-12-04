"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Loader2 } from "lucide-react";
import { AutocompleteResponse } from "@/lib/ml-api";

interface AutocompleteDropdownProps {
  suggestions: AutocompleteResponse["suggestions"];
  isLoading: boolean;
  onSelect: (suggestion: AutocompleteResponse["suggestions"][0]) => void;
  position: { top: number; left: number } | null;
}

export function AutocompleteDropdown({
  suggestions,
  isLoading,
  onSelect,
  position,
}: AutocompleteDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (position && dropdownRef.current) {
      dropdownRef.current.style.top = `${position.top}px`;
      dropdownRef.current.style.left = `${position.left}px`;
    }
  }, [position]);

  if (!position && !isLoading && (!suggestions || suggestions.length === 0)) {
    return null;
  }

  return (
    <Card
      ref={dropdownRef}
      className="absolute z-50 w-80 shadow-lg border border-gray-200"
      style={{
        top: position?.top || 0,
        left: position?.left || 0,
      }}
    >
      <CardContent className="p-3">
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-gray-600 py-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>AI is thinking...</span>
          </div>
        ) : suggestions && suggestions.length > 0 ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
              <Sparkles className="h-3 w-3" />
              <span>AI Suggestions</span>
            </div>
            {suggestions.map((suggestion, idx) => (
              <button
                key={idx}
                onClick={() => onSelect(suggestion)}
                className="w-full text-left p-2 rounded hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-colors"
              >
                <p className="text-sm font-medium text-gray-900">{suggestion.title}</p>
                {suggestion.notes && (
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                    {suggestion.notes}
                  </p>
                )}
                {(suggestion.reagents?.length > 0 || suggestion.equipment?.length > 0) && (
                  <div className="flex gap-2 mt-1 text-xs text-gray-400">
                    {suggestion.reagents?.length > 0 && (
                      <span>{suggestion.reagents.length} reagents</span>
                    )}
                    {suggestion.equipment?.length > 0 && (
                      <span>{suggestion.equipment.length} equipment</span>
                    )}
                  </div>
                )}
              </button>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

