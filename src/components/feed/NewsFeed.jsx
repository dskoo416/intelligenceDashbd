import React, { useState } from 'react';
import { format } from 'date-fns';
import { Plus, Calendar, Search, X, RefreshCw, LayoutList, List, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export default function NewsFeed({ articles, isLoading, onSaveArticle, onDateFilter, onSearchFilter, dateFilter, searchFilter, sectorName, savedArticleIds, theme, onRefresh }) {
  const isDark = theme === 'dark';
  const [showSearch, setShowSearch] = useState(false);
  const [viewMode, setViewMode] = useState('regular');
  const [currentPage, setCurrentPage] = useState(1);
  const articlesPerPage = 20;
  
  const totalPages = Math.ceil(articles.length / articlesPerPage);
  const startIndex = (currentPage - 1) * articlesPerPage;
  const endIndex = startIndex + articlesPerPage;
  const paginatedArticles = articles.slice(startIndex, endIndex);

  return (
    <div className={cn(
      "rounded border p-4 flex-1 overflow-hidden flex flex-col",
      isDark ? "bg-neutral-900/50 border-neutral-800" : "bg-white border-gray-200"
    )}>
      <div className="flex items-center justify-between mb-3">
        <h3 className={cn("text-xs font-semibold uppercase tracking-wider", isDark ? "text-neutral-400" : "text-gray-500")}>
          {sectorName ? `${sectorName} News` : 'Most Recent'}
        </h3>
        <div className="flex items-center gap-2">
          <span className={cn("text-xs", isDark ? "text-neutral-600" : "text-gray-400")}>
            {articles.length} articles
          </span>

          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onRefresh}
            className="h-7 w-7 p-0"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", isDark ? "text-neutral-500" : "text-gray-500")} />
          </Button>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                <Calendar className={cn("w-3.5 h-3.5", dateFilter ? "text-orange-500" : isDark ? "text-neutral-500" : "text-gray-500")} />
              </Button>
            </PopoverTrigger>
            <PopoverContent className={cn("w-auto p-0", isDark ? "bg-neutral-800 border-neutral-700" : "bg-white")} align="end">
              <CalendarComponent
                mode="range"
                selected={dateFilter}
                onSelect={onDateFilter}
                className={isDark ? "text-white" : ""}
              />
              {dateFilter && (
                <div className="p-2 border-t border-neutral-700">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => onDateFilter(null)}
                    className="w-full text-xs"
                  >
                    Clear Filter
                  </Button>
                </div>
              )}
            </PopoverContent>
          </Popover>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                {viewMode === 'regular' ? (
                  <LayoutList className={cn("w-3.5 h-3.5", isDark ? "text-neutral-500" : "text-gray-500")} />
                ) : (
                  <List className={cn("w-3.5 h-3.5", isDark ? "text-neutral-500" : "text-gray-500")} />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className={cn(isDark ? "bg-neutral-800 border-neutral-700" : "bg-white")} align="end">
              <DropdownMenuItem 
                onClick={() => setViewMode('regular')}
                className={cn(isDark ? "text-white focus:bg-neutral-700" : "focus:bg-gray-100")}
              >
                <LayoutList className="w-4 h-4 mr-2" />
                Regular View
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setViewMode('compact')}
                className={cn(isDark ? "text-white focus:bg-neutral-700" : "focus:bg-gray-100")}
              >
                <List className="w-4 h-4 mr-2" />
                Compact View
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setShowSearch(!showSearch)}
            className="h-7 w-7 p-0"
          >
            <Search className={cn("w-3.5 h-3.5", searchFilter ? "text-orange-500" : isDark ? "text-neutral-500" : "text-gray-500")} />
          </Button>
        </div>
      </div>

      {showSearch && (
        <div className="mb-3">
          <div className="relative">
            <Input
              placeholder="Search articles..."
              value={searchFilter}
              onChange={(e) => onSearchFilter(e.target.value)}
              className={cn("pr-8 text-sm h-8", isDark ? "bg-neutral-800 border-neutral-700" : "bg-gray-50")}
            />
            {searchFilter && (
              <button
                onClick={() => onSearchFilter('')}
                className="absolute right-2 top-1/2 -translate-y-1/2"
              >
                <X className={cn("w-3.5 h-3.5", isDark ? "text-neutral-500" : "text-gray-500")} />
              </button>
            )}
          </div>
        </div>
      )}
      
      {isLoading ? (
        <div className="py-8">
          <span className={cn("text-sm", isDark ? "text-neutral-400" : "text-gray-500")}>Fetching news...</span>
        </div>
      ) : articles.length > 0 ? (
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
                    isDark 
                      ? "bg-neutral-800/30 border-neutral-800/50 hover:border-neutral-700 hover:bg-neutral-800/50" 
                      : "bg-gray-50/50 border-gray-100 hover:border-gray-200 hover:bg-gray-50"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-1 min-w-0 flex items-center gap-2">
                      <h4 className={cn("text-sm font-medium truncate", isDark ? "text-neutral-200" : "text-gray-800")}>
                        {article.title}
                      </h4>
                      <span className={cn("text-xs whitespace-nowrap", isDark ? "text-neutral-600" : "text-gray-400")}>
                        {article.source}
                      </span>
                      {article.pubDate && (
                        <span className={cn("text-xs whitespace-nowrap", isDark ? "text-neutral-700" : "text-gray-400")}>
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
            <div className={cn("flex items-center justify-between pt-3 border-t", isDark ? "border-neutral-800" : "border-gray-200")}>
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
              <span className={cn("text-xs", isDark ? "text-neutral-500" : "text-gray-500")}>
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
        <p className={cn("text-sm py-8", isDark ? "text-neutral-500" : "text-gray-500")}>
          No articles available. Add RSS sources in settings.
        </p>
      )}
    </div>
  );
}