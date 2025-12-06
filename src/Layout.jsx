import React, { useState, useEffect } from 'react';
import { Toaster, toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import MenuBar from '@/components/MenuBar';
import TopBar from '@/components/feed/TopBar';
import NavigationSidebar from '@/components/feed/NavigationSidebar';
import SavedSidebar from '@/components/saved/SavedSidebar';
import CollectionsModal from '@/components/saved/CollectionsModal';
import SettingsModal from '@/components/feed/SettingsModal';
import { cn } from "@/lib/utils";

export default function Layout({ children, currentPageName }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeSector, setActiveSector] = useState(null);
  const [activeSubsector, setActiveSubsector] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState('appearance');
  const [activeView, setActiveView] = useState('main');
  const [collectionsModalOpen, setCollectionsModalOpen] = useState(false);
  const [textSize, setTextSize] = useState(() => localStorage.getItem('textSize') || 'medium');
  const [sidebarVisible, setSidebarVisible] = useState(true);

  const { data: sectors = [] } = useQuery({
    queryKey: ['sectors'],
    queryFn: () => base44.entities.Sector.list('order'),
  });

  const { data: rssSources = [] } = useQuery({
    queryKey: ['rssSources'],
    queryFn: () => base44.entities.RSSSource.list(),
  });

  const { data: collections = [] } = useQuery({
    queryKey: ['collections'],
    queryFn: () => base44.entities.Collection.list('order'),
  });

  const { data: savedArticles = [] } = useQuery({
    queryKey: ['savedArticles'],
    queryFn: () => base44.entities.SavedArticle.list('-created_date'),
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

  const collectionMutation = useMutation({
    mutationFn: async (data) => {
      if (data.id) {
        return base44.entities.Collection.update(data.id, data);
      } else {
        const maxOrder = Math.max(0, ...collections.map(c => c.order || 0));
        return base44.entities.Collection.create({ ...data, order: maxOrder + 1 });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      toast.success('Collection saved');
    },
  });

  const deleteCollectionMutation = useMutation({
    mutationFn: (id) => base44.entities.Collection.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      toast.success('Collection deleted');
    },
  });

  const handleReorderCollections = async (fromIndex, toIndex) => {
    const sortedCollections = [...collections].sort((a, b) => (a.order || 0) - (b.order || 0));
    const reordered = [...sortedCollections];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);
    
    const updates = reordered.map((collection, i) => 
      base44.entities.Collection.update(collection.id, { order: i + 1 })
    );
    await Promise.all(updates);
    queryClient.invalidateQueries({ queryKey: ['collections'] });
  };

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
    : currentPageName === 'Saved'
    ? React.cloneElement(children, { sidebarOpen: false, activeView, onSelectView: setActiveView })
    : currentPageName === 'Home'
    ? React.cloneElement(children, { sidebarOpen })
    : children;

  return (
    <div className={cn(
      "h-screen flex flex-col",
      settings.theme === 'dark' ? "bg-neutral-950 text-white" : "bg-gray-50 text-gray-900"
      )}>
        <style>{`
          .text-content.text-small,
          .text-content.text-small * { 
            font-size: 0.8125rem !important; 
            line-height: 1.4 !important;
          }
          .text-content.text-medium,
          .text-content.text-medium * { 
            font-size: 0.875rem !important; 
            line-height: 1.5 !important;
          }
          .text-content.text-large,
          .text-content.text-large * { 
            font-size: 1rem !important; 
            line-height: 1.6 !important;
          }
        `}</style>
        <MenuBar
          theme={settings.theme}
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
        currentPage={currentPageName}
        onOpenSettings={() => { setSettingsTab('appearance'); setSettingsOpen(true); }}
        onOpenSectorsSettings={() => { setSettingsTab('sectors'); setSettingsOpen(true); }}
        onOpenCollectionsSettings={() => { setSettingsTab('collections'); setSettingsOpen(true); }}
        onOpenRSSSettings={() => { setSettingsTab('rss'); setSettingsOpen(true); }}
        autoLoadGist={settings?.auto_reload_gist || false}
        autoLoadCritical={settings?.auto_reload_critical || false}
        onToggleAutoLoadGist={() => {
          const newSettings = { ...settings, auto_reload_gist: !settings?.auto_reload_gist };
          updateSettingsMutation.mutate(newSettings);
        }}
        onToggleAutoLoadCritical={() => {
          const newSettings = { ...settings, auto_reload_critical: !settings?.auto_reload_critical };
          updateSettingsMutation.mutate(newSettings);
        }}
        viewMode={localStorage.getItem('newsViewMode') || 'compact'}
        onToggleViewMode={() => {
          const current = localStorage.getItem('newsViewMode') || 'compact';
          const newMode = current === 'compact' ? 'regular' : 'compact';
          localStorage.setItem('newsViewMode', newMode);
          localStorage.setItem('savedViewMode', newMode);
          window.location.reload();
        }}
        onToggleTheme={() => {
          const newSettings = { ...settings, theme: settings.theme === 'dark' ? 'light' : 'dark' };
          updateSettingsMutation.mutate(newSettings);
        }}
        onNavigateToIntelligence={() => navigate(createPageUrl('IntelligenceFeed'))}
        onNavigateToSaved={() => navigate(createPageUrl('Saved'))}
        textSize={textSize}
        onChangeTextSize={(size) => {
          if (size === 'small' && textSize !== 'small') {
            setTextSize('small');
            localStorage.setItem('textSize', 'small');
          } else if (size === 'medium' && textSize !== 'medium') {
            setTextSize('medium');
            localStorage.setItem('textSize', 'medium');
          } else if (size === 'large' && textSize !== 'large') {
            setTextSize('large');
            localStorage.setItem('textSize', 'large');
          }
        }}
        sidebarVisible={sidebarVisible}
        onToggleSidebarVisibility={() => setSidebarVisible(!sidebarVisible)}
        />
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
      <Toaster position="bottom-right" />

      <TopBar 
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        currentPage={currentPageName}
        sidebarOpen={sidebarOpen}
        theme={settings.theme}
        onOpenSettings={() => { setSettingsTab('appearance'); setSettingsOpen(true); }}
      />
      
      <div className={cn(
        "flex-1 overflow-hidden",
        currentPageName === 'Saved' && sidebarOpen && sidebarVisible
          ? "grid grid-cols-[208px_minmax(0,1fr)]"
          : "flex"
      )}>
        {sidebarOpen && sidebarVisible && currentPageName === 'Saved' && (
          <SavedSidebar
            savedArticles={savedArticles}
            collections={collections}
            activeView={activeView}
            onSelectView={setActiveView}
            onOpenCollectionsModal={() => setCollectionsModalOpen(true)}
            theme={settings.theme}
          />
        )}
        
        {sidebarOpen && sidebarVisible && (currentPageName === 'IntelligenceFeed' || currentPageName === 'Home') && (
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
        collections={collections}
        onUpdateSettings={(data) => updateSettingsMutation.mutate(data)}
        onSaveSector={(data) => sectorMutation.mutate(data)}
        onDeleteSector={(id) => deleteSectorMutation.mutate(id)}
        onSaveRSSSource={(data) => rssSourceMutation.mutate(data)}
        onDeleteRSSSource={(id) => deleteRSSMutation.mutate(id)}
        onUpdateRSSSource={(id, data) => updateRSSMutation.mutate({ id, data })}
        onReorderSectors={handleReorderSectors}
        onSaveCollection={(data) => collectionMutation.mutate(data)}
        onDeleteCollection={(id) => deleteCollectionMutation.mutate(id)}
        onReorderCollections={handleReorderCollections}
        initialTab={settingsTab}
      />

      <CollectionsModal
        isOpen={collectionsModalOpen}
        onClose={() => setCollectionsModalOpen(false)}
        collections={collections}
        onSaveCollection={(data) => collectionMutation.mutate(data)}
        onDeleteCollection={(id) => deleteCollectionMutation.mutate(id)}
        onReorderCollections={handleReorderCollections}
      />
    </div>
  );
}