import React, { useState, useEffect } from 'react';
import { Toaster } from 'sonner';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import TopBar from '@/components/feed/TopBar';
import NavigationSidebar from '@/components/feed/NavigationSidebar';
import SettingsModal from '@/components/feed/SettingsModal';
import { cn } from "@/lib/utils";
import { toast } from 'sonner';

export default function Layout({ children, currentPageName }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeSector, setActiveSector] = useState(null);
  const [activeSubsector, setActiveSubsector] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState('appearance');

  const { data: sectors = [] } = useQuery({
    queryKey: ['sectors'],
    queryFn: () => base44.entities.Sector.list('order'),
  });

  const { data: settingsData = [] } = useQuery({
    queryKey: ['appSettings'],
    queryFn: () => base44.entities.AppSettings.list(),
  });

  const settings = settingsData[0] || { theme: 'dark' };

  useEffect(() => {
    if (sectors.length > 0 && !activeSector) {
      const sortedSectors = [...sectors].sort((a, b) => (a.order || 0) - (b.order || 0));
      setActiveSector(sortedSectors[0]);
    }
  }, [sectors, activeSector]);

  const showTopBarActions = currentPageName === 'IntelligenceFeed';

  // Clone children and pass props for IntelligenceFeed page
  const childrenWithProps = currentPageName === 'IntelligenceFeed' 
    ? React.cloneElement(children, { activeSector, activeSubsector })
    : children;

  return (
    <div className={cn(
      "h-screen flex flex-col",
      settings.theme === 'dark' ? "bg-neutral-950 text-white" : "bg-gray-50 text-gray-900"
    )}>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(115, 115, 115, 0.3);
          border-radius: 2px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(115, 115, 115, 0.5);
        }
      `}</style>
      <Toaster position="top-right" />

      <TopBar 
        onOpenSettings={() => { setSettingsTab('appearance'); setSettingsOpen(true); }}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        showRefresh={showTopBarActions}
        theme={settings.theme}
      />
      
      <div className="flex-1 flex overflow-hidden">
        {sidebarOpen && (
          <div className="w-52 flex-shrink-0">
            <NavigationSidebar
              sectors={sectors}
              activeSector={activeSector}
              activeSubsector={activeSubsector}
              onSelectSector={setActiveSector}
              onSelectSubsector={setActiveSubsector}
              currentPage={currentPageName}
              theme={settings.theme}
            />
          </div>
        )}
        
        {childrenWithProps}
      </div>

      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        initialTab={settingsTab}
        theme={settings.theme}
      />
    </div>
  );
}