import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, ExternalLink } from 'lucide-react';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from 'sonner';

export default function Saved() {
  const queryClient = useQueryClient();

  const { data: savedArticles = [], isLoading } = useQuery({
    queryKey: ['savedArticles'],
    queryFn: () => base44.entities.SavedArticle.list('-created_date'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.SavedArticle.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedArticles'] });
      toast.success('Article removed');
    },
  });

  return (
    <div className="h-full bg-neutral-950 p-6 overflow-y-auto">
      <h1 className="text-2xl font-bold text-white mb-6">Saved Articles</h1>
      
      {isLoading ? (
        <div className="text-neutral-400">Loading...</div>
      ) : savedArticles.length === 0 ? (
        <div className="text-neutral-500 text-center py-12">
          No saved articles yet. Start saving articles from Intelligence Feed.
        </div>
      ) : (
        <div className="space-y-3">
          {savedArticles.map((article) => (
            <div key={article.id} className="bg-neutral-900 border border-neutral-800 rounded p-4 flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <a 
                  href={article.link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-white hover:text-orange-400 transition-colors font-medium text-sm"
                >
                  {article.title}
                </a>
                {article.description && (
                  <p className="text-neutral-400 text-xs mt-1 line-clamp-2">{article.description}</p>
                )}
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-neutral-500 text-xs">{article.source}</span>
                  {article.sector && (
                    <span className="text-neutral-600 text-xs">• {article.sector}</span>
                  )}
                  {article.pubDate && (
                    <span className="text-neutral-600 text-xs">
                      • {new Date(article.pubDate).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a 
                  href={article.link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-neutral-500 hover:text-white transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
                <button
                  onClick={() => deleteMutation.mutate(article.id)}
                  className="text-neutral-500 hover:text-red-400 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}