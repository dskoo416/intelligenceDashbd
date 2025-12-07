import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { cn } from "@/lib/utils";
import SpotlightCard from '@/components/home/SpotlightCard';
import MarketSentimentCard from '@/components/home/MarketSentimentCard';
import TickerCard from '@/components/home/TickerCard';
import FeaturedArticlesCard from '@/components/home/FeaturedArticlesCard';
import KeywordHeatmapCard from '@/components/home/KeywordHeatmapCard';
import KeywordAnalysisCard from '@/components/home/KeywordAnalysisCard';
import SectorHeatmapCard from '@/components/home/SectorHeatmapCard';

export default function Home({ sidebarOpen }) {
  const { data: settingsData = [] } = useQuery({
    queryKey: ['appSettings'],
    queryFn: () => base44.entities.AppSettings.list(),
  });

  const settings = settingsData[0] || { theme: 'dark' };
  const isDark = settings.theme === 'dark';
  const textSize = localStorage.getItem('textSize') || 'medium';

  return (
    <main className={cn(
      "flex-1 overflow-y-auto p-2 text-content",
      `text-${textSize}`,
      isDark ? "bg-[#0A0A0A]" : "bg-gray-50"
    )}>
      <div className="w-full space-y-1">
        {/* Top Row */}
        <div className="grid grid-cols-10 gap-1 h-[280px]">
          <div className="col-span-5">
            <SpotlightCard theme={settings.theme} />
          </div>
          <div className="col-span-3">
            <MarketSentimentCard theme={settings.theme} />
          </div>
          <div className="col-span-2">
            <TickerCard theme={settings.theme} />
          </div>
        </div>

        {/* Featured Articles Row */}
        <div className="h-[260px]">
          <FeaturedArticlesCard theme={settings.theme} />
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-3 gap-1 h-[280px]">
          <KeywordHeatmapCard theme={settings.theme} />
          <KeywordAnalysisCard theme={settings.theme} />
          <SectorHeatmapCard theme={settings.theme} />
        </div>
      </div>
    </main>
  );
}