import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import TopBar from '@/components/feed/TopBar';
import SectorSidebar from '@/components/feed/SectorSidebar';
import GistPanel from '@/components/feed/GistPanel';
import CriticalArticles from '@/components/feed/CriticalArticles';
import NewsFeed from '@/components/feed/NewsFeed';
import SettingsModal from '@/components/feed/SettingsModal';
import { toast } from 'sonner';
import { cn } from "@/lib/utils";

const parseRSS = async (url) => {
  try {
    const corsProxy = 'https://api.allorigins.win/raw?url=';
    const response = await fetch(corsProxy + encodeURIComponent(url));
    const text = await response.text();
    const parser = new DOMParser();
    const xml = parser.parseFromString(text, 'text/xml');
    
    const items = xml.querySelectorAll('item');
    const articles = [];
    
    items.forEach((item) => {
      articles.push({
        title: item.querySelector('title')?.textContent || '',
        link: item.querySelector('link')?.textContent || '',
        description: item.querySelector('description')?.textContent?.replace(/<[^>]*>/g, '').slice(0, 200) || '',
        pubDate: item.querySelector('pubDate')?.textContent || null,
      });
    });
    
    return articles;
  } catch (error) {
    console.error('Error parsing RSS:', error);
    return [];
  }
};

export default function Home() {
  const queryClient = useQueryClient();
  const [activeSector, setActiveSector] = useState(null);
  const [activeSubsector, setActiveSubsector] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState('appearance');
  const [articles, setArticles] = useState([]);
  const [criticalArticles, setCriticalArticles] = useState([]);
  const [gist, setGist] = useState('');
  const [isLoadingArticles, setIsLoadingArticles] = useState(false);
  const [isLoadingGist, setIsLoadingGist] = useState(false);
  const [isLoadingCritical, setIsLoadingCritical] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: sectors = [], isLoading: sectorsLoading } = useQuery({
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
  const isDark = settings.theme === 'dark';

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
    
    // Update all orders
    const updates = reordered.map((sector, i) => 
      base44.entities.Sector.update(sector.id, { order: i + 1 })
    );
    await Promise.all(updates);
    queryClient.invalidateQueries({ queryKey: ['sectors'] });
  };

  useEffect(() => {
    if (sectors.length > 0 && !activeSector) {
      setActiveSector(sectors[0]);
    }
  }, [sectors, activeSector]);

  const fetchArticles = useCallback(async () => {
    if (!activeSector) return;
    
    setIsLoadingArticles(true);
    setArticles([]);
    setCriticalArticles([]);
    setGist('');
    
    const sectorSources = rssSources.filter(s => s.sector_id === activeSector.id && s.is_active !== false);
    
    if (sectorSources.length === 0) {
      setIsLoadingArticles(false);
      return;
    }

    const allArticles = [];
    
    for (const source of sectorSources) {
      const sourceArticles = await parseRSS(source.url);
      // Add sector/subsector info to each article
      allArticles.push(...sourceArticles.map(a => ({ 
        ...a, 
        source: source.name,
        sector: activeSector.name,
        subsector: activeSubsector?.name || ''
      })));
    }
    
    allArticles.sort((a, b) => {
      if (!a.pubDate || !b.pubDate) return 0;
      return new Date(b.pubDate) - new Date(a.pubDate);
    });
    
    setArticles(allArticles);
    setIsLoadingArticles(false);
    
    if (allArticles.length > 0) {
      generateGist(allArticles);
      generateCritical(allArticles);
    }
  }, [activeSector, activeSubsector, rssSources]);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  const generateGist = async (articleList) => {
    setIsLoadingGist(true);
    
    const instructions = activeSector?.ai_gist_instructions || settings?.default_gist_instructions || 
      'Provide a concise executive summary of the key themes and developments from these articles. Focus on actionable insights.';
    
    const articleSummaries = articleList.slice(0, 15).map(a => `- ${a.title}: ${a.description}`).join('\n');
    
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `${instructions}\n\nArticles:\n${articleSummaries}\n\nProvide a 2-3 paragraph intelligence summary:`,
    });
    
    setGist(result);
    setIsLoadingGist(false);
  };

  const generateCritical = async (articleList) => {
    setIsLoadingCritical(true);
    
    const instructions = activeSector?.ai_critical_instructions || settings?.default_critical_instructions || 
      'Identify the most important and impactful articles that decision-makers should read.';
    
    const keywords = activeSector?.keywords?.join(', ') || '';
    
    const articleData = articleList.slice(0, 20).map((a, i) => ({ 
      index: i, 
      title: a.title, 
      description: a.description 
    }));
    
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `${instructions}\n\n${keywords ? `Priority keywords: ${keywords}\n\n` : ''}Articles:\n${JSON.stringify(articleData)}\n\nSelect the 3-4 most critical articles and explain why each is important.`,
      response_json_schema: {
        type: 'object',
        properties: {
          critical_articles: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                index: { type: 'number' },
                reasoning: { type: 'string' }
              }
            }
          }
        }
      }
    });
    
    const critical = result.critical_articles?.map(c => ({
      ...articleList[c.index],
      reasoning: c.reasoning
    })).filter(Boolean) || [];
    
    setCriticalArticles(critical);
    setIsLoadingCritical(false);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchArticles();
    setIsRefreshing(false);
    toast.success('Feed refreshed');
  };

  const handleExport = () => {
    if (articles.length === 0) {
      toast.error('No articles to export');
      return;
    }
    
    const headers = ['Sector', 'Subsector', 'Date', 'News', 'Link'];
    
    const rows = articles.map(a => [
      `"${activeSector?.name || ''}"`,
      `"${activeSubsector?.name || ''}"`,
      a.pubDate ? new Date(a.pubDate).toISOString().split('T')[0] : '',
      `"${a.title?.replace(/"/g, '""') || ''}"`,
      a.link || ''
    ]);
    
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeSector?.name || 'feed'}_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Export downloaded');
  };

  const handleUpdateRSSSource = async (id, data) => {
    updateRSSMutation.mutate({ id, data });
  };

  const handleEditSectors = () => {
    setSettingsTab('sectors');
    setSettingsOpen(true);
  };

  return (
    <div className={cn(
      "h-screen flex flex-col",
      isDark ? "bg-neutral-950 text-white" : "bg-gray-50 text-gray-900"
    )}>
      <TopBar 
        onOpenSettings={() => { setSettingsTab('appearance'); setSettingsOpen(true); }}
        onExport={handleExport}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        theme={settings.theme}
      />
      
      <div className="flex-1 flex overflow-hidden">
        <div className="w-52 flex-shrink-0">
          <SectorSidebar
            sectors={sectors}
            activeSector={activeSector}
            activeSubsector={activeSubsector}
            onSelectSector={setActiveSector}
            onSelectSubsector={setActiveSubsector}
            isLoading={sectorsLoading}
            theme={settings.theme}
            onEditSectors={handleEditSectors}
          />
        </div>
        
        <main className={cn(
          "flex-1 overflow-y-auto p-5 space-y-4",
          isDark ? "bg-neutral-950" : "bg-gray-50"
        )}>
          <GistPanel 
            gist={gist} 
            isLoading={isLoadingGist} 
            sectorName={activeSector?.name}
            theme={settings.theme}
          />
          
          <CriticalArticles 
            articles={criticalArticles} 
            isLoading={isLoadingCritical}
            theme={settings.theme}
          />
          
          <NewsFeed 
            articles={articles} 
            isLoading={isLoadingArticles}
            theme={settings.theme}
          />
        </main>
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
        onUpdateRSSSource={handleUpdateRSSSource}
        onReorderSectors={handleReorderSectors}
        initialTab={settingsTab}
      />
    </div>
  );
}