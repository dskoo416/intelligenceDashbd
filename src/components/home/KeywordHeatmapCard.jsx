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

  const getBarColor = (count) => {
    const ratio = count / maxCount;
    if (ratio > 0.7) return isDark ? 'bg-red-500' : 'bg-red-600';
    if (ratio > 0.4) return isDark ? 'bg-yellow-500' : 'bg-yellow-600';
    return isDark ? 'bg-green-500' : 'bg-green-600';
  };

  const getBarWidth = (count) => {
    return Math.max(10, (count / maxCount) * 100);
  };

  return (
    <div className={cn("h-full flex flex-col", isDark ? "bg-[#131313] border border-[#1F1F1F]" : "bg-white border border-gray-300")}>
      <div className={cn("px-2 py-1 border-b", isDark ? "border-[#1F1F1F]" : "border-gray-300")}>
        <h3 className={cn("text-[10px] font-semibold uppercase tracking-wider", isDark ? "text-neutral-500" : "text-gray-700")}>KEYWORD HEATMAP</h3>
      </div>
      
      {isLoading ? (
        <div className={cn("flex-1 flex items-center justify-center text-[10px]", isDark ? "text-neutral-700" : "text-gray-500")}>
          Loading keywords...
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-2 py-1">
          <div className="space-y-0">
            {keywordData.map(([keyword, count]) => (
              <div key={keyword} className="flex items-center gap-2 py-0.5">
                <div className={cn("h-[3px] transition-all", getBarColor(count))} style={{ width: `${getBarWidth(count)}%` }}></div>
                <span className={cn("text-[10px] font-mono flex-shrink-0", isDark ? "text-neutral-600" : "text-gray-700")}>{keyword}</span>
                <span className={cn("text-[9px] font-mono tabular-nums ml-auto", isDark ? "text-neutral-700" : "text-gray-500")}>{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}