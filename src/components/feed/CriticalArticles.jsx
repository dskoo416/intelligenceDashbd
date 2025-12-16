import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export default function CriticalArticles({ articles, isLoading, onRefresh, theme }) {
  const isDark = theme === 'dark';
  const isPastel = theme === 'pastel';
  const [isExpanded, setIsExpanded] = useState(() => {
    const saved = localStorage.getItem('featured_expanded');
    return saved === 'true';
  });

  useEffect(() => {
    localStorage.setItem('featured_expanded', isExpanded);
  }, [isExpanded]);

  const displayCount = isExpanded ? 12 : 4;
  const gridCols = isExpanded ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4';

  return (
    <div className={cn(
      "rounded border p-4 w-full",
      isPastel ? "bg-[#3A3D5C] border-[#9B8B6B]/30" :
      isDark ? "bg-neutral-900 border-amber-900/30" : "bg-amber-50/50 border-amber-200"
    )}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className={cn("text-xs font-semibold uppercase tracking-wider", 
            isPastel ? "text-[#9B8B6B]/80" :
            isDark ? "text-amber-500/80" : "text-amber-700")}>
            Featured
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            disabled={isLoading}
            className="h-6 w-6 p-0"
          >
            <RefreshCw className={cn("w-3 h-3", isLoading && "animate-spin", 
              isPastel ? "text-[#9B8B6B]/50" :
              isDark ? "text-amber-500/50" : "text-amber-600")} />
          </Button>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="h-6 px-2 gap-1"
        >
          <span className={cn("text-xs", 
            isPastel ? "text-[#9B9EBC]" :
            isDark ? "text-neutral-400" : "text-gray-600")}>
            {isExpanded ? 'Collapse' : 'Expand'}
          </span>
          {isExpanded ? (
            <ChevronUp className={cn("w-3 h-3", 
              isPastel ? "text-[#9B9EBC]" :
              isDark ? "text-neutral-400" : "text-gray-600")} />
          ) : (
            <ChevronDown className={cn("w-3 h-3", 
              isPastel ? "text-[#9B9EBC]" :
              isDark ? "text-neutral-400" : "text-gray-600")} />
          )}
        </Button>
      </div>
      
      {isLoading ? (
        <div className="py-4">
          <span className={cn("text-sm", 
            isPastel ? "text-[#D0D2E0]" :
            isDark ? "text-neutral-400" : "text-gray-500")}>Analyzing articles...</span>
        </div>
      ) : articles.length > 0 ? (
        <div className={cn("grid gap-3", gridCols)}>
          {articles.slice(0, displayCount).map((article, idx) => (
            <a
              key={idx}
              href={article.link}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "block p-3 rounded border transition-all",
                isPastel ? "bg-[#4A4D6C]/50 border-[#5A5D7C]/50 hover:border-[#9B8B6B]/50" :
                isDark ? "bg-neutral-800/50 border-neutral-700/50 hover:border-amber-700/50" : "bg-white border-gray-200 hover:border-amber-300"
              )}
            >
              <h4 className={cn("text-sm font-medium line-clamp-2 mb-2", 
                isPastel ? "text-white" :
                isDark ? "text-white" : "text-gray-900")}>
                {article.title}
              </h4>
              <div className="flex items-center gap-2">
                <span className={cn("text-xs", 
                  isPastel ? "text-[#9B9EBC]" :
                  isDark ? "text-neutral-500" : "text-gray-500")}>{article.source}</span>
                {article.pubDate && (
                  <span className={cn("text-xs", 
                    isPastel ? "text-[#7B7E9C]" :
                    isDark ? "text-neutral-600" : "text-gray-400")}>
                    {format(new Date(article.pubDate), 'MMM d')}
                  </span>
                )}
              </div>
            </a>
          ))}
        </div>
      ) : (
        <p className={cn("text-sm", 
          isPastel ? "text-[#9B9EBC]" :
          isDark ? "text-neutral-500" : "text-gray-500")}>
          No featured articles identified yet.
        </p>
      )}
    </div>
  );
}