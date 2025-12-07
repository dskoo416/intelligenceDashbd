import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Sparkles } from 'lucide-react';

export default function KeywordAnalysisCard({ theme }) {
  const isDark = theme === 'dark';
  const [keywordTrends, setKeywordTrends] = useState({ emerging: [], rising: [], declining: [] });
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
    const analyzeKeywordTrends = async () => {
      setIsLoading(true);
      const recentKeywords = {};
      const olderKeywords = {};

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
              const title = item.querySelector('title')?.textContent || '';
              const words = title.toLowerCase().split(/\s+/).filter(w => w.length > 4);
              
              if (idx < 5) {
                words.forEach(word => {
                  recentKeywords[word] = (recentKeywords[word] || 0) + 1;
                });
              } else if (idx >= 5 && idx < 15) {
                words.forEach(word => {
                  olderKeywords[word] = (olderKeywords[word] || 0) + 1;
                });
              }
            });
          } catch (error) {
            console.error('Error parsing RSS:', error);
          }
        }
      }

      const emerging = Object.entries(recentKeywords)
        .filter(([word]) => !olderKeywords[word])
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

      const rising = Object.entries(recentKeywords)
        .filter(([word]) => olderKeywords[word])
        .map(([word, count]) => ({
          word,
          change: Math.round(((count - (olderKeywords[word] || 0)) / (olderKeywords[word] || 1)) * 100)
        }))
        .filter(item => item.change > 0)
        .sort((a, b) => b.change - a.change)
        .slice(0, 5);

      const declining = Object.entries(olderKeywords)
        .filter(([word]) => !recentKeywords[word] || recentKeywords[word] < olderKeywords[word])
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

      setKeywordTrends({ emerging, rising, declining });
      setIsLoading(false);
    };

    if (sectors.length > 0 && rssSources.length > 0) {
      analyzeKeywordTrends();
    }
  }, [sectors, rssSources]);

  return (
    <div className={cn("rounded-lg border p-4 h-full flex flex-col", isDark ? "bg-neutral-900 border-neutral-800" : "bg-white border-gray-200")}>
      <h3 className={cn("font-semibold text-sm mb-3", isDark ? "text-white" : "text-gray-900")}>Keyword Analysis</h3>
      
      {isLoading ? (
        <div className={cn("flex-1 flex items-center justify-center text-xs", isDark ? "text-neutral-500" : "text-gray-500")}>
          Analyzing trends...
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-3 text-xs">
          <div>
            <div className={cn("flex items-center gap-1 mb-1 font-medium", isDark ? "text-blue-400" : "text-blue-600")}>
              <Sparkles className="w-3 h-3" />
              Emerging
            </div>
            {keywordTrends.emerging.map(([word, count]) => (
              <div key={word} className={cn("flex justify-between", isDark ? "text-neutral-400" : "text-gray-600")}>
                <span>{word}</span>
                <span>{count}</span>
              </div>
            ))}
          </div>

          <div>
            <div className={cn("flex items-center gap-1 mb-1 font-medium", isDark ? "text-green-400" : "text-green-600")}>
              <TrendingUp className="w-3 h-3" />
              Rising
            </div>
            {keywordTrends.rising.map(({ word, change }) => (
              <div key={word} className={cn("flex justify-between", isDark ? "text-neutral-400" : "text-gray-600")}>
                <span>{word}</span>
                <span className={cn(isDark ? "text-green-400" : "text-green-600")}>+{change}%</span>
              </div>
            ))}
          </div>

          <div>
            <div className={cn("flex items-center gap-1 mb-1 font-medium", isDark ? "text-red-400" : "text-red-600")}>
              <TrendingDown className="w-3 h-3" />
              Declining
            </div>
            {keywordTrends.declining.map(([word, count]) => (
              <div key={word} className={cn("flex justify-between", isDark ? "text-neutral-400" : "text-gray-600")}>
                <span>{word}</span>
                <span>{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}