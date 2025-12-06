import React, { useState } from 'react';
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronRight, Folder } from 'lucide-react';

export default function SavedSidebar({ 
  savedArticles, 
  collections,
  activeView,
  onSelectView,
  onOpenCollectionsModal,
  theme 
}) {
  const isDark = theme === 'dark';
  const [expandedMonths, setExpandedMonths] = useState(true);
  const [expandedCollections, setExpandedCollections] = useState(true);

  // Group articles by month
  const articlesByMonth = {};
  savedArticles.forEach(article => {
    const date = new Date(article.pubDate || article.created_date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const monthLabel = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    
    if (!articlesByMonth[monthKey]) {
      articlesByMonth[monthKey] = {
        label: monthLabel,
        articles: []
      };
    }
    articlesByMonth[monthKey].articles.push(article);
  });

  const sortedMonths = Object.keys(articlesByMonth).sort().reverse();

  return (
    <div className={cn("h-full border-r flex flex-col", isDark ? "bg-neutral-950 border-neutral-800" : "bg-white border-gray-200")}>
      <nav className="flex-1 overflow-y-auto p-2 pt-4 space-y-0.5 custom-scrollbar">
        {/* Main */}
        <button
          onClick={() => onSelectView('main')}
          className={cn(
            "w-full flex items-center gap-2 px-3 py-2 rounded transition-all duration-150 text-sm font-medium text-left",
            activeView === 'main'
              ? "bg-orange-500/10 text-orange-500"
              : isDark
                ? "text-neutral-400 hover:text-white hover:bg-neutral-800/50"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
          )}
        >
          <ChevronDown className="w-4 h-4" />
          Main
        </button>

        {/* By Month */}
        <div className="mt-4">
          <button
            onClick={() => setExpandedMonths(!expandedMonths)}
            className={cn(
              "w-full flex items-center gap-2 px-3 py-2 rounded transition-all duration-150 text-xs font-semibold uppercase tracking-wider text-left",
              isDark ? "text-neutral-500 hover:text-neutral-300" : "text-gray-500 hover:text-gray-700"
            )}
          >
            {expandedMonths ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            By Month
          </button>
          
          {expandedMonths && (
            <div className="ml-4 mt-1 space-y-0.5">
              {sortedMonths.map(monthKey => {
                const monthData = articlesByMonth[monthKey];
                return (
                  <button
                    key={monthKey}
                    onClick={() => onSelectView(`month-${monthKey}`)}
                    className={cn(
                      "w-full text-left px-3 py-1.5 rounded transition-all duration-150 text-xs flex items-center justify-between",
                      activeView === `month-${monthKey}`
                        ? "bg-orange-500/10 text-orange-500"
                        : isDark
                          ? "text-neutral-500 hover:text-white hover:bg-neutral-800/50"
                          : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                    )}
                  >
                    <span>{monthData.label}</span>
                    <span className={cn("text-xs", isDark ? "text-neutral-600" : "text-gray-400")}>
                      {monthData.articles.length}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Separator */}
        <div className={cn("my-3 mx-3 border-t", isDark ? "border-neutral-800" : "border-gray-200")} />

        {/* Collections */}
        <div>
          <button
            onClick={() => setExpandedCollections(!expandedCollections)}
            className={cn(
              "w-full flex items-center gap-2 px-3 py-2 rounded transition-all duration-150 text-xs font-semibold uppercase tracking-wider text-left",
              isDark ? "text-neutral-500 hover:text-neutral-300" : "text-gray-500 hover:text-gray-700"
            )}
          >
            {expandedCollections ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            Collections
          </button>
          
          {expandedCollections && (
            <div className="ml-4 mt-1 space-y-0.5">
              {collections.map(collection => (
                <button
                  key={collection.id}
                  onClick={() => onSelectView(`collection-${collection.id}`)}
                  className={cn(
                    "w-full text-left px-3 py-1.5 rounded transition-all duration-150 text-xs",
                    activeView === `collection-${collection.id}`
                      ? "bg-orange-500/10 text-orange-500"
                      : isDark
                        ? "text-neutral-500 hover:text-white hover:bg-neutral-800/50"
                        : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                  )}
                >
                  {collection.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </nav>
      
      <div className={cn("p-2 border-t", isDark ? "border-neutral-800" : "border-gray-200")}>
        <button
          onClick={onOpenCollectionsModal}
          className={cn(
            "w-full px-3 py-2 rounded text-xs font-medium transition-colors text-left",
            isDark
              ? "text-neutral-400 hover:text-white hover:bg-neutral-800/50"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          )}
        >
          Edit Collections
        </button>
      </div>
    </div>
  );
}