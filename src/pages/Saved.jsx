import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, ExternalLink, Folder } from 'lucide-react';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import SavedSidebar from '@/components/saved/SavedSidebar';
import CollectionsModal from '@/components/saved/CollectionsModal';
import { toast } from 'sonner';

export default function Saved() {
  const queryClient = useQueryClient();
  const [activeView, setActiveView] = useState('main');
  const [collectionsModalOpen, setCollectionsModalOpen] = useState(false);

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
  } else if (activeView === 'main') {
    filteredArticles = savedArticles.filter(a => !a.collection_ids || a.collection_ids.length === 0);
  }

  return (
    <div className={cn("flex h-full", isDark ? "bg-neutral-950" : "bg-gray-50")}>
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

      <div className="flex-1 overflow-y-auto p-6">
        <h1 className={cn("text-2xl font-bold mb-6", isDark ? "text-white" : "text-gray-900")}>
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
        
        {isLoading ? (
          <div className={cn("text-sm", isDark ? "text-neutral-400" : "text-gray-500")}>Loading...</div>
        ) : filteredArticles.length === 0 ? (
          <div className={cn("text-center py-12 text-sm", isDark ? "text-neutral-500" : "text-gray-500")}>
            No saved articles in this view yet.
          </div>
        ) : (
          <div className="space-y-3">
            {filteredArticles.map((article) => (
              <div key={article.id} className={cn(
                "rounded p-4 flex items-start justify-between gap-4",
                isDark ? "bg-neutral-900 border border-neutral-800" : "bg-white border border-gray-200"
              )}>
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
                    <span className={cn("text-xs", isDark ? "text-neutral-500" : "text-gray-500")}>{article.source}</span>
                    {article.sector && (
                      <span className={cn("text-xs", isDark ? "text-neutral-600" : "text-gray-400")}>• {article.sector}</span>
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
                        <button className={cn(
                          "transition-colors",
                          article.collection_ids?.length > 0 
                            ? "text-orange-500" 
                            : isDark 
                              ? "text-neutral-500 hover:text-white" 
                              : "text-gray-400 hover:text-gray-700"
                        )}>
                          <Folder className="w-4 h-4" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className={cn("w-56", isDark ? "bg-neutral-800 border-neutral-700" : "bg-white")} align="end">
                        <div className="space-y-2">
                          <p className={cn("text-xs font-medium", isDark ? "text-neutral-300" : "text-gray-700")}>Add to collections:</p>
                          {collections.map(collection => (
                            <div key={collection.id} className="flex items-center gap-2">
                              <Checkbox
                                checked={article.collection_ids?.includes(collection.id)}
                                onCheckedChange={() => handleToggleCollection(article, collection.id)}
                              />
                              <span className={cn("text-xs", isDark ? "text-white" : "text-gray-900")}>{collection.name}</span>
                            </div>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                  )}
                  <a 
                    href={article.link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={cn("transition-colors", isDark ? "text-neutral-500 hover:text-white" : "text-gray-400 hover:text-gray-700")}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <button
                    onClick={() => deleteMutation.mutate(article.id)}
                    className={cn("transition-colors", isDark ? "text-neutral-500 hover:text-red-400" : "text-gray-400 hover:text-red-500")}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <CollectionsModal
        isOpen={collectionsModalOpen}
        onClose={() => setCollectionsModalOpen(false)}
        collections={collections}
        onSaveCollection={(data) => collectionMutation.mutate(data)}
        onDeleteCollection={(id) => deleteCollectionMutation.mutate(id)}
        onReorderCollections={handleReorderCollections}
      />
    </div>
  );
}