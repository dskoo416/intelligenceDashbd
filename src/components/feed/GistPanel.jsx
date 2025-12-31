import React from 'react';
import ReactMarkdown from 'react-markdown';
import { cn } from "@/lib/utils";
import { RefreshCw } from 'lucide-react';
import { Button } from "@/components/ui/button";

export default function GistPanel({ gist, isLoading, onRefresh, sectorName, theme, isAggregated, descendantCount }) {
  const isDark = theme === 'dark';
  const isPastel = theme === 'pastel';

  return (
    <div className={cn(
      "rounded border p-4 w-full",
      isPastel ? "bg-[#3A3D5C] border-[#4A4D6C]" :
      isDark ? "bg-neutral-900 border-neutral-800" : "bg-white border-gray-200"
    )}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className={cn("text-xs font-semibold uppercase tracking-wider", 
            isPastel ? "text-[#A5A8C0]" :
            isDark ? "text-neutral-400" : "text-gray-500")}>
            Summary
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            disabled={isLoading}
            className="h-6 w-6 p-0"
          >
            <RefreshCw className={cn("w-3 h-3", isLoading && "animate-spin", 
              isPastel ? "text-[#7B7E9C]" :
              isDark ? "text-neutral-500" : "text-gray-500")} />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          {sectorName && (
            <span className={cn("text-xs px-2 py-0.5 rounded", 
              isPastel ? "text-[#D0D2E0] bg-[#4A4D6C]" :
              isDark ? "text-neutral-500 bg-neutral-800" : "text-gray-500 bg-gray-100")}>
              {sectorName}
            </span>
          )}
          {isAggregated && descendantCount > 0 && (
            <span className={cn("text-[9px] px-2 py-0.5 rounded font-medium uppercase tracking-wider",
              isPastel ? "bg-[#7B7E9C]/20 text-[#7B7E9C]" :
              "bg-neutral-500/20 text-neutral-500")}>
              {descendantCount} sub-level{descendantCount > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex items-center py-6">
          <span className={cn("text-sm", 
            isPastel ? "text-[#D0D2E0]" :
            isDark ? "text-neutral-400" : "text-gray-500")}>Generating summary...</span>
        </div>
      ) : gist ? (
        <div className="prose prose-sm max-w-none">
          <ReactMarkdown
            components={{
              p: ({ children }) => <p className={cn("text-sm leading-relaxed mb-2 last:mb-0", 
                isPastel ? "text-[#D0D2E0]" :
                isDark ? "text-neutral-300" : "text-gray-700")}>{children}</p>,
              strong: ({ children }) => <strong className={cn("font-semibold", 
                isPastel ? "text-white" :
                isDark ? "text-white" : "text-gray-900")}>{children}</strong>,
              ul: ({ children }) => <ul className={cn("text-sm space-y-1 list-disc list-inside", 
                isPastel ? "text-[#D0D2E0]" :
                isDark ? "text-neutral-300" : "text-gray-700")}>{children}</ul>,
              li: ({ children }) => <li className={
                isPastel ? "text-[#D0D2E0]" :
                isDark ? "text-neutral-300" : "text-gray-700"}>{children}</li>,
            }}
          >
            {gist}
          </ReactMarkdown>
        </div>
      ) : (
        <p className={cn("text-sm", 
          isPastel ? "text-[#9B9EBC]" :
          isDark ? "text-neutral-500" : "text-gray-500")}>
          Select a sector and add RSS sources to generate a summary.
        </p>
      )}
    </div>
  );
}