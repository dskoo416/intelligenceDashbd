import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { cn } from "@/lib/utils";
import SectorSnapshotStrip from '@/components/home/SectorSnapshotStrip';
import FeaturedSectorTiles from '@/components/home/FeaturedSectorTiles';
import PolicyUpdatesCard from '@/components/home/PolicyUpdatesCard';
import TickerCard from '@/components/home/TickerCard';
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
      settings.theme === 'pastel' ? "bg-[#2B2D42]" :
      isDark ? "bg-[#0A0A0A]" : "bg-gray-50"
    )}>
      <div className="w-full space-y-3">
        {/* Top Strip - Sector Snapshot */}
        <SectorSnapshotStrip theme={settings.theme} />

        {/* Top Row - 3 Featured Tiles + Policy Updates */}
        <div className="grid grid-cols-4 gap-3" style={{ minHeight: '200px' }}>
          <div className="col-span-3">
            <FeaturedSectorTiles theme={settings.theme} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <PolicyUpdatesCard theme={settings.theme} />
          </div>
        </div>

        {/* Bottom Row - 3 Equal Cards */}
        <div className="grid grid-cols-3 gap-3" style={{ minHeight: '360px', maxHeight: '500px' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <KeywordHeatmapCard theme={settings.theme} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <TickerCard theme={settings.theme} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <MarketShareCard theme={settings.theme} />
          </div>
        </div>
      </div>
    </main>
  );
}