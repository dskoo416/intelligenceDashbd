import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import GistPanel from '@/components/feed/GistPanel';
import CriticalArticles from '@/components/feed/CriticalArticles';
import NewsFeed from '@/components/feed/NewsFeed';
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

export default function IntelligenceFeed({ activeSector, activeSubsector }) {
  const queryClient = useQueryClient();
  const [dataCache, setDataCache] = useState({});
  const [dateFilter, setDateFilter] = useState(null);
  const [searchFilter, setSearchFilter] = useState('');
  
  const sectorKey = activeSector?.id || 'none';
  const cachedData = dataCache[sectorKey] || {
    articles: [],
    criticalArticles: [],
    gist: '',
    isLoadingArticles: false,
    isLoadingGist: false,
    isLoadingCritical: false,
  };

  const [articles, setArticles] = useState(cachedData.articles);
  const [criticalArticles, setCriticalArticles] = useState(cachedData.criticalArticles);
  const [gist, setGist] = useState(cachedData.gist);
  const [isLoadingArticles, setIsLoadingArticles] = useState(false);
  const [isLoadingGist, setIsLoadingGist] = useState(false);
  const [isLoadingCritical, setIsLoadingCritical] = useState(false);

  const updateCache = (key, updates) => {
    setDataCache(prev => ({
      ...prev,
      [key]: { ...(prev[key] || {}), ...updates }
    }));
  };

  const { data: rssSources = [] } = useQuery({
    queryKey: ['rssSources'],
    queryFn: () => base44.entities.RSSSource.list(),
  });

  const { data: settingsData = [] } = useQuery({
    queryKey: ['appSettings'],
    queryFn: () => base44.entities.AppSettings.list(),
  });

  const settings = settingsData[0] || { theme: 'dark' };

  const { data: cacheData = [] } = useQuery({
    queryKey: ['sectorCache', sectorKey],
    queryFn: async () => {
      if (!activeSector) return [];
      const subsectorName = activeSubsector?.name || '';
      return base44.entities.SectorCache.filter({ 
        sector_id: activeSector.id,
        subsector_name: subsectorName
      });
    },
    enabled: !!activeSector,
  });

  const savedCache = cacheData[0];

  const { data: savedArticles = [] } = useQuery({
    queryKey: ['savedArticles'],
    queryFn: () => base44.entities.SavedArticle.list(),
  });

  const saveArticleMutation = useMutation({
    mutationFn: async (article) => {
      const existing = savedArticles.find(a => a.link === article.link);
      if (existing) {
        await base44.entities.SavedArticle.delete(existing.id);
        return { deleted: true };
      } else {
        return base44.entities.SavedArticle.create({ ...article, collection_ids: [] });
      }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['savedArticles'] });
      toast.success(result?.deleted ? 'Article removed' : 'Article saved');
    },
  });

  const fetchArticles = useCallback(async (forceRefresh = false) => {
    if (!activeSector) return;
    
    const key = activeSector.id;
    const cached = dataCache[key];

    if (cached?.articles?.length > 0 && !forceRefresh) {
      setArticles(cached.articles);
      setGist(cached.gist || savedCache?.gist || '');
      setCriticalArticles(cached.criticalArticles || savedCache?.critical_articles || []);
      setIsLoadingArticles(false);
      return;
    }

    if (savedCache && !forceRefresh) {
      setGist(savedCache.gist || '');
      setCriticalArticles(savedCache.critical_articles || []);
    }

    if (!settings?.auto_reload_news && cached?.articles && !forceRefresh) {
      setArticles(cached.articles);
      setIsLoadingArticles(false);
      return;
    }
    
    setIsLoadingArticles(true);
    setArticles([]);
    
    const sectorSources = rssSources.filter(s => s.sector_id === activeSector.id && s.is_active !== false);
    
    if (sectorSources.length === 0) {
      setIsLoadingArticles(false);
      return;
    }

    const allArticles = [];
    
    for (const source of sectorSources) {
      const sourceArticles = await parseRSS(source.url);
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
    updateCache(key, { articles: allArticles });
    setIsLoadingArticles(false);
  }, [activeSector, activeSubsector, rssSources, dataCache]);

  useEffect(() => {
    const key = activeSector?.id || 'none';
    const cached = dataCache[key];

    if (cached) {
      setArticles(cached.articles || []);
      setGist(cached.gist || '');
      setCriticalArticles(cached.criticalArticles || []);
      setIsLoadingArticles(false);
    } else {
      setGist('');
      setCriticalArticles([]);
    }

    if (settings?.auto_reload_news || !cached?.articles) {
      fetchArticles(false);
    }
  }, [activeSector]);

  const generateGist = async () => {
    if (articles.length === 0) return;
    
    setIsLoadingGist(true);
    
    const instructions = activeSector?.ai_gist_instructions || settings?.default_gist_instructions || 
      'Provide a concise executive summary of the key themes and developments from these articles. Focus on actionable insights.';
    
    const articleSummaries = articles.slice(0, 15).map(a => `- ${a.title}: ${a.description}`).join('\n');
    
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `${instructions}\n\nArticles:\n${articleSummaries}\n\nProvide a 2-3 paragraph intelligence summary:`,
    });
    
    setGist(result);
    updateCache(sectorKey, { gist: result });
    
    const subsectorName = activeSubsector?.name || '';
    if (savedCache?.id) {
      await base44.entities.SectorCache.update(savedCache.id, { gist: result });
    } else {
      await base44.entities.SectorCache.create({
        sector_id: activeSector.id,
        subsector_name: subsectorName,
        gist: result,
        critical_articles: criticalArticles
      });
    }
    queryClient.invalidateQueries({ queryKey: ['sectorCache', sectorKey] });
    
    setIsLoadingGist(false);
  };

  const generateCritical = async () => {
    if (articles.length === 0) return;
    
    setIsLoadingCritical(true);
    
    const instructions = activeSector?.ai_critical_instructions || settings?.default_critical_instructions || 
      'Identify the most important and impactful articles that decision-makers should read.';
    
    const keywords = activeSector?.keywords?.join(', ') || '';
    
    const articleData = articles.slice(0, 20).map((a, i) => ({ 
      index: i, 
      title: a.title, 
      description: a.description 
    }));
    
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `${instructions}\n\n${keywords ? `Priority keywords: ${keywords}\n\n` : ''}Articles:\n${JSON.stringify(articleData)}\n\nSelect the 3-4 most featured articles and explain why each is important.`,
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
      ...articles[c.index],
      reasoning: c.reasoning
    })).filter(Boolean) || [];
    
    setCriticalArticles(critical);
    updateCache(sectorKey, { criticalArticles: critical });
    
    const subsectorName = activeSubsector?.name || '';
    if (savedCache?.id) {
      await base44.entities.SectorCache.update(savedCache.id, { critical_articles: critical });
    } else {
      await base44.entities.SectorCache.create({
        sector_id: activeSector.id,
        subsector_name: subsectorName,
        gist: gist,
        critical_articles: critical
      });
    }
    queryClient.invalidateQueries({ queryKey: ['sectorCache', sectorKey] });
    
    setIsLoadingCritical(false);
  };



  const handleSaveArticle = (article) => {
    saveArticleMutation.mutate(article);
  };

  const filteredArticles = articles.filter(a => {
    // Filter by subsector if selected
    if (activeSubsector) {
      if (a.subsector !== activeSubsector.name) return false;
    }
    
    if (dateFilter && a.pubDate) {
      const articleDate = new Date(a.pubDate);
      if (dateFilter.from && dateFilter.to) {
        const fromDate = new Date(dateFilter.from);
        const toDate = new Date(dateFilter.to);
        if (articleDate < fromDate || articleDate > toDate) return false;
      } else if (dateFilter.from) {
        const fromDate = new Date(dateFilter.from);
        if (articleDate.toDateString() !== fromDate.toDateString()) return false;
      }
    }
    if (searchFilter && !a.title.toLowerCase().includes(searchFilter.toLowerCase())) {
      return false;
    }
    return true;
  });

  const textSize = localStorage.getItem('textSize') || 'medium';
  
  return (
    <main className={cn(
      "flex-1 overflow-y-auto p-5 space-y-4 text-content",
      `text-${textSize}`,
      settings.theme === 'dark' ? "bg-neutral-950" : "bg-gray-50"
    )}>
      <div className="w-full">
        <GistPanel 
          gist={gist} 
          isLoading={isLoadingGist}
          onRefresh={generateGist}
          sectorName={activeSector?.name}
          theme={settings.theme}
        />
        
        <CriticalArticles 
          articles={criticalArticles} 
          isLoading={isLoadingCritical}
          onRefresh={generateCritical}
          theme={settings.theme}
        />
        
        <NewsFeed 
          articles={filteredArticles}
          isLoading={isLoadingArticles}
          onSaveArticle={handleSaveArticle}
          onDateFilter={setDateFilter}
          onSearchFilter={setSearchFilter}
          dateFilter={dateFilter}
          searchFilter={searchFilter}
          sectorName={activeSector?.name}
          savedArticleIds={savedArticles.map(a => a.link)}
          theme={settings.theme}
          onRefresh={() => fetchArticles(true)}
        />
      </div>
    </main>
  );
}