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
    if (ratio > 0.7) return isDark ? 'bg-red-500/30 text-red-400' : 'bg-red-100 text-red-700';
    if (ratio > 0.4) return isDark ? 'bg-yellow-500/30 text-yellow-400' : 'bg-yellow-100 text-yellow-700';
    return isDark ? 'bg-green-500/30 text-green-400' : 'bg-green-100 text-green-700';
  };

  return (
    <div className={cn("rounded border h-full flex flex-col", isDark ? "bg-neutral-900 border-neutral-800" : "bg-white border-gray-300")}>
      <div className={cn("px-3 py-2 border-b", isDark ? "border-neutral-800" : "border-gray-300")}>
        <h3 className={cn("font-semibold text-xs uppercase tracking-wide", isDark ? "text-neutral-300" : "text-gray-700")}>Keyword Heatmap</h3>
      </div>
      
      {isLoading ? (
        <div className={cn("flex-1 flex items-center justify-center text-xs", isDark ? "text-neutral-600" : "text-gray-500")}>
          Loading keywords...
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-3 py-2">
          <div className="space-y-0.5">
            {keywordData.map(([keyword, count]) => (
              <div
                key={keyword}
                className={cn("px-2 py-0.5 text-xs font-mono border-l-2 flex items-center justify-between", getIntensity(count))}
              >
                <span>{keyword}</span>
                <span className="tabular-nums ml-2">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}