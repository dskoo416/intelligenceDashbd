import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { cn } from "@/lib/utils";

export default function SectorHeatmapCard({ theme }) {
  const isDark = theme === 'dark';
  const [sectorActivity, setSectorActivity] = useState([]);
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
    const analyzeSectorActivity = async () => {
      setIsLoading(true);
      const activityData = [];

      for (const sector of sectors.slice(0, 4)) {
        const sectorSources = rssSources.filter(s => s.sector_id === sector.id && s.is_active !== false);
        let articleCount = 0;
        let keywordDensity = 0;

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
                articleCount++;
                const title = item.querySelector('title')?.textContent || '';
                const words = title.toLowerCase().split(/\s+/).filter(w => w.length > 4);
                keywordDensity += words.length;
              }
            });
          } catch (error) {
            console.error('Error parsing RSS:', error);
          }
        }

        activityData.push({
          name: sector.name,
          articleCount,
          keywordDensity,
          score: articleCount * 10 + keywordDensity
        });
      }

      activityData.sort((a, b) => b.score - a.score);
      setSectorActivity(activityData);
      setIsLoading(false);
    };

    if (sectors.length > 0 && rssSources.length > 0) {
      analyzeSectorActivity();
    }
  }, [sectors, rssSources]);

  const maxScore = sectorActivity[0]?.score || 1;

  const getHeatColor = (score) => {
    const ratio = score / maxScore;
    if (ratio > 0.7) return isDark ? 'bg-red-500/30 border-red-500/50' : 'bg-red-100 border-red-300';
    if (ratio > 0.5) return isDark ? 'bg-yellow-500/30 border-yellow-500/50' : 'bg-yellow-100 border-yellow-300';
    if (ratio > 0.3) return isDark ? 'bg-green-500/30 border-green-500/50' : 'bg-green-100 border-green-300';
    return isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-gray-50 border-gray-300';
  };

  const getTextColor = (score) => {
    const ratio = score / maxScore;
    if (ratio > 0.7) return isDark ? 'text-red-400' : 'text-red-700';
    if (ratio > 0.5) return isDark ? 'text-yellow-400' : 'text-yellow-700';
    if (ratio > 0.3) return isDark ? 'text-green-400' : 'text-green-700';
    return isDark ? 'text-neutral-500' : 'text-gray-600';
  };

  return (
    <div className={cn("rounded border h-full flex flex-col", isDark ? "bg-neutral-900 border-neutral-800" : "bg-white border-gray-300")}>
      <div className={cn("px-3 py-2 border-b", isDark ? "border-neutral-800" : "border-gray-300")}>
        <h3 className={cn("font-semibold text-xs uppercase tracking-wide", isDark ? "text-neutral-300" : "text-gray-700")}>Sector Heatmap</h3>
      </div>
      
      {isLoading ? (
        <div className={cn("flex-1 flex items-center justify-center text-xs", isDark ? "text-neutral-600" : "text-gray-500")}>
          Analyzing sectors...
        </div>
      ) : (
        <div className="flex-1 px-3 py-2 space-y-1">
          {sectorActivity.map((sector) => (
            <div
              key={sector.name}
              className={cn("p-2 border transition-all", getHeatColor(sector.score))}
            >
              <div className={cn("flex items-center justify-between", getTextColor(sector.score))}>
                <span className="font-medium text-xs uppercase tracking-wide">{sector.name}</span>
                <span className="text-xs tabular-nums">{sector.articleCount} ART</span>
              </div>
              <div className={cn("text-xs mt-0.5 leading-tight", getTextColor(sector.score))}>
                Density: {sector.keywordDensity}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}