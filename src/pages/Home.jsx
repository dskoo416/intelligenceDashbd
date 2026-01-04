import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { cn } from "@/lib/utils";
import SectorSummaryTiles from '@/components/home/SectorSummaryTiles';
import DailyBriefing from '@/components/home/DailyBriefing';
import CommercialImpactPanel from '@/components/home/CommercialImpactPanel';
import StructuralChangePanel from '@/components/home/StructuralChangePanel';
import CompetitivePressurePanel from '@/components/home/CompetitivePressurePanel';
import PolicyUpdatesCard from '@/components/home/PolicyUpdatesCard';
import TickerCard from '@/components/home/TickerCard';
import KeywordHeatmapCard from '@/components/home/KeywordHeatmapCard';
import MarketShareCard from '@/components/home/MarketShareCard';

export default function Home({ sidebarOpen, activeSector }) {
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
      settings.theme === 'pastel' ? "bg-[#2B2D42]" :
      isDark ? "bg-[#0A0A0A]" : "bg-gray-50"
    )}>
      <div className="flex flex-col gap-3 h-full">
        {/* Top Strip - Level 1 Summary or Daily Briefing */}
        <div className="flex-shrink-0">
          {settings.use_daily_briefings ? (
            <DailyBriefing theme={settings.theme} />
          ) : (
            <SectorSummaryTiles theme={settings.theme} />
          )}
        </div>

        {/* Middle Row - Decision-Oriented Intelligence Panels + Policy Updates */}
        <div className="grid grid-cols-4 gap-3 flex-shrink-0" style={{ height: '280px' }}>
          <div className="h-full overflow-hidden">
            <CommercialImpactPanel theme={settings.theme} />
          </div>
          <div className="h-full overflow-hidden">
            <StructuralChangePanel theme={settings.theme} />
          </div>
          <div className="h-full overflow-hidden">
            <CompetitivePressurePanel theme={settings.theme} />
          </div>
          <div className="h-full overflow-hidden">
            <PolicyUpdatesCard theme={settings.theme} />
          </div>
        </div>

        {/* Bottom Row - 3 Equal Cards */}
        <div className="grid grid-cols-3 gap-3 flex-1 min-h-0">
          <div className="h-full overflow-hidden">
            <KeywordHeatmapCard theme={settings.theme} />
          </div>
          <div className="h-full overflow-hidden">
            <TickerCard theme={settings.theme} />
          </div>
          <div className="h-full overflow-hidden">
            <MarketShareCard theme={settings.theme} />
          </div>
        </div>
      </div>
    </main>
  );
}