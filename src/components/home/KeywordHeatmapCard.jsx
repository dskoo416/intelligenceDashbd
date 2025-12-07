import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { cn } from "@/lib/utils";

export default function KeywordHeatmapCard({ theme }) {
  const isDark = theme === 'dark';
  const [keywordData, setKeywordData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const { data: sectors = [] } = useQuery({
    queryKey: ['sectors'],
    queryFn: () => base44.entities.Sector.list(),
  });

  const { data: rssSources = [] } = useQuery({
    queryKey: ['rssSources'],
    queryFn: () => base44.entities.RSSSource.list(),
  });

  useEffect(() => {
    const analyzeKeywords = async () => {
      setIsLoading(true);
      const keywordCounts = {};

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
        .slice(0, 20);

      setKeywordData(sortedKeywords);
      setIsLoading(false);
    };

    if (sectors.length > 0 && rssSources.length > 0) {
      analyzeKeywords();
    }
  }, [sectors, rssSources]);

  const maxCount = keywordData[0]?.[1] || 1;

  const getIntensity = (count) => {
    const ratio = count / maxCount;
    if (ratio > 0.7) return isDark ? 'bg-orange-500/80 text-white' : 'bg-orange-600 text-white';
    if (ratio > 0.4) return isDark ? 'bg-orange-500/50 text-white' : 'bg-orange-400 text-white';
    return isDark ? 'bg-orange-500/20 text-orange-300' : 'bg-orange-200 text-orange-800';
  };

  return (
    <div className={cn("rounded-lg border p-4 h-full flex flex-col", isDark ? "bg-neutral-900 border-neutral-800" : "bg-white border-gray-200")}>
      <h3 className={cn("font-semibold text-sm mb-3", isDark ? "text-white" : "text-gray-900")}>Keyword Heatmap</h3>
      
      {isLoading ? (
        <div className={cn("flex-1 flex items-center justify-center text-xs", isDark ? "text-neutral-500" : "text-gray-500")}>
          Loading keywords...
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          <div className="flex flex-wrap gap-2">
            {keywordData.map(([keyword, count]) => (
              <div
                key={keyword}
                className={cn("px-2 py-1 rounded text-xs font-medium", getIntensity(count))}
              >
                {keyword} ({count})
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}