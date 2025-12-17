import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { cn } from "@/lib/utils";
import { format } from 'date-fns';
import { RefreshCw } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useFeedData } from '@/components/hooks/useFeedData';

export default function FeaturedSectorTiles({ theme, activeSector }) {
  const isDark = theme === 'dark';
  const isPastel = theme === 'pastel';
  const [featuredArticles, setFeaturedArticles] = useState([]);
  const [loadingStates, setLoadingStates] = useState({});

  const { articles: feedArticles, isLoadingArticles } = useFeedData(activeSector, null);

  const { data: sectors = [] } = useQuery({
    queryKey: ['sectors'],
    queryFn: () => base44.entities.Sector.list('order'),
  });

  useEffect(() => {
    // If activeSector is selected, show its top 4 articles directly
    if (activeSector && feedArticles.length > 0) {
      setFeaturedArticles([{
        sector: activeSector.name,
        articles: feedArticles.slice(0, 4),
        sectorId: activeSector.id
      }]);
    } else {
      // Default: show first 3 sectors
      const cached = localStorage.getItem('home_featured_tiles');
      if (cached) {
        setFeaturedArticles(JSON.parse(cached));
      } else if (sectors.length > 0) {
        const featured = sectors.slice(0, 3).map(sector => ({
          sector: sector.name,
          articles: [],
          sectorId: sector.id
        }));
        setFeaturedArticles(featured);
      }
    }
  }, [activeSector, feedArticles, sectors]);

  return (
    <div className="grid grid-cols-3 gap-3 h-full">
      {featuredArticles.slice(0, 3).map((item, idx) => (
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
            {activeSector && (
              <Button 
                size="sm" 
                variant="ghost" 
                disabled={isLoadingArticles}
                className="h-4 w-4 p-0"
              >
                <RefreshCw className={cn("w-2.5 h-2.5", isLoadingArticles && "animate-spin", 
                  isPastel ? "text-[#7B7E9C]" :
                  isDark ? "text-neutral-600" : "text-gray-500")} />
              </Button>
            )}
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
              {isLoadingArticles ? 'Loading...' : 'Select a level to view featured articles'}
            </div>
          )}
          </div>
        </div>
      ))}
    </div>
  );
}