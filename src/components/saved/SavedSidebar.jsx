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
  const isPastel = theme === 'pastel';
  
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

  // Group articles by level
  const articlesByLevel = {};
  savedArticles.forEach(article => {
    const level = article.sector || 'Uncategorized';
    if (!articlesByLevel[level]) articlesByLevel[level] = [];
    articlesByLevel[level].push(article);
  });

  const sortedMonths = Object.keys(articlesByMonth).sort().reverse();
  const sortedLevels = Object.keys(articlesByLevel).sort();
  const levelCount = sortedLevels.length;

  // Auto-expand "By Level" if 2+ distinct levels
  const [expandedMonths, setExpandedMonths] = useState(true);
  const [expandedLevels, setExpandedLevels] = useState(() => {
    const saved = localStorage.getItem('saved_levels_expanded');
    if (saved !== null) return saved === 'true';
    return levelCount >= 2;
  });
  const [expandedCollections, setExpandedCollections] = useState(true);

  React.useEffect(() => {
    localStorage.setItem('saved_levels_expanded', expandedLevels);
  }, [expandedLevels]);

  return (
    <div className={cn("h-full border-r flex flex-col", 
      isPastel ? "bg-[#2B2D42] border-[#4A4D6C]" :
      isDark ? "bg-neutral-950 border-neutral-800" : "bg-white border-gray-200")}>
      <nav className="flex-1 overflow-y-auto p-2 pt-4 space-y-0.5 custom-scrollbar">
        {/* Main */}
        <button
          onClick={() => onSelectView('main')}
          className={cn(
            "w-full flex items-center gap-2 px-3 py-2 rounded transition-all duration-150 text-sm font-medium text-left",
            activeView === 'main'
              ? "bg-orange-500/10 text-orange-500"
              : isPastel
                ? "text-[#9B9EBC] hover:text-white hover:bg-[#3A3D5C]/50"
                : isDark
                  ? "text-neutral-400 hover:text-white hover:bg-neutral-800/50"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
          )}
        >
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
                    onClick={() => {
                      console.log('Clicking month:', monthKey);
                      onSelectView(`month-${monthKey}`);
                    }}
                    className={cn(
                      "w-full text-left px-3 py-1.5 rounded transition-all duration-150 text-xs flex items-center justify-between cursor-pointer",
                      activeView === `month-${monthKey}`
                        ? "bg-orange-500/10 text-orange-500"
                        : isPastel
                          ? "text-[#9B9EBC] hover:text-white hover:bg-[#3A3D5C]/50"
                          : isDark
                            ? "text-neutral-500 hover:text-white hover:bg-neutral-800/50"
                            : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                    )}
                  >
                    <span>{monthData.label}</span>
                    <span className={cn("text-xs", 
                      isPastel ? "text-[#7B7E9C]" :
                      isDark ? "text-neutral-600" : "text-gray-400")}>
                      {monthData.articles.length}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* By Level */}
        <div className="mt-4">
          <button
            onClick={() => setExpandedLevels(!expandedLevels)}
            className={cn(
              "w-full flex items-center gap-2 px-3 py-2 rounded transition-all duration-150 text-xs font-semibold uppercase tracking-wider text-left",
              isDark ? "text-neutral-500 hover:text-neutral-300" : "text-gray-500 hover:text-gray-700"
            )}
          >
            {expandedLevels ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            By Level
            <span className={cn("ml-auto text-xs font-normal", 
              isPastel ? "text-[#7B7E9C]" :
              isDark ? "text-neutral-600" : "text-gray-400")}>
              {levelCount}
            </span>
          </button>
          
          {expandedLevels && (
            <div className="ml-4 mt-1 space-y-0.5">
              {sortedLevels.length === 0 ? (
                <div className={cn("px-3 py-1.5 text-xs", 
                  isPastel ? "text-[#7B7E9C]" :
                  isDark ? "text-neutral-600" : "text-gray-400")}>
                  No levels yet
                </div>
              ) : (
                sortedLevels.map(level => (
                  <button
                    key={level}
                    onClick={() => onSelectView(`level:${level}`)}
                    className={cn(
                      "w-full text-left px-3 py-1.5 rounded transition-all duration-150 text-xs flex items-center justify-between",
                      activeView === `level:${level}`
                        ? "bg-orange-500/10 text-orange-500"
                        : isPastel
                          ? "text-[#9B9EBC] hover:text-white hover:bg-[#3A3D5C]/50"
                          : isDark
                            ? "text-neutral-500 hover:text-white hover:bg-neutral-800/50"
                            : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                    )}
                  >
                    <span>{level}</span>
                    <span className={cn("text-xs", 
                      isPastel ? "text-[#7B7E9C]" :
                      isDark ? "text-neutral-600" : "text-gray-400")}>
                      {articlesByLevel[level].length}
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Separator */}
        <div className={cn("my-3 mx-3 border-t", 
          isPastel ? "border-[#4A4D6C]" :
          isDark ? "border-neutral-800" : "border-gray-200")} />

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
              {collections.map(collection => {
                const collectionArticles = savedArticles.filter(a => a.collection_ids?.includes(collection.id));
                return (
                  <button
                    key={collection.id}
                    onClick={() => onSelectView(`collection-${collection.id}`)}
                    className={cn(
                      "w-full text-left px-3 py-1.5 rounded transition-all duration-150 text-xs flex items-center justify-between",
                      activeView === `collection-${collection.id}`
                        ? "bg-orange-500/10 text-orange-500"
                        : isPastel
                          ? "text-[#9B9EBC] hover:text-white hover:bg-[#3A3D5C]/50"
                          : isDark
                            ? "text-neutral-500 hover:text-white hover:bg-neutral-800/50"
                            : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                    )}
                  >
                    <span>{collection.name}</span>
                    <span className={cn("text-xs", 
                      isPastel ? "text-[#7B7E9C]" :
                      isDark ? "text-neutral-600" : "text-gray-400")}>
                      {collectionArticles.length}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </nav>
      
      <div className={cn("p-2 border-t", 
        isPastel ? "border-[#4A4D6C]" :
        isDark ? "border-neutral-800" : "border-gray-200")}>
        <button
          onClick={onOpenCollectionsModal}
          className={cn(
            "w-full px-3 py-2 rounded text-xs font-medium transition-colors text-left",
            isPastel
              ? "text-[#9B9EBC] hover:text-white hover:bg-[#3A3D5C]/50"
              : isDark
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