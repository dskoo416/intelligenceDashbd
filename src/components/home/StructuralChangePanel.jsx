import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cn } from "@/lib/utils";
import { RefreshCw, Plus } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { format } from 'date-fns';
import { withinDays } from '@/components/utils/dateFilters';
import { toast } from 'sonner';

const parseRSS = async (url) => {
  try {
    const corsProxy = 'https://api.allorigins.win/raw?url=';
    const response = await fetch(corsProxy + encodeURIComponent(url));
    const text = await response.text();
    const parser = new DOMParser();
    const xml = parser.parseFromString(text, 'text/xml');
    
    const items = xml.querySelectorAll('item');
    const articles = [];
    
    items.forEach((item) => {
      articles.push({
        title: item.querySelector('title')?.textContent || '',
        link: item.querySelector('link')?.textContent || '',
        description: item.querySelector('description')?.textContent?.replace(/<[^>]*>/g, '').slice(0, 200) || '',
        pubDate: item.querySelector('pubDate')?.textContent || null,
      });
    });
    
    return articles.slice(0, 10);
  } catch (error) {
    console.error('Error parsing RSS:', error);
    return [];
  }
};

export default function StructuralChangePanel({ theme }) {
  const isDark = theme === 'dark';
  const isPastel = theme === 'pastel';
  const [articles, setArticles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();

  const { data: sectors = [] } = useQuery({
    queryKey: ['sectors'],
    queryFn: () => base44.entities.Sector.list('order'),
  });

  const { data: rssSources = [] } = useQuery({
    queryKey: ['rssSources'],
    queryFn: () => base44.entities.RSSSource.list(),
  });

  const { data: settingsData = [] } = useQuery({
    queryKey: ['appSettings'],
    queryFn: () => base44.entities.AppSettings.list(),
  });

  const settings = settingsData[0] || {};
  const daysToScan = settings?.featured_article_days || 14;

  const { data: savedArticles = [] } = useQuery({
    queryKey: ['savedArticles'],
    queryFn: () => base44.entities.SavedArticle.list(),
  });

  const saveArticleMutation = useMutation({
    mutationFn: (article) => base44.entities.SavedArticle.create(article),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedArticles'] });
      toast.success('Article saved');
    },
  });

  useEffect(() => {
    const cacheKey = `structural_change:${daysToScan}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed.daysToScan === daysToScan) {
          setArticles(parsed.articles || []);
        } else {
          localStorage.removeItem(cacheKey);
        }
      } catch (e) {
        localStorage.removeItem(cacheKey);
      }
    }
  }, [daysToScan]);

  const fetchArticles = async () => {
    setIsLoading(true);
    const allArticles = [];
    const nowMs = Date.now();

    for (const source of rssSources.filter(s => s.is_active !== false)) {
      const sourceArticles = await parseRSS(source.url);
      const sector = sectors.find(s => s.id === source.sector_id);
      allArticles.push(...sourceArticles.map(a => ({ 
        ...a, 
        source: source.name,
        sector: sector?.name || '',
        subsector: source.subsector || ''
      })));
    }

    // Filter to articles within timeframe
    const recentArticles = allArticles.filter(a => withinDays(a.pubDate, daysToScan, nowMs));

    const prompt = `Analyze these recent news articles (past ${daysToScan} days) and identify those signaling STRUCTURAL changes - shifts in how the industry operates, not just short-term news.

INCLUDE articles about:
- Supply chain reconfiguration, localization, reshoring
- Changes in production methods, scale economics, or manufacturing processes
- Recycling, circularity, or feedstock availability shifts
- Regulatory actions that alter industry structure (not just compliance news)
- Technology adoption that changes competitive dynamics
- Market structure changes (consolidation, new business models)

EXCLUDE:
- Routine operations or maintenance news
- Short-term price movements or quarterly results
- Single project announcements without broader implications
- Political commentary without structural impact

Articles:
${recentArticles.slice(0, 50).map((a, i) => `${i}. [${a.sector}${a.subsector ? ' - ' + a.subsector : ''}] ${a.title}: ${a.description}`).join('\n')}

Select 5-8 articles that best signal structural industry changes. Return article indices.`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          article_indices: {
            type: 'array',
            items: { type: 'number' },
            minItems: 5,
            maxItems: 8
          }
        }
      }
    });

    const selected = result.article_indices?.map(i => recentArticles[i]).filter(Boolean) || [];
    selected.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
    
    setArticles(selected);
    const cacheKey = `structural_change:${daysToScan}`;
    const cachePayload = {
      daysToScan,
      articles: selected,
      updatedAt: Date.now()
    };
    localStorage.setItem(cacheKey, JSON.stringify(cachePayload));
    setIsLoading(false);
  };

  return (
    <div className={cn("h-full flex flex-col border", 
      isPastel ? "bg-[#3A3D5C] border-[#4A4D6C]" :
      isDark ? "bg-[#111215] border-[#262629]" : "bg-white border-gray-300")}>
      <div className={cn("flex items-center justify-between px-3 py-2 border-b", 
        isPastel ? "border-[#4A4D6C]" :
        isDark ? "border-[#262629]" : "border-gray-300")}>
        <h3 className={cn("text-[11px] font-semibold uppercase tracking-wider", 
          isPastel ? "text-[#A5A8C0]" :
          isDark ? "text-neutral-500" : "text-gray-700")}>
          STRUCTURAL CHANGE
        </h3>
        <Button
          size="sm"
          variant="ghost"
          onClick={fetchArticles}
          disabled={isLoading}
          className="h-4 w-4 p-0"
        >
          <RefreshCw className={cn("w-2.5 h-2.5", isLoading && "animate-spin", 
            isPastel ? "text-[#7B7E9C]" :
            isDark ? "text-neutral-600" : "text-gray-500")} />
        </Button>
      </div>

      {articles.length === 0 && !isLoading ? (
        <div className={cn("flex-1 flex items-center justify-center text-[10px] text-center px-2", 
          isPastel ? "text-[#7B7E9C]" :
          isDark ? "text-neutral-600" : "text-gray-500")}>
          No items in the last {daysToScan} days
        </div>
      ) : (
        <div className={cn("flex-1 p-2 space-y-1 overflow-y-auto custom-scrollbar", 
          isPastel ? "bg-[#32354C]" :
          isDark ? "bg-[#0f0f10]" : "bg-gray-50")}>
          {articles.map((article, idx) => {
            const isSaved = savedArticles.some(saved => saved.link === article.link);
            return (
              <div
                key={idx}
                className={cn("border p-2 transition-all group relative", 
                  isPastel ? "bg-[#42456C] border-[#4A4D6C] hover:bg-[#4A4D7C] hover:border-[#5A5D8C]" :
                  isDark ? "bg-[#0A0A0A] border-[#1F1F1F] hover:bg-[#17181b] hover:border-[#2A2A2A]" : "bg-gray-50 border-gray-300 hover:border-gray-400")}
              >
                <a
                  href={article.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <h4 className={cn("text-[10px] font-medium line-clamp-2 leading-[1.3] pr-6", 
                    isPastel ? "text-[#E8E9F0]" :
                    isDark ? "text-neutral-400" : "text-gray-900")}>
                    {article.title}
                  </h4>
                  <div className={cn("text-[9px] mt-0.5", 
                    isPastel ? "text-[#9B9EBC]" :
                    isDark ? "text-neutral-700" : "text-gray-500")}>
                    {article.pubDate && (
                      <span>{format(new Date(article.pubDate), 'MMM d')}</span>
                    )}
                  </div>
                </a>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    saveArticleMutation.mutate({
                      title: article.title,
                      link: article.link,
                      description: article.description,
                      pubDate: article.pubDate,
                      source: article.source,
                      sector: article.sector,
                      subsector: article.subsector
                    });
                  }}
                  className={cn("absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all p-1", 
                    isSaved 
                      ? "text-orange-500 rotate-45" 
                      : isPastel 
                        ? "text-[#9B9EBC] hover:text-orange-500" 
                        : isDark 
                          ? "text-neutral-600 hover:text-orange-500" 
                          : "text-gray-500 hover:text-orange-500")}
                >
                  <Plus className="w-3 h-3 transition-transform" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}