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
    if (ratio > 0.7) return isDark ? 'bg-red-500/80' : 'bg-red-600';
    if (ratio > 0.5) return isDark ? 'bg-orange-500/80' : 'bg-orange-500';
    if (ratio > 0.3) return isDark ? 'bg-yellow-500/80' : 'bg-yellow-500';
    return isDark ? 'bg-green-500/50' : 'bg-green-400';
  };

  const getTextColor = (score) => {
    const ratio = score / maxScore;
    return ratio > 0.5 ? 'text-white' : (isDark ? 'text-neutral-300' : 'text-gray-700');
  };

  return (
    <div className={cn("rounded-lg border p-4 h-full flex flex-col", isDark ? "bg-neutral-900 border-neutral-800" : "bg-white border-gray-200")}>
      <h3 className={cn("font-semibold text-sm mb-3", isDark ? "text-white" : "text-gray-900")}>Sector Heatmap</h3>
      
      {isLoading ? (
        <div className={cn("flex-1 flex items-center justify-center text-xs", isDark ? "text-neutral-500" : "text-gray-500")}>
          Analyzing sectors...
        </div>
      ) : (
        <div className="flex-1 space-y-2">
          {sectorActivity.map((sector) => (
            <div
              key={sector.name}
              className={cn("p-3 rounded transition-all", getHeatColor(sector.score))}
            >
              <div className={cn("flex items-center justify-between", getTextColor(sector.score))}>
                <span className="font-medium text-xs">{sector.name}</span>
                <span className="text-xs">{sector.articleCount} articles</span>
              </div>
              <div className={cn("text-xs mt-1", getTextColor(sector.score))}>
                Keyword density: {sector.keywordDensity}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}