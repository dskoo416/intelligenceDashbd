import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { cn } from "@/lib/utils";
import TodayCard from '@/components/home/TodayCard';
import MarketSentimentCard from '@/components/home/MarketSentimentCard';
import TickerCard from '@/components/home/TickerCard';
import FeaturedArticlesCard from '@/components/home/FeaturedArticlesCard';
import KeywordHeatmapCard from '@/components/home/KeywordHeatmapCard';
import PolicyUpdatesCard from '@/components/home/PolicyUpdatesCard';

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
      "flex-1 overflow-y-auto p-3 text-content",
      `text-${textSize}`,
      isDark ? "bg-[#0A0A0A]" : "bg-gray-50"
    )}>
      <div className="w-full space-y-3">
        {/* Top Row */}
        <div className="grid grid-cols-10 gap-3 h-[280px]">
          <div className="col-span-5">
            <TodayCard theme={settings.theme} />
          </div>
          <div className="col-span-3">
            <MarketSentimentCard theme={settings.theme} />
          </div>
          <div className="col-span-2">
            <TickerCard theme={settings.theme} />
          </div>
        </div>

        {/* Featured Articles Row */}
        <div className="h-[140px]">
          <FeaturedArticlesCard theme={settings.theme} />
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-2 gap-3 h-[360px]">
          <KeywordHeatmapCard theme={settings.theme} />
          <PolicyUpdatesCard theme={settings.theme} />
        </div>
      </div>
    </main>
  );
}