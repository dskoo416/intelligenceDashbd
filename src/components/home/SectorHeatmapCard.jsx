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

  const getStripColor = (score) => {
    const ratio = score / maxScore;
    if (ratio > 0.7) return isDark ? 'bg-red-500' : 'bg-red-600';
    if (ratio > 0.5) return isDark ? 'bg-yellow-500' : 'bg-yellow-600';
    if (ratio > 0.3) return isDark ? 'bg-green-500' : 'bg-green-600';
    return isDark ? 'bg-neutral-700' : 'bg-gray-400';
  };

  return (
    <div className={cn("h-full flex flex-col", isDark ? "bg-[#131313] border border-[#1F1F1F]" : "bg-white border border-gray-300")}>
      <div className={cn("px-2 py-1 border-b", isDark ? "border-[#1F1F1F]" : "border-gray-300")}>
        <h3 className={cn("text-[10px] font-semibold uppercase tracking-wider", isDark ? "text-neutral-500" : "text-gray-700")}>SECTOR HEATMAP</h3>
      </div>
      
      {isLoading ? (
        <div className={cn("flex-1 flex items-center justify-center text-[10px]", isDark ? "text-neutral-700" : "text-gray-500")}>
          Analyzing sectors...
        </div>
      ) : (
        <div className="flex-1 px-2 py-1 space-y-0">
          {sectorActivity.map((sector) => (
            <div
              key={sector.name}
              className={cn("flex items-center py-1 transition-all", isDark ? "bg-[#0A0A0A]" : "bg-white")}
            >
              <div className={cn("w-1 h-full mr-2", getStripColor(sector.score))}></div>
              <div className="flex-1 flex items-center justify-between">
                <span className={cn("text-[10px] font-medium uppercase tracking-wide", isDark ? "text-neutral-600" : "text-gray-700")}>{sector.name}</span>
                <div className="flex items-center gap-3">
                  <span className={cn("text-[9px] font-mono", isDark ? "text-neutral-700" : "text-gray-500")}>
                    Density {sector.keywordDensity}
                  </span>
                  <span className={cn("text-[9px] font-mono tabular-nums", isDark ? "text-neutral-600" : "text-gray-600")}>
                    {sector.articleCount} ART
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}