import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cn } from "@/lib/utils";
import { RefreshCw, ExternalLink, Bookmark } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function KeywordHeatmapCard({ theme }) {
  const isDark = theme === 'dark';
  const isPastel = theme === 'pastel';
  const queryClient = useQueryClient();
  const [keywordData, setKeywordData] = useState([]);
  const [allArticles, setAllArticles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedKeyword, setSelectedKeyword] = useState(null);
  const [keywordArticles, setKeywordArticles] = useState([]);

  const { data: sectors = [] } = useQuery({
    queryKey: ['sectors'],
    queryFn: () => base44.entities.Sector.list(),
  });

  const { data: rssSources = [] } = useQuery({
    queryKey: ['rssSources'],
    queryFn: () => base44.entities.RSSSource.list(),
  });

  const { data: savedArticles = [] } = useQuery({
    queryKey: ['savedArticles'],
    queryFn: () => base44.entities.SavedArticle.list(),
  });

  const saveArticleMutation = useMutation({
    mutationFn: async (article) => {
      const existing = savedArticles.find(a => a.link === article.link);
      if (existing) {
        await base44.entities.SavedArticle.delete(existing.id);
        return { deleted: true };
      } else {
        return base44.entities.SavedArticle.create({ ...article, collection_ids: [] });
      }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['savedArticles'] });
      toast.success(result?.deleted ? 'Article removed' : 'Article saved');
    },
  });

  const analyzeKeywords = async (forceRefresh = false) => {
    // Check cache first
    if (!forceRefresh) {
      const cached = localStorage.getItem('home_keyword_treemap');
      if (cached) {
        const data = JSON.parse(cached);
        setKeywordData(data.keywords);
        setAllArticles(data.articles);
        setIsLoading(false);
        return;
      }
    }

    setIsLoading(true);
    const keywordCounts = {};
    const articles = [];

    for (const sector of sectors.slice(0, 4)) {
      const sectorSources = rssSources.filter(s => s.sector_id === sector.id && s.is_active !== false);

      for (const source of sectorSources.slice(0, 5)) {
        try {
          const corsProxy = 'https://api.allorigins.win/raw?url=';
          const response = await fetch(corsProxy + encodeURIComponent(source.url));
          const text = await response.text();
          const parser = new DOMParser();
          const xml = parser.parseFromString(text, 'text/xml');
          const items = xml.querySelectorAll('item');

          items.forEach((item, idx) => {
            if (idx < 10) {
              const title = item.querySelector('title')?.textContent || '';
              const link = item.querySelector('link')?.textContent || '';
              const description = item.querySelector('description')?.textContent?.replace(/<[^>]*>/g, '').slice(0, 200) || '';
              const pubDate = item.querySelector('pubDate')?.textContent || null;

              articles.push({
                title,
                link,
                description,
                pubDate,
                source: source.name,
                sector: sector.name
              });

              const words = title.toLowerCase().split(/\s+/).filter(w => w.length > 4);
              words.forEach(word => {
                keywordCounts[word] = (keywordCounts[word] || 0) + 1;
              });
            }
          });
        } catch (error) {
          console.error('Error parsing RSS:', error);
        }
      }
    }

    const sortedKeywords = Object.entries(keywordCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 16);

    setKeywordData(sortedKeywords);
    setAllArticles(articles);
    
    // Cache the data
    localStorage.setItem('home_keyword_treemap', JSON.stringify({
      keywords: sortedKeywords,
      articles: articles
    }));
    
    setIsLoading(false);
  };

  useEffect(() => {
    if (sectors.length > 0 && rssSources.length > 0) {
      analyzeKeywords();
    }
  }, [sectors, rssSources]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await analyzeKeywords(true);
    setIsRefreshing(false);
  };

  const maxCount = keywordData[0]?.[1] || 1;
  
  const getBlockSize = (count) => {
    const ratio = count / maxCount;
    if (ratio > 0.7) return 'col-span-2 row-span-2';
    if (ratio > 0.4) return 'col-span-2 row-span-1';
    return 'col-span-1 row-span-1';
  };

  const getBlockColor = (count) => {
    const ratio = count / maxCount;
    const isPastel = theme === 'pastel';
    
    if (isPastel) {
      if (ratio > 0.7) return 'bg-[#6B9B9B]';
      if (ratio > 0.4) return 'bg-[#9B8B6B]';
      return 'bg-[#9B6B7B]';
    }
    
    if (ratio > 0.7) return isDark ? 'bg-[#3A5F3A]' : 'bg-green-200';
    if (ratio > 0.4) return isDark ? 'bg-[#5A5A2E]' : 'bg-yellow-200';
    return isDark ? 'bg-[#5A3535]' : 'bg-red-200';
  };

  const handleKeywordClick = (keyword) => {
    const filtered = allArticles.filter(article => 
      article.title.toLowerCase().includes(keyword.toLowerCase())
    );
    setKeywordArticles(filtered);
    setSelectedKeyword(keyword);
  };



  return (
    <>
      <div className={cn("h-full flex flex-col rounded", 
        isPastel ? "bg-[#3A3D5C] border border-[#4A4D6C] shadow-sm" :
        isDark ? "bg-[#131313] border border-[#1F1F1F] shadow-sm" : 
        "bg-white border border-gray-300 shadow-sm")}>
        <div className={cn("px-2 py-1 border-b flex items-center justify-between", 
          isPastel ? "border-[#4A4D6C]" :
          isDark ? "border-[#1F1F1F]" : "border-gray-300")}>
          <h3 className={cn("text-[10px] font-semibold uppercase tracking-wider", 
            isPastel ? "text-[#A5A8C0]" :
            isDark ? "text-neutral-500" : "text-gray-700")}>KEYWORD TREEMAP</h3>
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="h-4 w-4 p-0"
          >
            <RefreshCw className={cn("w-2.5 h-2.5", isRefreshing && "animate-spin", 
              isPastel ? "text-[#6B6E8C]" :
              isDark ? "text-neutral-600" : "text-gray-500")} />
          </Button>
          </div>

          {isLoading ? (
          <div className={cn("flex-1 flex items-center justify-center text-[10px]", 
            isPastel ? "text-[#7B7E9C]" :
            isDark ? "text-neutral-700" : "text-gray-500")}>
            Loading keywords...
          </div>
          ) : (
          <div className={cn("flex-1 p-2", isPastel ? "bg-[#32354C]" : "")}>
            <div className="grid grid-cols-6 grid-rows-6 gap-1 h-full">
              {keywordData.map(([keyword, count]) => (
                <button
                  key={keyword}
                  onClick={() => handleKeywordClick(keyword)}
                  className={cn(
                    "flex items-center justify-center text-center p-1 transition-all cursor-pointer",
                    getBlockSize(count),
                    getBlockColor(count),
                    "hover:opacity-80"
                  )}
                >
                  <div className="overflow-hidden w-full h-full flex flex-col items-center justify-center">
                    <div className={cn("font-mono font-semibold truncate w-full text-center", 
                      isPastel ? "text-white" :
                      isDark ? "text-neutral-200" : "text-gray-900")} style={{ fontSize: keyword.length > 10 ? '7px' : '9px' }}>{keyword}</div>
                    <div className={cn("text-[8px] font-mono", 
                      isPastel ? "text-[#D0D2E0]" :
                      isDark ? "text-neutral-400" : "text-gray-700")}>{count}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <Dialog open={!!selectedKeyword} onOpenChange={() => setSelectedKeyword(null)}>
        <DialogContent className={cn("max-w-2xl max-h-[80vh] border", 
          isPastel ? "bg-[#3A3D5C] border-[#4A4D6C]" :
          isDark ? "bg-[#111215] border-[#262629]" : "bg-white border-gray-300")}>
          <div className={cn("flex items-center justify-between px-3 py-2 border-b", 
            isPastel ? "border-[#4A4D6C]" :
            isDark ? "border-[#262629]" : "border-gray-300")}>
            <h3 className={cn("text-[11px] font-semibold uppercase tracking-wider", 
              isPastel ? "text-[#A5A8C0]" :
              isDark ? "text-neutral-500" : "text-gray-700")}>
              Articles for "{selectedKeyword}"
            </h3>
            <button
              onClick={() => setSelectedKeyword(null)}
              className={cn("text-[14px] transition-colors", 
                isPastel ? "text-[#7B7E9C] hover:text-[#A5A8C0]" :
                isDark ? "text-neutral-600 hover:text-neutral-400" : "text-gray-500 hover:text-gray-700")}
            >
              ×
            </button>
          </div>
          <div className="overflow-y-auto" style={{ maxHeight: 'calc(80vh - 60px)' }}>
            {keywordArticles.length === 0 ? (
              <div className={cn("text-[10px] text-center py-8", 
                isPastel ? "text-[#7B7E9C]" :
                isDark ? "text-neutral-600" : "text-gray-500")}>
                No articles found
              </div>
            ) : (
              <div className={cn("divide-y", 
                isPastel ? "divide-[#4A4D6C]" :
                isDark ? "divide-[#262629]" : "divide-gray-300")}>
                {keywordArticles.map((article, idx) => {
                  const isSaved = savedArticles.some(a => a.link === article.link);
                  return (
                    <div key={idx} className={cn("px-3 py-2 flex items-start justify-between gap-3 transition-colors", 
                      isPastel ? "hover:bg-[#42456C]" :
                      isDark ? "hover:bg-[#17181b]" : "hover:bg-gray-50")}>
                      <div className="flex-1 min-w-0">
                        <a
                          href={article.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={cn("text-[11px] font-medium transition-colors block", 
                            isPastel ? "text-[#E8E9F0] hover:text-[#9B8B6B]" :
                            isDark ? "text-neutral-300 hover:text-orange-500" : "text-gray-900 hover:text-orange-600")}
                        >
                          {article.title}
                        </a>
                        <div className={cn("text-[10px] mt-0.5", 
                          isPastel ? "text-[#9B9EBC]" :
                          isDark ? "text-neutral-600" : "text-gray-600")}>
                          {article.source} • {article.sector}
                          {article.pubDate && <> • {format(new Date(article.pubDate), 'MMM d')}</>}
                        </div>
                        {article.description && (
                          <p className={cn("text-[10px] mt-0.5 line-clamp-1", 
                            isPastel ? "text-[#7B7E9C]" :
                            isDark ? "text-neutral-700" : "text-gray-500")}>
                            {article.description}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => saveArticleMutation.mutate(article)}
                        className={cn("flex-shrink-0 text-[16px] font-bold transition-colors", 
                          isPastel ? "text-[#7B7E9C] hover:text-[#9B8B6B]" :
                          isDark ? "text-neutral-600 hover:text-orange-500" : "text-gray-500 hover:text-orange-600")}
                      >
                        {isSaved ? '×' : '+'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}