import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { cn } from "@/lib/utils";

export default function KeywordHeatmapCard({ theme }) {
  const isDark = theme === 'dark';
  const [keywordData, setKeywordData] = useState([]);
  const [sentimentHistory, setSentimentHistory] = useState({});
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
        .slice(0, 12);

      setKeywordData(sortedKeywords);
      
      // Generate mock 7-day sentiment history
      const history = {};
      sectors.slice(0, 4).forEach(sector => {
        history[sector.name] = Array.from({ length: 7 }, () => Math.floor(Math.random() * 8) + 1);
      });
      setSentimentHistory(history);
      
      setIsLoading(false);
    };

    if (sectors.length > 0 && rssSources.length > 0) {
      analyzeKeywords();
    }
  }, [sectors, rssSources]);

  const maxCount = keywordData[0]?.[1] || 1;
  
  const getBlockSize = (count) => {
    const ratio = count / maxCount;
    if (ratio > 0.7) return 'col-span-2 row-span-2';
    if (ratio > 0.4) return 'col-span-2 row-span-1';
    return 'col-span-1 row-span-1';
  };

  const getBlockColor = (count) => {
    const ratio = count / maxCount;
    if (ratio > 0.7) return isDark ? 'bg-[#3A5F3A]' : 'bg-green-200';
    if (ratio > 0.4) return isDark ? 'bg-[#807333]' : 'bg-yellow-200';
    return isDark ? 'bg-[#7A2E2E]' : 'bg-red-200';
  };

  const sparklineChars = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'];

  return (
    <div className={cn("h-full flex flex-col rounded", isDark ? "bg-[#131313] border border-[#1F1F1F] shadow-sm" : "bg-white border border-gray-300 shadow-sm")}>
      {/* Keyword Treemap - Top Half */}
      <div className="flex-1 flex flex-col border-b border-[#1F1F1F]">
        <div className={cn("px-2 py-1 border-b", isDark ? "border-[#1F1F1F]" : "border-gray-300")}>
          <h3 className={cn("text-[10px] font-semibold uppercase tracking-wider", isDark ? "text-neutral-500" : "text-gray-700")}>KEYWORD TREEMAP</h3>
        </div>
        
        {isLoading ? (
          <div className={cn("flex-1 flex items-center justify-center text-[10px]", isDark ? "text-neutral-700" : "text-gray-500")}>
            Loading keywords...
          </div>
        ) : (
          <div className="flex-1 p-2">
            <div className="grid grid-cols-6 grid-rows-4 gap-1 h-full">
              {keywordData.map(([keyword, count]) => (
                <div
                  key={keyword}
                  className={cn(
                    "flex items-center justify-center text-center p-1 transition-all",
                    getBlockSize(count),
                    getBlockColor(count)
                  )}
                >
                  <div>
                    <div className={cn("text-[9px] font-mono font-semibold", isDark ? "text-neutral-300" : "text-gray-800")}>{keyword}</div>
                    <div className={cn("text-[8px] font-mono", isDark ? "text-neutral-500" : "text-gray-600")}>{count}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Rolling 7 Day Sentiment - Bottom Half */}
      <div className="flex-1 flex flex-col">
        <div className={cn("px-2 py-1 border-b", isDark ? "border-[#1F1F1F]" : "border-gray-300")}>
          <h3 className={cn("text-[10px] font-semibold uppercase tracking-wider", isDark ? "text-neutral-500" : "text-gray-700")}>ROLLING 7 DAY SENTIMENT</h3>
        </div>
        
        <div className="flex-1 px-2 py-1.5 space-y-1">
          {Object.entries(sentimentHistory).map(([sector, values]) => (
            <div key={sector} className="flex items-center justify-between">
              <span className={cn("text-[9px] font-medium w-32", isDark ? "text-neutral-600" : "text-gray-700")}>{sector}</span>
              <div className={cn("font-mono text-[11px] tracking-tight", isDark ? "text-green-500" : "text-green-600")}>
                {values.map((v, idx) => sparklineChars[v - 1] || '▁').join('')}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}