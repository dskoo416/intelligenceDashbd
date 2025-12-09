import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, ChevronDown, Calendar, Search } from 'lucide-react';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";

import SavedSidebar from '@/components/saved/SavedSidebar';
import CollectionsModal from '@/components/saved/CollectionsModal';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function Saved({ sidebarOpen, activeView: propActiveView, onSelectView: propOnSelectView, onAddToHistory }) {
  const queryClient = useQueryClient();
  const activeView = propActiveView || 'main';
  const setActiveView = propOnSelectView || (() => {});
  const [collectionsModalOpen, setCollectionsModalOpen] = useState(false);
  const [dateFilter, setDateFilter] = useState(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [viewMode, setViewMode] = useState(
    () => localStorage.getItem('savedViewMode') || 'compact'
  );

  const { data: savedArticles = [], isLoading } = useQuery({
    queryKey: ['savedArticles'],
    queryFn: () => base44.entities.SavedArticle.list('-created_date'),
  });

  const { data: collections = [] } = useQuery({
    queryKey: ['collections'],
    queryFn: () => base44.entities.Collection.list('order'),
  });

  const { data: settingsData = [] } = useQuery({
    queryKey: ['appSettings'],
    queryFn: () => base44.entities.AppSettings.list(),
  });

  const settings = settingsData[0] || { theme: 'dark' };
  const isDark = settings.theme === 'dark';
  const isPastel = settings.theme === 'pastel';

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.SavedArticle.delete(id),
    onSuccess: (_, id) => {
      const deletedArticle = savedArticles.find(a => a.id === id);
      if (deletedArticle && onAddToHistory) {
        onAddToHistory({
          type: 'delete',
          id: id,
          data: deletedArticle
        });
      }
      queryClient.invalidateQueries({ queryKey: ['savedArticles'] });
      toast.success('Article removed');
    },
  });

  const updateArticleCollections = useMutation({
    mutationFn: ({ id, collectionIds, oldCollectionIds }) =>
      base44.entities.SavedArticle.update(id, { collection_ids: collectionIds }),
    onSuccess: (_, { id, collectionIds, oldCollectionIds }) => {
      if (onAddToHistory) {
        onAddToHistory({
          type: 'updateCollections',
          id: id,
          oldCollectionIds: oldCollectionIds,
          newCollectionIds: collectionIds
        });
      }
      queryClient.invalidateQueries({ queryKey: ['savedArticles'] });
      toast.success('Collections updated');
    },
  });

  const collectionMutation = useMutation({
    mutationFn: async (data) => {
      if (data.id) {
        return base44.entities.Collection.update(data.id, data);
      } else {
        const maxOrder = Math.max(0, ...collections.map((c) => c.order || 0));
        return base44.entities.Collection.create({ ...data, order: maxOrder + 1 });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      toast.success('Collection saved');
    },
  });

  const deleteCollectionMutation = useMutation({
    mutationFn: (id) => base44.entities.Collection.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      toast.success('Collection deleted');
    },
  });

  const handleReorderCollections = async (fromIndex, toIndex) => {
    const sortedCollections = [...collections].sort(
      (a, b) => (a.order || 0) - (b.order || 0)
    );
    const reordered = [...sortedCollections];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);

    const updates = reordered.map((collection, i) =>
      base44.entities.Collection.update(collection.id, { order: i + 1 })
    );
    await Promise.all(updates);
    queryClient.invalidateQueries({ queryKey: ['collections'] });
  };

  const handleToggleCollection = (article, collectionId) => {
    const currentCollections = article.collection_ids || [];
    const newCollections = currentCollections.includes(collectionId)
      ? currentCollections.filter((id) => id !== collectionId)
      : [...currentCollections, collectionId];
    updateArticleCollections.mutate({ 
      id: article.id, 
      collectionIds: newCollections,
      oldCollectionIds: currentCollections
    });
  };

  // Filter articles based on active view
  let filteredArticles = savedArticles;
  if (activeView.startsWith('collection-')) {
    const collectionId = activeView.replace('collection-', '');
    filteredArticles = savedArticles.filter((a) =>
      a.collection_ids?.includes(collectionId)
    );
  } else if (activeView.startsWith('month-')) {
    const monthKey = activeView.replace('month-', '');
    filteredArticles = savedArticles.filter((a) => {
      const date = new Date(a.pubDate || a.created_date);
      const articleMonthKey = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, '0')}`;
      return articleMonthKey === monthKey;
    });
  }

  // Apply date and search filters
  filteredArticles = filteredArticles.filter((a) => {
    if (dateFilter && a.pubDate) {
      const articleDate = new Date(a.pubDate);
      if (dateFilter.from && dateFilter.to) {
        const fromDate = new Date(dateFilter.from);
        const toDate = new Date(dateFilter.to);
        if (articleDate < fromDate || articleDate > toDate) return false;
      } else if (dateFilter.from) {
        const fromDate = new Date(dateFilter.from);
        if (articleDate.toDateString() !== fromDate.toDateString()) return false;
      }
    }
    if (searchFilter) {
      const searchLower = searchFilter.toLowerCase();
      if (searchFilter.includes(',')) {
        const keywords = searchFilter
          .split(',')
          .map(k => k.trim().toLowerCase())
          .filter(k => k.length > 0);
        const matchesAll = keywords.every(
          keyword =>
            a.title.toLowerCase().includes(keyword) ||
            a.description?.toLowerCase().includes(keyword)
        );
        if (!matchesAll) return false;
      } else {
        if (
          !a.title.toLowerCase().includes(searchLower) &&
          !a.description?.toLowerCase().includes(searchLower)
        ) {
          return false;
        }
      }
    }
    return true;
  });

  const textSize = localStorage.getItem('textSize') || 'medium';
  
  return (
    <main className={cn("flex-1 overflow-y-auto p-5 text-content", `text-${textSize}`, 
      isPastel ? "bg-[#2B2D42]" :
      isDark ? "bg-neutral-950" : "bg-gray-50")}>
        <div className="w-full">
          <div className="flex items-center justify-between mb-6">
            <h1 className={cn("text-2xl font-bold", 
              isPastel ? "text-white" :
              isDark ? "text-white" : "text-gray-900")}>
              {activeView === 'main'
                ? 'Main'
                : activeView.startsWith('collection-')
                  ? collections.find(
                      (c) => c.id === activeView.replace('collection-', '')
                    )?.name
                  : activeView.startsWith('month-')
                    ? savedArticles.find((a) => {
                        const date = new Date(a.pubDate || a.created_date);
                        return (
                          `${date.getFullYear()}-${String(
                            date.getMonth() + 1
                          ).padStart(2, '0')}` ===
                          activeView.replace('month-', '')
                        );
                      }) &&
                      new Date(
                        savedArticles.find((a) => {
                          const date = new Date(a.pubDate || a.created_date);
                          return (
                            `${date.getFullYear()}-${String(
                              date.getMonth() + 1
                            ).padStart(2, '0')}` ===
                            activeView.replace('month-', '')
                          );
                        })?.pubDate || savedArticles[0]?.created_date
                      ).toLocaleDateString('en-US', {
                        month: 'long',
                        year: 'numeric',
                      })
                    : 'Saved Articles'}
            </h1>

            <div className="flex items-center gap-2">
              <span className={cn("text-xs", 
                isPastel ? "text-[#9B9EBC]" :
                isDark ? "text-neutral-600" : "text-gray-400")}>
                {filteredArticles.length} articles
              </span>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                    <Calendar
                      className={cn(
                        "w-3.5 h-3.5",
                        dateFilter
                          ? "text-orange-500"
                          : isPastel
                            ? "text-[#7B7E9C]"
                            : isDark
                              ? "text-neutral-500"
                              : "text-gray-500"
                      )}
                    />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className={cn(
                    "w-auto p-3",
                    isPastel ? "bg-[#3A3D5C] border-[#4A4D6C]" :
                    isDark ? "bg-neutral-800 border-neutral-700" : "bg-white"
                  )}
                  align="end"
                >
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label
                          className={cn(
                            "text-xs mb-1",
                            isDark ? "text-neutral-400" : "text-gray-600"
                          )}
                        >
                          From
                        </Label>
                        <Input
                          type="date"
                          value={
                            dateFilter?.from ? format(dateFilter.from, 'yyyy-MM-dd') : ''
                          }
                          onChange={(e) => {
                            const newDate = e.target.value
                              ? new Date(e.target.value)
                              : null;
                            setDateFilter(
                              newDate ? { ...dateFilter, from: newDate } : null
                            );
                          }}
                          className={cn(
                            "text-xs h-8",
                            isDark
                              ? "bg-neutral-900 border-neutral-700 text-white"
                              : "bg-white"
                          )}
                        />
                      </div>
                      <div>
                        <Label
                          className={cn(
                            "text-xs mb-1",
                            isDark ? "text-neutral-400" : "text-gray-600"
                          )}
                        >
                          To
                        </Label>
                        <Input
                          type="date"
                          value={
                            dateFilter?.to ? format(dateFilter.to, 'yyyy-MM-dd') : ''
                          }
                          onChange={(e) => {
                            const newDate = e.target.value
                              ? new Date(e.target.value)
                              : null;
                            setDateFilter(
                              newDate ? { ...dateFilter, to: newDate } : null
                            );
                          }}
                          className={cn(
                            "text-xs h-8",
                            isDark
                              ? "bg-neutral-900 border-neutral-700 text-white"
                              : "bg-white"
                          )}
                        />
                      </div>
                    </div>
                    <CalendarComponent
                      mode="range"
                      selected={dateFilter}
                      onSelect={setDateFilter}
                      className={isDark ? "text-white" : ""}
                    />
                    {dateFilter && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDateFilter(null)}
                        className="w-full text-xs"
                      >
                        Clear Filter
                      </Button>
                    )}
                  </div>
                </PopoverContent>
              </Popover>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSearch(!showSearch)}
                className="h-7 w-7 p-0"
              >
                <Search
                  className={cn(
                    "w-3.5 h-3.5",
                    searchFilter
                      ? "text-orange-500"
                      : isPastel
                        ? "text-[#7B7E9C]"
                        : isDark
                          ? "text-neutral-500"
                          : "text-gray-500"
                  )}
                />
              </Button>
            </div>
          </div>

          {showSearch && (
            <div className="mb-4">
              <div className="relative">
                <Input
                  placeholder="Search articles... (use commas for multiple keywords: battery, tesla, oil)"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className={cn(
                    "pr-8 text-sm h-8",
                    isPastel ? "bg-[#32354C] border-[#4A4D6C] text-white" :
                    isDark ? "bg-neutral-800 border-neutral-700" : "bg-gray-50"
                  )}
                />
                {searchFilter && (
                  <button
                    onClick={() => setSearchFilter('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                  >
                    <X
                      className={cn(
                        "w-3.5 h-3.5",
                        isPastel ? "text-[#7B7E9C]" :
                        isDark ? "text-neutral-500" : "text-gray-500"
                      )}
                    />
                  </button>
                )}
              </div>
            </div>
          )}

          {isLoading ? (
            <div className={cn("text-sm", 
              isPastel ? "text-[#D0D2E0]" :
              isDark ? "text-neutral-400" : "text-gray-500")}>
              Loading...
            </div>
          ) : filteredArticles.length === 0 ? (
            <div
              className={cn(
                "text-center py-12 text-sm",
                isPastel ? "text-[#9B9EBC]" :
                isDark ? "text-neutral-500" : "text-gray-500"
              )}
            >
              No saved articles in this view yet.
            </div>
          ) : (
            <div className="space-y-1">
              {filteredArticles.map((article) =>
                viewMode === 'compact' ? (
                  <div
                    key={article.id}
                    className={cn(
                      "flex items-center gap-3 w-full rounded border px-4 py-2.5 transition-all",
                      isPastel
                        ? "bg-[#4A4D6C]/30 border-[#5A5D7C]/50 hover:border-[#6A6D8C] hover:bg-[#4A4D6C]/50"
                        : isDark
                          ? "bg-neutral-800/30 border-neutral-800/50 hover:border-neutral-700 hover:bg-neutral-800/50"
                          : "bg-gray-50/50 border-gray-100 hover:border-gray-200 hover:bg-gray-50"
                    )}
                  >
                    <a
                      href={article.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 min-w-0 flex items-center gap-2"
                    >
                      {/* title gets full remaining width */}
                      <h3
                        className={cn(
                          "flex-1 text-sm font-medium truncate",
                          isPastel ? "text-[#E8E9F0]" :
                          isDark ? "text-neutral-200" : "text-gray-800"
                        )}
                      >
                        {article.title}
                      </h3>

                      {/* meta does not shrink, stays on right */}
                      <span
                        className={cn(
                          "text-xs whitespace-nowrap flex-shrink-0",
                          isPastel ? "text-[#9B9EBC]" :
                          isDark ? "text-neutral-600" : "text-gray-400"
                        )}
                      >
                        {article.source}
                      </span>

                      {article.pubDate && (
                        <span
                          className={cn(
                            "text-xs whitespace-nowrap flex-shrink-0",
                            isPastel ? "text-[#7B7E9C]" :
                            isDark ? "text-neutral-700" : "text-gray-400"
                          )}
                        >
                          {format(new Date(article.pubDate), "MMM d")}
                        </span>
                      )}
                    </a>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      {collections.length > 0 && (
                        <Popover>
                          <PopoverTrigger asChild>
                            <button
                              className={cn(
                                "p-1 rounded hover:bg-orange-500/10 transition-all",
                                article.collection_ids?.length > 0
                                  ? "text-orange-500"
                                  : isPastel
                                    ? "text-[#7B7E9C] hover:text-orange-500"
                                    : isDark
                                      ? "text-neutral-500 hover:text-orange-500"
                                      : "text-gray-400 hover:text-orange-500"
                              )}
                            >
                              <ChevronDown className="w-4 h-4" />
                            </button>
                          </PopoverTrigger>

                          <PopoverContent
                            className={cn(
                              "w-56",
                              isDark
                                ? "bg-neutral-800 border-neutral-700"
                                : "bg-white"
                            )}
                            align="end"
                          >
                            <div className="space-y-2">
                              <p
                                className={cn(
                                  "text-xs font-medium",
                                  isDark ? "text-neutral-300" : "text-gray-700"
                                )}
                              >
                                Add to collections:
                              </p>

                              {collections.map((collection) => (
                                <div
                                  key={collection.id}
                                  className="flex items-center gap-2"
                                >
                                  <Checkbox
                                    checked={article.collection_ids?.includes(
                                      collection.id
                                    )}
                                    onCheckedChange={() =>
                                      handleToggleCollection(
                                        article,
                                        collection.id
                                      )
                                    }
                                  />
                                  <span
                                    className={cn(
                                      "text-xs",
                                      isDark ? "text-white" : "text-gray-900"
                                    )}
                                  >
                                    {collection.name}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </PopoverContent>
                        </Popover>
                      )}

                      <button
                        onClick={() => deleteMutation.mutate(article.id)}
                        className={cn(
                          "p-1 rounded hover:bg-orange-500/10 transition-all",
                          isPastel
                            ? "text-[#7B7E9C] hover:text-orange-500"
                            : isDark
                              ? "text-neutral-500 hover:text-orange-500"
                              : "text-gray-400 hover:text-orange-500"
                        )}
                      >
                        <X className="w-4 h-4 transition-transform" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    key={article.id}
                    className={cn(
                      "rounded p-4 flex items-start justify-between gap-4 w-full border",
                      isDark
                        ? "bg-neutral-900 border-neutral-800"
                        : "bg-white border-gray-200"
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <a
                        href={article.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                          "font-medium text-sm transition-colors",
                          isDark
                            ? "text-white hover:text-orange-400"
                            : "text-gray-900 hover:text-orange-500"
                        )}
                      >
                        {article.title}
                      </a>

                      {article.description && (
                        <p
                          className={cn(
                            "text-xs mt-1 line-clamp-2",
                            isDark ? "text-neutral-400" : "text-gray-600"
                          )}
                        >
                          {article.description}
                        </p>
                      )}

                      <div className="flex items-center gap-3 mt-2">
                        <span
                          className={cn(
                            "text-xs",
                            isDark ? "text-neutral-500" : "text-gray-500"
                          )}
                        >
                          {article.source}
                        </span>
                        {article.sector && (
                          <span
                            className={cn(
                              "text-xs",
                              isDark ? "text-neutral-600" : "text-gray-400"
                            )}
                          >
                            • {article.sector}
                          </span>
                        )}
                        {article.pubDate && (
                          <span
                            className={cn(
                              "text-xs",
                              isDark ? "text-neutral-600" : "text-gray-400"
                            )}
                          >
                            • {new Date(article.pubDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {collections.length > 0 && (
                        <Popover>
                          <PopoverTrigger asChild>
                            <button
                              className={cn(
                                "transition-colors",
                                article.collection_ids?.length > 0
                                  ? "text-orange-500"
                                  : isDark
                                    ? "text-neutral-500 hover:text-white"
                                    : "text-gray-400 hover:text-gray-700"
                              )}
                            >
                              <ChevronDown className="w-4 h-4" />
                            </button>
                          </PopoverTrigger>

                          <PopoverContent
                            className={cn(
                              "w-56",
                              isDark
                                ? "bg-neutral-800 border-neutral-700"
                                : "bg-white"
                            )}
                            align="end"
                          >
                            <div className="space-y-2">
                              <p
                                className={cn(
                                  "text-xs font-medium",
                                  isDark ? "text-neutral-300" : "text-gray-700"
                                )}
                              >
                                Add to collections:
                              </p>

                              {collections.map((collection) => (
                                <div
                                  key={collection.id}
                                  className="flex items-center gap-2"
                                >
                                  <Checkbox
                                    checked={article.collection_ids?.includes(
                                      collection.id
                                    )}
                                    onCheckedChange={() =>
                                      handleToggleCollection(
                                        article,
                                        collection.id
                                      )
                                    }
                                  />
                                  <span
                                    className={cn(
                                      "text-xs",
                                      isDark ? "text-white" : "text-gray-900"
                                    )}
                                  >
                                    {collection.name}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </PopoverContent>
                        </Popover>
                      )}

                      <button
                        onClick={() => deleteMutation.mutate(article.id)}
                        className={cn(
                          "transition-colors",
                          isDark
                            ? "text-neutral-500 hover:text-red-400"
                            : "text-gray-400 hover:text-red-500"
                        )}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </main>
  );
}