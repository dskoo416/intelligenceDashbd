import React from 'react';
import { format } from 'date-fns';
import { cn } from "@/lib/utils";

export default function NewsFeed({ articles, isLoading, theme }) {
  const isDark = theme === 'dark';

  return (
    <div className={cn(
      "rounded border p-4 flex-1 overflow-hidden flex flex-col",
      isDark ? "bg-neutral-900/50 border-neutral-800" : "bg-white border-gray-200"
    )}>
      <div className="flex items-center justify-between mb-3">
        <h3 className={cn("text-xs font-semibold uppercase tracking-wider", isDark ? "text-neutral-400" : "text-gray-500")}>
          Most Recent
        </h3>
        <span className={cn("text-xs", isDark ? "text-neutral-600" : "text-gray-400")}>
          {articles.length} articles
        </span>
      </div>
      
      {isLoading ? (
        <div className="py-8">
          <span className={cn("text-sm", isDark ? "text-neutral-400" : "text-gray-500")}>Fetching news...</span>
        </div>
      ) : articles.length > 0 ? (
        <div className="flex-1 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
          {articles.map((article, idx) => (
            <a
              key={idx}
              href={article.link}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "block p-2.5 rounded border transition-all",
                isDark 
                  ? "bg-neutral-800/30 border-neutral-800/50 hover:border-neutral-700 hover:bg-neutral-800/50" 
                  : "bg-gray-50/50 border-gray-100 hover:border-gray-200 hover:bg-gray-50"
              )}
            >
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <h4 className={cn("text-sm font-medium line-clamp-1", isDark ? "text-neutral-200" : "text-gray-800")}>
                    {article.title}
                  </h4>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={cn("text-xs", isDark ? "text-neutral-500" : "text-gray-500")}>{article.source}</span>
                    {article.pubDate && (
                      <span className={cn("text-xs", isDark ? "text-neutral-600" : "text-gray-400")}>
                        {format(new Date(article.pubDate), 'MMM d, h:mm a')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </a>
          ))}
        </div>
      ) : (
        <p className={cn("text-sm py-8", isDark ? "text-neutral-500" : "text-gray-500")}>
          No articles available. Add RSS sources in settings.
        </p>
      )}
    </div>
  );
}