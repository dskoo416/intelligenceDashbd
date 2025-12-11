import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { cn } from "@/lib/utils";
import { format } from 'date-fns';
import { RefreshCw } from 'lucide-react';
import { Button } from "@/components/ui/button";

const parseRSS = async (url) => {
  try {
    const corsProxy = 'https://api.allorigins.win/raw?url=';
    const response = await fetch(corsProxy + encodeURIComponent(url));
    const text = await response.text();
    const parser = new DOMParser();
    const xml = parser.parseFromString(text, 'text/xml');
    const items = xml.querySelectorAll('item');
    const articles = [];
    
    items.forEach((item, idx) => {
      if (idx < 10) {
        articles.push({
          title: item.querySelector('title')?.textContent || '',
          link: item.querySelector('link')?.textContent || '',
          description: item.querySelector('description')?.textContent?.replace(/<[^>]*>/g, '').slice(0, 200) || '',
          pubDate: item.querySelector('pubDate')?.textContent || null,
        });
      }
    });
    
    return articles;
  } catch (error) {
    console.error('Error parsing RSS:', error);
    return [];
  }
};

export default function FeaturedSectorTiles({ theme }) {
  const isDark = theme === 'dark';
  const isPastel = theme === 'pastel';
  const [featuredArticles, setFeaturedArticles] = useState([]);
  const [loadingStates, setLoadingStates] = useState({});

  const { data: sectors = [] } = useQuery({
    queryKey: ['sectors'],
    queryFn: () => base44.entities.Sector.list('order'),
  });

  const { data: rssSources = [] } = useQuery({
    queryKey: ['rssSources'],
    queryFn: () => base44.entities.RSSSource.list(),
  });

  useEffect(() => {
    const cached = localStorage.getItem('home_featured_tiles');
    if (cached) {
      setFeaturedArticles(JSON.parse(cached));
    }
  }, []);

  useEffect(() => {
    const cached = localStorage.getItem('home_featured_tiles');
    if (cached) {
      setFeaturedArticles(JSON.parse(cached));
    } else if (sectors.length > 0 && rssSources.length > 0) {
      loadInitialFeatured();
    }
  }, [sectors, rssSources]);

  const loadInitialFeatured = async () => {
    const featured = sectors.slice(0, 3).map(sector => ({
      sector: sector.name,
      articles: [],
      sectorId: sector.id
    }));
    setFeaturedArticles(featured);
  };

  const loadFeaturedForSector = async (sectorIdx) => {
    const sector = sectors[sectorIdx];
    if (!sector) return;

    setLoadingStates(prev => ({ ...prev, [sectorIdx]: true }));
    const sectorSources = rssSources.filter(s => s.sector_id === sector.id && s.is_active !== false);
    let allArticles = [];

    for (const source of sectorSources.slice(0, 5)) {
      const sourceArticles = await parseRSS(source.url);
      allArticles.push(...sourceArticles.map(a => ({ ...a, source: source.name })));
    }

    const articleText = allArticles.map((a, idx) => 
      `${idx + 1}. ${a.title}\nSource: ${a.source}\n`
    ).join('\n');

    let criticalArticles = [];
    if (allArticles.length > 0) {
      try {
        const result = await base44.integrations.Core.InvokeLLM({
          prompt: `Select the 4 most critical and newsworthy articles from this list for ${sector.name}:\n\n${articleText}\n\nReturn ONLY a JSON array of article numbers (1-indexed). Example: [1, 3, 5, 7]`,
          response_json_schema: {
            type: 'object',
            properties: {
              articles: { type: 'array', items: { type: 'number' } }
            }
          }
        });
        const selectedIndices = result.articles || [];
        criticalArticles = selectedIndices.slice(0, 4).map(idx => allArticles[idx - 1]).filter(Boolean);
      } catch (error) {
        criticalArticles = allArticles.slice(0, 4);
      }
    }

    const newFeatured = [...featuredArticles];
    newFeatured[sectorIdx] = {
      sector: sector.name,
      articles: criticalArticles,
      sectorId: sector.id
    };

    setFeaturedArticles(newFeatured);
    localStorage.setItem('home_featured_tiles', JSON.stringify(newFeatured));
    setLoadingStates(prev => ({ ...prev, [sectorIdx]: false }));
  };

  return (
    <div className="grid grid-cols-3 gap-3 h-full">
      {featuredArticles.map((item, idx) => (
        <div key={idx} className={cn("border flex flex-col h-full", 
          isPastel ? "bg-[#3A3D5C] border-[#4A4D6C]" :
          isDark ? "bg-[#111215] border-[#262629]" : "bg-white border-gray-300")}>
          <div className={cn("px-3 py-1 border-b flex items-center justify-between", 
            isPastel ? "border-[#4A4D6C]" :
            isDark ? "border-[#262629]" : "border-gray-300")}>
            <h3 className={cn("text-[9px] font-semibold uppercase tracking-wider", 
              isPastel ? "text-[#A5A8C0]" :
              isDark ? "text-neutral-500" : "text-gray-700")}>
              {item.sector}
            </h3>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={() => loadFeaturedForSector(idx)}
              disabled={loadingStates[idx]}
              className="h-4 w-4 p-0"
            >
              <RefreshCw className={cn("w-2.5 h-2.5", loadingStates[idx] && "animate-spin", 
                isPastel ? "text-[#7B7E9C]" :
                isDark ? "text-neutral-600" : "text-gray-500")} />
            </Button>
          </div>
          <div className={cn("flex-1 p-2 space-y-2", 
            isPastel ? "bg-[#32354C]" :
            isDark ? "bg-[#0f0f10]" : "bg-gray-50")}>
          {item.articles && item.articles.length > 0 ? (
            item.articles.map((article, aIdx) => (
              <div key={aIdx} className={cn("pb-2", aIdx < item.articles.length - 1 && "border-b",
                isPastel ? "border-[#4A4D6C]" :
                isDark ? "border-[#1F1F1F]" : "border-gray-200")}>
                <a
                  href={article.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn("text-[10px] font-medium leading-[1.3] line-clamp-2 block transition-colors", 
                    isPastel ? "text-[#E8E9F0] hover:text-white" :
                    isDark ? "text-neutral-300 hover:text-white" : "text-gray-700 hover:text-gray-900")}
                >
                  {article.title}
                </a>
                <div className={cn("text-[8px] mt-0.5", 
                  isPastel ? "text-[#7B7E9C]" :
                  isDark ? "text-neutral-700" : "text-gray-500")}>
                  {article.source} • {article.pubDate && format(new Date(article.pubDate), 'MMM d')}
                </div>
              </div>
            ))
          ) : (
            <div className={cn("text-[10px]", 
              isPastel ? "text-[#7B7E9C]" :
              isDark ? "text-neutral-600" : "text-gray-500")}>
              Click refresh to load featured articles
            </div>
          )}
          </div>
        </div>
      ))}
    </div>
  );
}