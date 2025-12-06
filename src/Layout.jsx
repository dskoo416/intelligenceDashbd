import React, { useState, useEffect } from 'react';
import { Toaster, toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import TopBar from '@/components/feed/TopBar';
import NavigationSidebar from '@/components/feed/NavigationSidebar';
import SettingsModal from '@/components/feed/SettingsModal';
import { cn } from "@/lib/utils";

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

  const handleRefresh = () => {
    queryClient.invalidateQueries();
    toast.success('Refreshing data...');
  };

  // Clone children and pass props for pages
  const childrenWithProps = currentPageName === 'IntelligenceFeed' 
    ? React.cloneElement(children, { activeSector, activeSubsector })
    : currentPageName === 'Saved' || currentPageName === 'Home'
    ? React.cloneElement(children, { sidebarOpen })
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
        onRefresh={handleRefresh}
        onExport={async () => {
          const articles = await base44.entities.SavedArticle.list('-created_date');
          const collections = await base44.entities.Collection.list();
          const exportColumns = settings?.export_columns || ['title', 'link', 'source', 'sector', 'date', 'description'];
          const exportFormat = settings?.export_format || 'csv';
          
          const columnMap = {
            title: 'Title',
            link: 'Link',
            source: 'Source',
            sector: 'Sector',
            subsector: 'Subsector',
            date: 'Date',
            description: 'Description',
            collections: 'Collections'
          };
          
          const headers = exportColumns.map(col => columnMap[col]);
          
          const rows = articles.map(a => {
            const row = {};
            if (exportColumns.includes('title')) row.title = a.title?.replace(/"/g, '""') || '';
            if (exportColumns.includes('link')) row.link = a.link || '';
            if (exportColumns.includes('source')) row.source = a.source || '';
            if (exportColumns.includes('sector')) row.sector = a.sector || '';
            if (exportColumns.includes('subsector')) row.subsector = a.subsector || '';
            if (exportColumns.includes('date')) row.date = a.pubDate ? new Date(a.pubDate).toLocaleDateString() : '';
            if (exportColumns.includes('description')) row.description = a.description?.replace(/"/g, '""') || '';
            if (exportColumns.includes('collections')) {
              const articleCollections = collections.filter(c => a.collection_ids?.includes(c.id)).map(c => c.name).join('; ');
              row.collections = articleCollections;
            }
            return exportColumns.map(col => `"${row[col] || ''}"`);
          });
          
          if (exportFormat === 'email') {
            const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
            const blob = new Blob([csvContent], { type: 'text/csv' });
            const file = new File([blob], `saved-articles-${new Date().toISOString().split('T')[0]}.csv`, { type: 'text/csv' });
            const { file_url } = await base44.integrations.Core.UploadFile({ file });
            await base44.integrations.Core.SendEmail({
              to: settings?.export_email || 'user@example.com',
              subject: `Saved Articles Export - ${new Date().toLocaleDateString()}`,
              body: `Please find attached your exported articles.\n\nExport generated on ${new Date().toLocaleString()}\nTotal articles: ${articles.length}`
            });
            toast.success('Export emailed successfully');
          } else {
            const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
            const blob = new Blob([csvContent], { type: exportFormat === 'excel' ? 'application/vnd.ms-excel' : 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `saved-articles-${new Date().toISOString().split('T')[0]}.${exportFormat === 'excel' ? 'xls' : 'csv'}`;
            a.click();
            window.URL.revokeObjectURL(url);
            toast.success('Articles exported');
          }
        }}
        showRefresh={showTopBarActions}
        currentPage={currentPageName}
        sidebarOpen={sidebarOpen}
        theme={settings.theme}
      />
      
      <div className="flex-1 flex overflow-hidden">
        {sidebarOpen && (currentPageName === 'IntelligenceFeed' || currentPageName === 'Home') && (
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