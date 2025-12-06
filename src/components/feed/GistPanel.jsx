import React from 'react';
import ReactMarkdown from 'react-markdown';
import { cn } from "@/lib/utils";
import { RefreshCw } from 'lucide-react';
import { Button } from "@/components/ui/button";

export default function GistPanel({ gist, isLoading, onRefresh, sectorName, theme }) {
  const isDark = theme === 'dark';

  return (
    <div className={cn(
      "rounded border p-4 w-full",
      isDark ? "bg-neutral-900 border-neutral-800" : "bg-white border-gray-200"
    )}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className={cn("text-xs font-semibold uppercase tracking-wider", isDark ? "text-neutral-400" : "text-gray-500")}>
            Gist
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            disabled={isLoading}
            className="h-6 w-6 p-0"
          >
            <RefreshCw className={cn("w-3 h-3", isLoading && "animate-spin", isDark ? "text-neutral-500" : "text-gray-500")} />
          </Button>
        </div>
        {sectorName && (
          <span className={cn("text-xs px-2 py-0.5 rounded", isDark ? "text-neutral-500 bg-neutral-800" : "text-gray-500 bg-gray-100")}>
            {sectorName}
          </span>
        )}
      </div>
      
      {isLoading ? (
        <div className="flex items-center py-6">
          <span className={cn("text-sm", isDark ? "text-neutral-400" : "text-gray-500")}>Generating summary...</span>
        </div>
      ) : gist ? (
        <div className="prose prose-sm max-w-none">
          <ReactMarkdown
            components={{
              p: ({ children }) => <p className={cn("text-sm leading-relaxed mb-2 last:mb-0", isDark ? "text-neutral-300" : "text-gray-700")}>{children}</p>,
              strong: ({ children }) => <strong className={cn("font-semibold", isDark ? "text-white" : "text-gray-900")}>{children}</strong>,
              ul: ({ children }) => <ul className={cn("text-sm space-y-1 list-disc list-inside", isDark ? "text-neutral-300" : "text-gray-700")}>{children}</ul>,
              li: ({ children }) => <li className={isDark ? "text-neutral-300" : "text-gray-700"}>{children}</li>,
            }}
          >
            {gist}
          </ReactMarkdown>
        </div>
      ) : (
        <p className={cn("text-sm", isDark ? "text-neutral-500" : "text-gray-500")}>
          Select a sector and add RSS sources to generate a summary.
        </p>
      )}
    </div>
  );
}