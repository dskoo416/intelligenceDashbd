import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, ChevronDown, Calendar, Search, LayoutList, List } from 'lucide-react';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import SavedSidebar from '@/components/saved/SavedSidebar';
import CollectionsModal from '@/components/saved/CollectionsModal';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function Saved({ sidebarOpen }) {
  const queryClient = useQueryClient();
  const [activeView, setActiveView] = useState('main');
  const [collectionsModalOpen, setCollectionsModalOpen] = useState(false);
  const [dateFilter, setDateFilter] = useState(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [viewMode, setViewMode] = useState(() => localStorage.getItem('savedViewMode') || 'compact');

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

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.SavedArticle.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedArticles'] });
      toast.success('Article removed');
    },
  });

  const updateArticleCollections = useMutation({
    mutationFn: ({ id, collectionIds }) => base44.entities.SavedArticle.update(id, { collection_ids: collectionIds }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedArticles'] });
      toast.success('Collections updated');
    },
  });

  const collectionMutation = useMutation({
    mutationFn: async (data) => {
      if (data.id) {
        return base44.entities.Collection.update(data.id, data);
      } else {
        const maxOrder = Math.max(0, ...collections.map(c => c.order || 0));
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
    const sortedCollections = [...collections].sort((a, b) => (a.order || 0) - (b.order || 0));
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
      ? currentCollections.filter(id => id !== collectionId)
      : [...currentCollections, collectionId];
    updateArticleCollections.mutate({ id: article.id, collectionIds: newCollections });
  };

  // Filter articles based on active view
  let filteredArticles = savedArticles;
  if (activeView.startsWith('collection-')) {
    const collectionId = activeView.replace('collection-', '');
    filteredArticles = savedArticles.filter(a => a.collection_ids?.includes(collectionId));
  } else if (activeView.startsWith('month-')) {
    const monthKey = activeView.replace('month-', '');
    filteredArticles = savedArticles.filter(a => {
      const date = new Date(a.pubDate || a.created_date);
      const articleMonthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      return articleMonthKey === monthKey;
    });
  }
  // Main view shows all articles

  // Apply date and search filters
  filteredArticles = filteredArticles.filter(a => {
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
      // Check if comma-separated (multi-keyword search)
      if (searchFilter.includes(',')) {
        const keywords = searchFilter.split(',').map(k => k.trim().toLowerCase()).filter(k => k.length > 0);
        // Article must match ALL keywords
        const matchesAll = keywords.every(keyword => 
          a.title.toLowerCase().includes(keyword) || 
          a.description?.toLowerCase().includes(keyword)
        );
        if (!matchesAll) return false;
      } else {
        // Single keyword search
        if (!a.title.toLowerCase().includes(searchLower) && 
            !a.description?.toLowerCase().includes(searchLower)) {
          return false;
        }
      }
    }
    return true;
  });

  return (
    <div className={cn("flex h-full", isDark ? "bg-neutral-950" : "bg-gray-50")}>
      {sidebarOpen && (
        <div className="w-52 flex-shrink-0">
          <SavedSidebar
            savedArticles={savedArticles}
            collections={collections}
            activeView={activeView}
            onSelectView={setActiveView}
            onOpenCollectionsModal={() => setCollectionsModalOpen(true)}
            theme={settings.theme}
          />
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className={cn("text-2xl font-bold", isDark ? "text-white" : "text-gray-900")}>
            {activeView === 'main' ? 'Main' : 
             activeView.startsWith('collection-') ? collections.find(c => c.id === activeView.replace('collection-', ''))?.name :
             activeView.startsWith('month-') ? savedArticles.find(a => {
               const date = new Date(a.pubDate || a.created_date);
               return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}` === activeView.replace('month-', '');
             }) && new Date(savedArticles.find(a => {
               const date = new Date(a.pubDate || a.created_date);
               return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}` === activeView.replace('month-', '');
             })?.pubDate || savedArticles[0]?.created_date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 
             'Saved Articles'}
          </h1>
          <div className="flex items-center gap-2">
            <span className={cn("text-xs", isDark ? "text-neutral-600" : "text-gray-400")}>
              {filteredArticles.length} articles
            </span>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                  <Calendar className={cn("w-3.5 h-3.5", dateFilter ? "text-orange-500" : isDark ? "text-neutral-500" : "text-gray-500")} />
                </Button>
              </PopoverTrigger>
              <PopoverContent className={cn("w-auto p-3", isDark ? "bg-neutral-800 border-neutral-700" : "bg-white")} align="end">
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className={cn("text-xs mb-1", isDark ? "text-neutral-400" : "text-gray-600")}>From</Label>
                      <Input
                        type="date"
                        value={dateFilter?.from ? format(dateFilter.from, 'yyyy-MM-dd') : ''}
                        onChange={(e) => {
                          const newDate = e.target.value ? new Date(e.target.value) : null;
                          setDateFilter(newDate ? { ...dateFilter, from: newDate } : null);
                        }}
                        className={cn("text-xs h-8", isDark ? "bg-neutral-900 border-neutral-700 text-white" : "bg-white")}
                      />
                    </div>
                    <div>
                      <Label className={cn("text-xs mb-1", isDark ? "text-neutral-400" : "text-gray-600")}>To</Label>
                      <Input
                        type="date"
                        value={dateFilter?.to ? format(dateFilter.to, 'yyyy-MM-dd') : ''}
                        onChange={(e) => {
                          const newDate = e.target.value ? new Date(e.target.value) : null;
                          setDateFilter(newDate ? { ...dateFilter, to: newDate } : null);
                        }}
                        className={cn("text-xs h-8", isDark ? "bg-neutral-900 border-neutral-700 text-white" : "bg-white")}
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
                  onClick={() => {
                    setViewMode('regular');
                    localStorage.setItem('savedViewMode', 'regular');
                  }}
                  className={cn(isDark ? "text-white focus:bg-neutral-700" : "focus:bg-gray-100")}
                >
                  <LayoutList className="w-4 h-4 mr-2" />
                  Regular
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => {
                    setViewMode('compact');
                    localStorage.setItem('savedViewMode', 'compact');
                  }}
                  className={cn(isDark ? "text-white focus:bg-neutral-700" : "focus:bg-gray-100")}
                >
                  <List className="w-4 h-4 mr-2" />
                  Compact
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
          <div className="mb-4">
            <div className="relative">
              <Input
                placeholder="Search articles... (use commas for multiple keywords: battery, tesla, oil)"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className={cn("pr-8 text-sm h-8", isDark ? "bg-neutral-800 border-neutral-700" : "bg-gray-50")}
              />
              {searchFilter && (
                <button
                  onClick={() => setSearchFilter('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                >
                  <X className={cn("w-3.5 h-3.5", isDark ? "text-neutral-500" : "text-gray-500")} />
                </button>
              )}
            </div>
          </div>
        )}
        
        {isLoading ? (
          <div className={cn("text-sm", isDark ? "text-neutral-400" : "text-gray-500")}>Loading...</div>
        ) : filteredArticles.length === 0 ? (
          <div className={cn("text-center py-12 text-sm", isDark ? "text-neutral-500" : "text-gray-500")}>
            No saved articles in this view yet.
          </div>
        ) : (
          <div className="space-y-1">
  {filteredArticles.map((article) => (
    viewMode === 'compact' ? (
      <div
        key={article.id}
        className={cn(
          "w-full rounded border p-2.5 flex items-center gap-3 transition-all",
          isDark
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
          <h3 className={cn("text-sm font-medium truncate", isDark ? "text-neutral-200" : "text-gray-800")}>
            {article.title}
          </h3>

          <span className={cn("text-xs whitespace-nowrap", isDark ? "text-neutral-600" : "text-gray-400")}>
            {article.source}
          </span>

          {article.pubDate && (
            <span className={cn("text-xs whitespace-nowrap", isDark ? "text-neutral-700" : "text-gray-400")}>
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
                  isDark ? "bg-neutral-800 border-neutral-700" : "bg-white"
                )}
                align="end"
              >
                <div className="space-y-2">
                  <p className={cn("text-xs font-medium", isDark ? "text-neutral-300" : "text-gray-700")}>
                    Add to collections:
                  </p>

                  {collections.map(collection => (
                    <div key={collection.id} className="flex items-center gap-2">
                      <Checkbox
                        checked={article.collection_ids?.includes(collection.id)}
                        onCheckedChange={() => handleToggleCollection(article, collection.id)}
                      />
                      <span className={cn("text-xs", isDark ? "text-white" : "text-gray-900")}>
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
              isDark
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
          "rounded p-4 flex items-start justify-between gap-4",
          isDark ? "bg-neutral-900 border border-neutral-800" : "bg-white border border-gray-200"
        )}
      >
        <div className="flex-1 min-w-0">
          <a
            href={article.link}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "font-medium text-sm transition-colors",
              isDark ? "text-white hover:text-orange-400" : "text-gray-900 hover:text-orange-500"
            )}
          >
            {article.title}
          </a>

          {article.description && (
            <p className={cn("text-xs mt-1 line-clamp-2", isDark ? "text-neutral-400" : "text-gray-600")}>
              {article.description}
            </p>
          )}

          <div className="flex items-center gap-3 mt-2">
            <span className={cn("text-xs", isDark ? "text-neutral-500" : "text-gray-500")}>
              {article.source}
            </span>
            {article.sector && (
              <span className={cn("text-xs", isDark ? "text-neutral-600" : "text-gray-400")}>
                • {article.sector}
              </span>
            )}
            {article.pubDate && (
              <span className={cn("text-xs", isDark ? "text-neutral-600" : "text-gray-400")}>
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
                className={cn("w-56", isDark ? "bg-neutral-800 border-neutral-700" : "bg-white")}
                align="end"
              >
                <div className="space-y-2">
                  <p className={cn("text-xs font-medium", isDark ? "text-neutral-300" : "text-gray-700")}>
                    Add to collections:
                  </p>

                  {collections.map(collection => (
                    <div key={collection.id} className="flex items-center gap-2">
                      <Checkbox
                        checked={article.collection_ids?.includes(collection.id)}
                        onCheckedChange={() => handleToggleCollection(article, collection.id)}
                      />
                      <span className={cn("text-xs", isDark ? "text-white" : "text-gray-900")}>
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
            className={cn("transition-colors", isDark ? "text-neutral-500 hover:text-red-400" : "text-gray-400 hover:text-red-500")}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    )
  ))}
</div>