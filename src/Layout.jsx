import React, { useState, useEffect } from 'react';
import { Toaster } from 'sonner';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import TopBar from '@/components/feed/TopBar';
import NavigationSidebar from '@/components/feed/NavigationSidebar';
import SettingsModal from '@/components/feed/SettingsModal';
import { cn } from "@/lib/utils";
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export default function Layout({ children, currentPageName }) {
  const queryClient = useQueryClient();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeSector, setActiveSector] = useState(null);
  const [activeSubsector, setActiveSubsector] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState('appearance');

  const { data: sectors = [] } = useQuery({
    queryKey: ['sectors'],
    queryFn: () => base44.entities.Sector.list('order'),
  });

  const { data: rssSources = [] } = useQuery({
    queryKey: ['rssSources'],
    queryFn: () => base44.entities.RSSSource.list(),
  });

  const { data: settingsData = [] } = useQuery({
    queryKey: ['appSettings'],
    queryFn: () => base44.entities.AppSettings.list(),
  });

  const settings = settingsData[0] || { theme: 'dark' };

  const updateSettingsMutation = useMutation({
    mutationFn: async (data) => {
      if (settingsData[0]?.id) {
        return base44.entities.AppSettings.update(settingsData[0].id, data);
      } else {
        return base44.entities.AppSettings.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appSettings'] });
      toast.success('Settings updated');
    },
  });

  const sectorMutation = useMutation({
    mutationFn: async (data) => {
      if (data.id) {
        return base44.entities.Sector.update(data.id, data);
      } else {
        const maxOrder = Math.max(0, ...sectors.map(s => s.order || 0));
        return base44.entities.Sector.create({ ...data, order: maxOrder + 1 });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sectors'] });
      toast.success('Sector saved');
    },
  });

  const deleteSectorMutation = useMutation({
    mutationFn: (id) => base44.entities.Sector.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sectors'] });
      toast.success('Sector deleted');
    },
  });

  const rssSourceMutation = useMutation({
    mutationFn: (data) => base44.entities.RSSSource.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rssSources'] });
      toast.success('RSS source added');
    },
  });

  const updateRSSMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.RSSSource.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rssSources'] });
      toast.success('RSS source updated');
    },
  });

  const deleteRSSMutation = useMutation({
    mutationFn: (id) => base44.entities.RSSSource.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rssSources'] });
      toast.success('RSS source removed');
    },
  });

  const handleReorderSectors = async (fromIndex, toIndex) => {
    const sortedSectors = [...sectors].sort((a, b) => (a.order || 0) - (b.order || 0));
    const reordered = [...sortedSectors];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);
    
    const updates = reordered.map((sector, i) => 
      base44.entities.Sector.update(sector.id, { order: i + 1 })
    );
    await Promise.all(updates);
    queryClient.invalidateQueries({ queryKey: ['sectors'] });
  };

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
        currentPage={currentPageName}
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
              onOpenSettings={() => { setSettingsTab('sectors'); setSettingsOpen(true); }}
              theme={settings.theme}
            />
          </div>
        )}
        
        {!sidebarOpen && <div className="w-0" />}
        
        {childrenWithProps}
      </div>

      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        sectors={sectors}
        rssSources={rssSources}
        onUpdateSettings={(data) => updateSettingsMutation.mutate(data)}
        onSaveSector={(data) => sectorMutation.mutate(data)}
        onDeleteSector={(id) => deleteSectorMutation.mutate(id)}
        onSaveRSSSource={(data) => rssSourceMutation.mutate(data)}
        onDeleteRSSSource={(id) => deleteRSSMutation.mutate(id)}
        onUpdateRSSSource={(id, data) => updateRSSMutation.mutate({ id, data })}
        onReorderSectors={handleReorderSectors}
        initialTab={settingsTab}
      />
    </div>
  );
}