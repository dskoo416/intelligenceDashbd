import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Plus, Calendar, Search, X, RefreshCw, ChevronLeft, ChevronRight, Tag } from 'lucide-react';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cleanTitle } from '@/components/utils/titleCleanup';
import { toast } from 'sonner';


export default function NewsFeed({ articles, isLoading, onSaveArticle, onDateFilter, onSearchFilter, dateFilter, searchFilter, sectorName, savedArticleIds, theme, onRefresh, sectorKeywords }) {
  const isDark = theme === 'dark';
  const isPastel = theme === 'pastel';
  const [showSearch, setShowSearch] = useState(false);
  const [viewMode, setViewMode] = useState(() => localStorage.getItem('newsViewMode') || 'compact');
  const [currentPage, setCurrentPage] = useState(1);
  const [tempDateFilter, setTempDateFilter] = useState(null);
  const articlesPerPage = 20;
  const [showKeywords, setShowKeywords] = useState(false);
  const [activeKeyword, setActiveKeyword] = useState('all');
  
  // displayLevelId is the stable unique identifier from the feed hook or sector
  // This should come from a prop, but we'll derive it from sectorName for now
  const displayLevelId = sectorName || 'main';

  // Reset pagination and filters when level changes
  useEffect(() => {
    setCurrentPage(1);
    setActiveKeyword('all');
  }, [displayLevelId]);

  // Reset to page 1 when keyword filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeKeyword]);

  // Only use articles, no fallback cache (cache is handled in useFeedData)
  const displayArticles = articles;

  // Apply keyword filtering
  const keywordFilteredArticles = activeKeyword === 'all' 
    ? displayArticles 
    : displayArticles.filter(article => {
        const searchText = `${cleanTitle(article.title)} ${article.description || ''}`.toLowerCase();
        return searchText.includes(activeKeyword.toLowerCase());
      });
  
  const totalPages = Math.ceil(keywordFilteredArticles.length / articlesPerPage);
  const startIndex = (currentPage - 1) * articlesPerPage;
  const endIndex = startIndex + articlesPerPage;
  const paginatedArticles = keywordFilteredArticles.slice(startIndex, endIndex);

  return (
    <div className={cn(
      "rounded border p-4 w-full overflow-hidden flex flex-col",
      isPastel ? "bg-[#3A3D5C]/50 border-[#4A4D6C]" :
      isDark ? "bg-neutral-900/50 border-neutral-800" : "bg-white border-gray-200"
    )}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className={cn("text-xs font-semibold uppercase tracking-wider", 
            isPastel ? "text-[#A5A8C0]" :
            isDark ? "text-neutral-400" : "text-gray-500")}>
            {sectorName ? `${sectorName} News` : 'Most Recent'}
          </h3>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => {
              toast.promise(onRefresh(), {
                loading: 'Fetching latest news...',
                success: 'News updated',
                error: 'Failed to fetch news'
              });
            }}
            disabled={isLoading}
            className="h-5 w-5 p-0"
          >
            <RefreshCw className={cn("w-3 h-3", isLoading && "animate-spin",
              isPastel ? "text-[#7B7E9C]" :
              isDark ? "text-neutral-500" : "text-gray-500")} />
          </Button>
        </div>
        <div className="flex items-center gap-2">
            <span className={cn("text-xs", 
              isPastel ? "text-[#9B9EBC]" :
              isDark ? "text-neutral-600" : "text-gray-400")}>
              {keywordFilteredArticles.length} articles
            </span>

            {sectorKeywords && sectorKeywords.length > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowKeywords(!showKeywords)}
                className="h-7 w-7 p-0"
              >
                <Tag className={cn("w-3.5 h-3.5", showKeywords ? "text-orange-500" : 
                  isPastel ? "text-[#7B7E9C]" :
                  isDark ? "text-neutral-500" : "text-gray-500")} />
              </Button>
            )}

            <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                <Calendar className={cn("w-3.5 h-3.5", dateFilter ? "text-orange-500" : 
                  isPastel ? "text-[#7B7E9C]" :
                  isDark ? "text-neutral-500" : "text-gray-500")} />
              </Button>
            </PopoverTrigger>
            <PopoverContent className={cn("w-auto p-3", 
              isPastel ? "bg-[#3A3D5C] border-[#4A4D6C]" :
              isDark ? "bg-neutral-800 border-neutral-700" : "bg-white")} align="end">
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className={cn("text-xs mb-1 block", 
                      isPastel ? "text-[#D0D2E0]" :
                      isDark ? "text-neutral-300" : "text-gray-700")}>From</Label>
                    <Input
                      type="date"
                      value={tempDateFilter?.from ? format(tempDateFilter.from, 'yyyy-MM-dd') : ''}
                      onChange={(e) => {
                        const newDate = e.target.value ? new Date(e.target.value) : null;
                        setTempDateFilter(newDate ? { ...tempDateFilter, from: newDate } : null);
                      }}
                      className={cn("text-xs h-8",
                        isPastel ? "bg-[#2B2D42] border-[#4A4D6C] text-white" :
                        isDark ? "bg-neutral-900 border-neutral-700 text-white" : "bg-white")}
                    />
                  </div>
                  <div>
                    <Label className={cn("text-xs mb-1 block", 
                      isPastel ? "text-[#D0D2E0]" :
                      isDark ? "text-neutral-300" : "text-gray-700")}>To</Label>
                    <Input
                      type="date"
                      value={tempDateFilter?.to ? format(tempDateFilter.to, 'yyyy-MM-dd') : ''}
                      onChange={(e) => {
                        const newDate = e.target.value ? new Date(e.target.value) : null;
                        setTempDateFilter(newDate ? { ...tempDateFilter, to: newDate } : null);
                      }}
                      className={cn("text-xs h-8",
                        isPastel ? "bg-[#2B2D42] border-[#4A4D6C] text-white" :
                        isDark ? "bg-neutral-900 border-neutral-700 text-white" : "bg-white")}
                    />
                  </div>
                </div>
                <CalendarComponent
                  mode="range"
                  selected={tempDateFilter || dateFilter}
                  onSelect={setTempDateFilter}
                  className={cn("rdp-months",
                    isPastel ? "text-[#E8E9F0]" :
                    isDark ? "text-white" : "text-gray-900")}
                  classNames={{
                    months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                    month: "space-y-4",
                    caption: cn("flex justify-center pt-1 relative items-center",
                      isPastel ? "text-[#E8E9F0]" :
                      isDark ? "text-white" : "text-gray-900"),
                    caption_label: "text-sm font-medium",
                    nav: "space-x-1 flex items-center",
                    nav_button: cn("h-7 w-7 bg-transparent p-0 opacity-70 hover:opacity-100",
                      isPastel ? "text-[#D0D2E0]" :
                      isDark ? "text-white" : "text-gray-900"),
                    table: "w-full border-collapse space-y-1",
                    head_row: "flex",
                    head_cell: cn("rounded-md w-9 font-normal text-[0.8rem]",
                      isPastel ? "text-[#9B9EBC]" :
                      isDark ? "text-neutral-400" : "text-gray-500"),
                    row: "flex w-full mt-2",
                    cell: "text-center text-sm p-0 relative",
                    day: cn("h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-opacity-10",
                      isPastel ? "text-[#E8E9F0] hover:bg-white" :
                      isDark ? "text-white hover:bg-white" : "text-gray-900 hover:bg-gray-100"),
                    day_selected: cn("text-white font-semibold",
                      isPastel ? "bg-[#9B8B6B]" :
                      "bg-orange-500"),
                    day_today: cn("font-bold",
                      isPastel ? "text-[#9B8B6B]" :
                      isDark ? "text-orange-400" : "text-orange-600"),
                    day_outside: "opacity-50",
                    day_disabled: "opacity-50",
                    day_range_middle: cn("aria-selected:bg-opacity-50",
                      isPastel ? "aria-selected:bg-[#9B8B6B]" :
                      "aria-selected:bg-orange-200 aria-selected:text-gray-900"),
                    day_hidden: "invisible"
                  }}
                />
                <div className="flex gap-2">
                  {dateFilter && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => {
                        onDateFilter(null);
                        setTempDateFilter(null);
                      }}
                      className={cn("flex-1 text-xs",
                        isPastel ? "text-[#D0D2E0] hover:text-white" :
                        isDark ? "text-neutral-400 hover:text-white" : "")}
                    >
                      Clear Filter
                    </Button>
                  )}
                  <Button 
                    size="sm"
                    onClick={() => {
                      if (tempDateFilter) {
                        onDateFilter(tempDateFilter);
                      }
                    }}
                    className={cn("flex-1 text-xs",
                      isPastel ? "bg-[#9B8B6B] hover:bg-[#8B7B5B] text-white" :
                      "bg-orange-600 hover:bg-orange-700 text-white")}
                  >
                    Apply
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setShowSearch(!showSearch)}
            className="h-7 w-7 p-0"
          >
            <Search className={cn("w-3.5 h-3.5", searchFilter ? "text-orange-500" : 
              isPastel ? "text-[#7B7E9C]" :
              isDark ? "text-neutral-500" : "text-gray-500")} />
          </Button>
        </div>
      </div>

      {showKeywords && sectorKeywords && sectorKeywords.length > 0 && (
        <div className={cn("mb-3 pb-2 border-b overflow-x-auto",
          isPastel ? "border-[#4A4D6C]" :
          isDark ? "border-neutral-800" : "border-gray-200")}>
          <div className="flex items-center gap-2 min-w-max">
            <button
              onClick={() => setActiveKeyword('all')}
              className={cn(
                "px-2.5 py-1 text-xs font-medium transition-all whitespace-nowrap",
                activeKeyword === 'all'
                  ? (isPastel ? "bg-[#9B8B6B] text-white" : "bg-orange-500 text-white")
                  : (isPastel ? "bg-[#4A4D6C] text-[#D0D2E0] hover:bg-[#5A5D7C]" :
                    isDark ? "bg-neutral-800 text-neutral-400 hover:bg-neutral-700" : "bg-gray-100 text-gray-700 hover:bg-gray-200")
              )}
            >
              All
            </button>
            {sectorKeywords.map((keyword, idx) => (
              <button
                key={idx}
                onClick={() => setActiveKeyword(keyword)}
                className={cn(
                  "px-2.5 py-1 text-xs font-medium transition-all whitespace-nowrap",
                  activeKeyword === keyword
                    ? (isPastel ? "bg-[#9B8B6B] text-white" : "bg-orange-500 text-white")
                    : (isPastel ? "bg-[#4A4D6C] text-[#D0D2E0] hover:bg-[#5A5D7C]" :
                      isDark ? "bg-neutral-800 text-neutral-400 hover:bg-neutral-700" : "bg-gray-100 text-gray-700 hover:bg-gray-200")
                )}
              >
                {keyword}
              </button>
            ))}
          </div>
        </div>
      )}

      {showSearch && (
        <div className="mb-3">
          <div className="relative">
            <Input
              placeholder="Search articles..."
              value={searchFilter}
              onChange={(e) => onSearchFilter(e.target.value)}
              className={cn("pr-8 text-sm h-8", 
                isPastel ? "bg-[#32354C] border-[#4A4D6C] text-white" :
                isDark ? "bg-neutral-800 border-neutral-700" : "bg-gray-50")}
            />
            {searchFilter && (
              <button
                onClick={() => onSearchFilter('')}
                className="absolute right-2 top-1/2 -translate-y-1/2"
              >
                <X className={cn("w-3.5 h-3.5", 
                  isPastel ? "text-[#7B7E9C]" :
                  isDark ? "text-neutral-500" : "text-gray-500")} />
              </button>
            )}
          </div>
        </div>
      )}
      
      {displayArticles.length > 0 ? (
        <>
          <div className="flex-1 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
            {paginatedArticles.map((article, idx) => (
              viewMode === 'compact' ? (
                <a
                  key={idx}
                  href={article.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "block px-2.5 py-1.5 rounded border transition-all",
                    isPastel ? "bg-[#4A4D6C]/30 border-[#5A5D7C]/50 hover:border-[#6A6D8C] hover:bg-[#4A4D6C]/50" :
                    isDark ? "bg-neutral-800/30 border-neutral-800/50 hover:border-neutral-700 hover:bg-neutral-800/50" : "bg-gray-50/50 border-gray-100 hover:border-gray-200 hover:bg-gray-50"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-1 min-w-0 flex items-center gap-2">
                      <h4 className={cn("text-sm font-medium truncate", 
                        isPastel ? "text-[#E8E9F0]" :
                        isDark ? "text-neutral-200" : "text-gray-800")}>
                        {cleanTitle(article.title)}
                      </h4>
                      {article.originLevelId && article.displayLevelId && article.originLevelId !== article.displayLevelId && (
                        <span className={cn("text-[9px] px-1.5 py-0.5 rounded font-medium whitespace-nowrap",
                          isPastel ? "bg-[#9B8B6B]/20 text-[#9B8B6B]" :
                          "bg-orange-500/20 text-orange-500")}>
                          {article.originLevelLabel}
                        </span>
                      )}
                      <span className={cn("text-xs whitespace-nowrap", 
                        isPastel ? "text-[#9B9EBC]" :
                        isDark ? "text-neutral-600" : "text-gray-400")}>
                        {article.source}
                      </span>
                      {article.pubDate && (
                        <span className={cn("text-xs whitespace-nowrap", 
                          isPastel ? "text-[#7B7E9C]" :
                          isDark ? "text-neutral-700" : "text-gray-400")}>
                          {format(new Date(article.pubDate), 'MMM d')}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onSaveArticle(article);
                      }}
                      className={cn(
                        "p-1 rounded hover:bg-orange-500/10 transition-all",
                        savedArticleIds?.includes(article.link) 
                          ? "text-orange-500 rotate-45" 
                          : isDark 
                            ? "text-neutral-500 hover:text-orange-500" 
                            : "text-gray-400 hover:text-orange-500"
                      )}
                    >
                      <Plus className="w-4 h-4 transition-transform" />
                    </button>
                  </div>
                </a>
              ) : (
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
                     <div className="flex items-center gap-2">
                       <h4 className={cn("text-sm font-medium line-clamp-1", 
                         isPastel ? "text-[#E8E9F0]" :
                         isDark ? "text-neutral-200" : "text-gray-800")}>
                         {cleanTitle(article.title)}
                       </h4>
                       {article.originLevelId && article.displayLevelId && article.originLevelId !== article.displayLevelId && (
                         <span className={cn("text-[9px] px-1.5 py-0.5 rounded font-medium whitespace-nowrap flex-shrink-0",
                           isPastel ? "bg-[#9B8B6B]/20 text-[#9B8B6B]" :
                           "bg-orange-500/20 text-orange-500")}>
                           {article.originLevelLabel}
                         </span>
                       )}
                     </div>
                     <div className="flex items-center gap-2 mt-0.5">
                       <span className={cn("text-xs", 
                         isPastel ? "text-[#9B9EBC]" :
                         isDark ? "text-neutral-500" : "text-gray-500")}>{article.source}</span>
                       {article.pubDate && (
                         <span className={cn("text-xs", 
                           isPastel ? "text-[#7B7E9C]" :
                           isDark ? "text-neutral-600" : "text-gray-400")}>
                           {format(new Date(article.pubDate), 'MMM d, h:mm a')}
                         </span>
                       )}
                     </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onSaveArticle(article);
                      }}
                      className={cn(
                        "p-1 rounded hover:bg-orange-500/10 transition-all",
                        savedArticleIds?.includes(article.link) 
                          ? "text-orange-500 rotate-45" 
                          : isDark 
                            ? "text-neutral-500 hover:text-orange-500" 
                            : "text-gray-400 hover:text-orange-500"
                      )}
                    >
                      <Plus className="w-4 h-4 transition-transform" />
                    </button>
                  </div>
                </a>
              )
            ))}
          </div>
          {totalPages > 1 && (
            <div className={cn("flex items-center justify-between pt-3 border-t", 
              isPastel ? "border-[#4A4D6C]" :
              isDark ? "border-neutral-800" : "border-gray-200")}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="h-7 text-xs"
              >
                <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                Previous
              </Button>
              <span className={cn("text-xs", 
                isPastel ? "text-[#9B9EBC]" :
                isDark ? "text-neutral-500" : "text-gray-500")}>
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="h-7 text-xs"
              >
                Next
                <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          )}
        </>
      ) : (
        <p className={cn("text-sm py-8 text-center", 
          isPastel ? "text-[#9B9EBC]" :
          isDark ? "text-neutral-500" : "text-gray-500")}>
          {sectorName 
            ? `No articles found for ${sectorName}. Add RSS sources in settings or clear and refresh this level.`
            : 'No articles available. Add RSS sources in settings.'}
        </p>
      )}
    </div>
  );
}