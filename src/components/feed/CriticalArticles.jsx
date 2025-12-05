import React from 'react';
import { format } from 'date-fns';
import { RefreshCw } from 'lucide-react';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export default function CriticalArticles({ articles, isLoading, onRefresh, theme }) {
  const isDark = theme === 'dark';

  return (
    <div className={cn(
      "rounded border p-4",
      isDark ? "bg-neutral-900 border-amber-900/30" : "bg-amber-50/50 border-amber-200"
    )}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className={cn("text-xs font-semibold uppercase tracking-wider", isDark ? "text-amber-500/80" : "text-amber-700")}>
            Critical
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            disabled={isLoading}
            className="h-6 w-6 p-0"
          >
            <RefreshCw className={cn("w-3 h-3", isLoading && "animate-spin", isDark ? "text-amber-500/50" : "text-amber-600")} />
          </Button>
        </div>
        <span className={cn("text-xs", isDark ? "text-neutral-600" : "text-gray-400")}>
          AI Curated
        </span>
      </div>
      
      {isLoading ? (
        <div className="py-4">
          <span className={cn("text-sm", isDark ? "text-neutral-400" : "text-gray-500")}>Analyzing articles...</span>
        </div>
      ) : articles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {articles.slice(0, 4).map((article, idx) => (
            <a
              key={idx}
              href={article.link}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "block p-3 rounded border transition-all",
                isDark 
                  ? "bg-neutral-800/50 border-neutral-700/50 hover:border-amber-700/50" 
                  : "bg-white border-gray-200 hover:border-amber-300"
              )}
            >
              <h4 className={cn("text-sm font-medium line-clamp-2 mb-2", isDark ? "text-white" : "text-gray-900")}>
                {article.title}
              </h4>
              <div className="flex items-center gap-2">
                <span className={cn("text-xs", isDark ? "text-neutral-500" : "text-gray-500")}>{article.source}</span>
                {article.pubDate && (
                  <span className={cn("text-xs", isDark ? "text-neutral-600" : "text-gray-400")}>
                    {format(new Date(article.pubDate), 'MMM d')}
                  </span>
                )}
              </div>
            </a>
          ))}
        </div>
      ) : (
        <p className={cn("text-sm", isDark ? "text-neutral-500" : "text-gray-500")}>
          No critical articles identified yet.
        </p>
      )}
    </div>
  );
}