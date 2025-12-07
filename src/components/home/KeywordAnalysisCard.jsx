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
    <div className={cn("h-full flex flex-col", isDark ? "bg-[#131313] border border-[#1F1F1F]" : "bg-white border border-gray-300")}>
      <div className={cn("px-2 py-1 border-b", isDark ? "border-[#1F1F1F]" : "border-gray-300")}>
        <h3 className={cn("text-[10px] font-semibold uppercase tracking-wider", isDark ? "text-neutral-500" : "text-gray-700")}>KEYWORD ANALYSIS</h3>
      </div>
      
      {isLoading ? (
        <div className={cn("flex-1 flex items-center justify-center text-[10px]", isDark ? "text-neutral-700" : "text-gray-500")}>
          Analyzing trends...
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-2 py-1 space-y-1.5 text-[10px]">
          <div>
            <div className={cn("flex items-center gap-1 mb-0.5 pb-0.5 border-b font-semibold uppercase tracking-wider text-[9px]", isDark ? "text-blue-500 border-[#1F1F1F]" : "text-blue-600 border-gray-300")}>
              <Sparkles className="w-2.5 h-2.5" />
              EMERGING
            </div>
            <div className="space-y-0">
              {keywordTrends.emerging.map(([word, count]) => (
                <div key={word} className={cn("flex justify-between leading-[1.3]", isDark ? "text-neutral-600" : "text-gray-600")}>
                  <span>{word}</span>
                  <span className="font-mono tabular-nums">{count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className={cn("border-t", isDark ? "border-[#1F1F1F]" : "border-gray-300")}>
            <div className={cn("flex items-center gap-1 mt-1 mb-0.5 pb-0.5 border-b font-semibold uppercase tracking-wider text-[9px]", isDark ? "text-green-500 border-[#1F1F1F]" : "text-green-600 border-gray-300")}>
              <TrendingUp className="w-2.5 h-2.5" />
              RISING
            </div>
            <div className="space-y-0">
              {keywordTrends.rising.map(({ word, change }) => (
                <div key={word} className={cn("flex justify-between leading-[1.3]", isDark ? "text-neutral-600" : "text-gray-600")}>
                  <span>{word}</span>
                  <span className={cn("font-mono tabular-nums", isDark ? "text-green-500" : "text-green-600")}>▲{change}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className={cn("border-t", isDark ? "border-[#1F1F1F]" : "border-gray-300")}>
            <div className={cn("flex items-center gap-1 mt-1 mb-0.5 pb-0.5 border-b font-semibold uppercase tracking-wider text-[9px]", isDark ? "text-red-500 border-[#1F1F1F]" : "text-red-600 border-gray-300")}>
              <TrendingDown className="w-2.5 h-2.5" />
              DECLINING
            </div>
            <div className="space-y-0">
              {keywordTrends.declining.map(([word, count]) => (
                <div key={word} className={cn("flex justify-between leading-[1.3]", isDark ? "text-neutral-600" : "text-gray-600")}>
                  <span>{word}</span>
                  <span className="font-mono tabular-nums">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}