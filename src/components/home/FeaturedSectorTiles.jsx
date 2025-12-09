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
    const cached = localStorage.getItem('home_featured_tiles');
    if (cached) {
      setFeaturedArticles(JSON.parse(cached));
    }
  }, []);

  useEffect(() => {
    if (featuredArticles.length > 0) return;
    loadFeatured();
  }, [sectors, rssSources]);

  const loadFeatured = async (forceRefresh = false) => {
    if (!forceRefresh) {
      const cached = localStorage.getItem('home_featured_tiles');
      if (cached) {
        setFeaturedArticles(JSON.parse(cached));
        return;
      }
    }

    setIsLoading(true);
    const featured = [];

    for (const sector of sectors.slice(0, 3)) {
      const sectorSources = rssSources.filter(s => s.sector_id === sector.id && s.is_active !== false);
      let articles = [];

      for (const source of sectorSources.slice(0, 3)) {
        const sourceArticles = await parseRSS(source.url);
        articles.push(...sourceArticles.map(a => ({ ...a, source: source.name })));
      }

      if (articles.length > 0) {
        featured.push({
          sector: sector.name,
          article: articles[0]
        });
      } else {
        featured.push({
          sector: sector.name,
          article: null
        });
      }
    }

    setFeaturedArticles(featured);
    localStorage.setItem('home_featured_tiles', JSON.stringify(featured));
    setIsLoading(false);
  };

  const handleRefresh = async () => {
    await loadFeatured(true);
  };

  return (
    <div className="h-full flex flex-col">
      <div className={cn("px-3 py-1 border-b flex items-center justify-between", 
        isPastel ? "bg-[#3A3D5C] border-[#4A4D6C]" :
        isDark ? "bg-[#111215] border-[#262629]" : "bg-white border-gray-300")}>
        <h3 className={cn("text-[10px] font-semibold uppercase tracking-wider", 
          isPastel ? "text-[#A5A8C0]" :
          isDark ? "text-neutral-500" : "text-gray-700")}>SUMMARY</h3>
        <Button 
          size="sm" 
          variant="ghost" 
          onClick={handleRefresh}
          disabled={isLoading}
          className="h-4 w-4 p-0"
        >
          <RefreshCw className={cn("w-2.5 h-2.5", isLoading && "animate-spin", 
            isPastel ? "text-[#7B7E9C]" :
            isDark ? "text-neutral-600" : "text-gray-500")} />
        </Button>
      </div>
      <div className="grid grid-cols-3 gap-3 flex-1 p-3">
        {featuredArticles.map((item, idx) => (
          <div key={idx} className={cn("border p-3", 
            isPastel ? "bg-[#3A3D5C] border-[#4A4D6C]" :
            isDark ? "bg-[#111215] border-[#262629]" : "bg-white border-gray-300")}>
            <div className={cn("text-[9px] font-semibold uppercase mb-2 tracking-wider", 
              isPastel ? "text-[#A5A8C0]" :
              isDark ? "text-neutral-500" : "text-gray-700")}>
              {item.sector}
            </div>
          {item.article ? (
            <div>
              <a
                href={item.article.link}
                target="_blank"
                rel="noopener noreferrer"
                className={cn("text-[11px] font-medium leading-[1.3] line-clamp-2 block transition-colors", 
                  isPastel ? "text-[#E8E9F0] hover:text-white" :
                  isDark ? "text-neutral-300 hover:text-white" : "text-gray-700 hover:text-gray-900")}
              >
                {item.article.title}
              </a>
              <div className={cn("text-[9px] mt-1", 
                isPastel ? "text-[#7B7E9C]" :
                isDark ? "text-neutral-700" : "text-gray-500")}>
                {item.article.source} • {item.article.pubDate && format(new Date(item.article.pubDate), 'MMM d')}
              </div>
            </div>
          ) : (
            <div className={cn("text-[10px]", 
              isPastel ? "text-[#7B7E9C]" :
              isDark ? "text-neutral-600" : "text-gray-500")}>
              No featured article yet
            </div>
          )}
        </div>
      ))}
      </div>
    </div>
  );
}