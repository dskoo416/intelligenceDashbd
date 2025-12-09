import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { cn } from "@/lib/utils";
import TodayCard from '@/components/home/TodayCard';
import PolicyUpdatesCard from '@/components/home/PolicyUpdatesCard';
import TickerCard from '@/components/home/TickerCard';
import FeaturedArticlesCard from '@/components/home/FeaturedArticlesCard';
import KeywordHeatmapCard from '@/components/home/KeywordHeatmapCard';
import MarketShareCard from '@/components/home/MarketShareCard';

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
      <div 
        className="w-full"
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1.5fr) minmax(0, 1.5fr)',
          gridAutoRows: 'auto',
          gap: '12px'
        }}
      >
        {/* Top Row */}
        <div style={{ minHeight: '280px', maxHeight: '400px', display: 'flex', flexDirection: 'column' }}>
          <TodayCard theme={settings.theme} />
        </div>
        <div style={{ minHeight: '280px', maxHeight: '400px', display: 'flex', flexDirection: 'column' }}>
          <PolicyUpdatesCard theme={settings.theme} />
        </div>
        <div style={{ minHeight: '280px', maxHeight: '400px', display: 'flex', flexDirection: 'column' }}>
          <TickerCard theme={settings.theme} />
        </div>

        {/* Featured Articles Row */}
        <div style={{ gridColumn: '1 / -1', minHeight: '140px', maxHeight: '180px' }}>
          <FeaturedArticlesCard theme={settings.theme} />
        </div>

        {/* Bottom Row */}
        <div style={{ minHeight: '360px', maxHeight: '500px', display: 'flex', flexDirection: 'column' }}>
          <KeywordHeatmapCard theme={settings.theme} />
        </div>
        <div style={{ gridColumn: 'span 2', minHeight: '360px', maxHeight: '500px', display: 'flex', flexDirection: 'column' }}>
          <MarketShareCard theme={settings.theme} />
        </div>
      </div>
    </main>
  );
}