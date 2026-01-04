import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { cn } from "@/lib/utils";
import { RefreshCw, ExternalLink } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { format } from 'date-fns';
import { withinDays } from '@/components/utils/dateFilters';

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

export default function CommercialImpactPanel({ theme }) {
  const isDark = theme === 'dark';
  const isPastel = theme === 'pastel';
  const [articles, setArticles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const { data: sectors = [] } = useQuery({
    queryKey: ['sectors'],
    queryFn: () => base44.entities.Sector.list('order'),
  });

  const { data: rssSources = [] } = useQuery({
    queryKey: ['rssSources'],
    queryFn: () => base44.entities.RSSSource.list(),
  });

  useEffect(() => {
    const cached = localStorage.getItem('commercial_impact');
    if (cached) {
      setArticles(JSON.parse(cached));
    }
  }, []);

  const { data: settingsData = [] } = useQuery({
    queryKey: ['appSettings'],
    queryFn: () => base44.entities.AppSettings.list(),
  });

  const settings = settingsData[0] || {};
  const featuredDays = settings?.featured_article_days || 14;

  const fetchArticles = async () => {
    setIsLoading(true);
    const allArticles = [];
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - featuredDays);

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

    // Filter to only recent articles
    const recentArticles = allArticles.filter(a => 
      a.pubDate && new Date(a.pubDate) >= cutoffDate
    );

    const prompt = `Analyze these news articles from the past ${featuredDays} days and identify those with DIRECT commercial impact - meaning concrete business, revenue, or customer implications.

INCLUDE articles about:
- New or cancelled contracts, offtake agreements, purchase orders
- Capacity expansions, shutdowns, production delays
- Pricing changes, margin pressure, cost shifts
- Major customer procurement announcements or demand signals
- Production volume changes or utilization shifts

EXCLUDE:
- Generic market commentary or forecasts
- Research announcements without commercial deployment
- Policy discussions without immediate business impact
- General industry trends without specific company actions

Articles:
${recentArticles.slice(0, 50).map((a, i) => `${i}. [${a.sector}${a.subsector ? ' - ' + a.subsector : ''}] ${a.title}: ${a.description}`).join('\n')}

Select 5-8 articles with the strongest commercial impact. Return only article indices.`;

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
    localStorage.setItem('commercial_impact', JSON.stringify(selected));
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
          COMMERCIAL IMPACT
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
        <div className={cn("flex-1 flex items-center justify-center text-[10px]", 
          isPastel ? "text-[#7B7E9C]" :
          isDark ? "text-neutral-600" : "text-gray-500")}>
          No material signals detected
        </div>
      ) : (
        <div className={cn("flex-1 p-2 space-y-1 overflow-y-auto custom-scrollbar", 
          isPastel ? "bg-[#32354C]" :
          isDark ? "bg-[#0f0f10]" : "bg-gray-50")}>
          {articles.map((article, idx) => (
            <a
              key={idx}
              href={article.link}
              target="_blank"
              rel="noopener noreferrer"
              className={cn("block border p-2 transition-all", 
                isPastel ? "bg-[#42456C] border-[#4A4D6C] hover:bg-[#4A4D7C] hover:border-[#5A5D8C]" :
                isDark ? "bg-[#0A0A0A] border-[#1F1F1F] hover:bg-[#17181b] hover:border-[#2A2A2A]" : "bg-gray-50 border-gray-300 hover:border-gray-400")}
            >
              <h4 className={cn("text-[10px] font-medium line-clamp-2 leading-[1.3]", 
                isPastel ? "text-[#E8E9F0]" :
                isDark ? "text-neutral-400" : "text-gray-900")}>
                {article.title}
              </h4>
              <div className={cn("text-[9px] mt-0.5 flex items-center gap-1.5", 
                isPastel ? "text-[#9B9EBC]" :
                isDark ? "text-neutral-700" : "text-gray-500")}>
                <span className={cn("px-1.5 py-0.5 rounded", 
                  isPastel ? "bg-[#9B8B6B]/20 text-[#9B8B6B]" :
                  "bg-orange-500/20 text-orange-500")}>
                  {article.sector}{article.subsector ? ` - ${article.subsector}` : ''}
                </span>
                {article.pubDate && (
                  <span>{format(new Date(article.pubDate), 'MMM d')}</span>
                )}
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}