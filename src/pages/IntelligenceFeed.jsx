import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import GistPanel from '@/components/feed/GistPanel';
import CriticalArticles from '@/components/feed/CriticalArticles';
import NewsFeed from '@/components/feed/NewsFeed';
import { toast } from 'sonner';
import { cn } from "@/lib/utils";
import { useFeedData } from '@/components/hooks/useFeedData';

export default function IntelligenceFeed({ activeSector, activeSubsector }) {
  const queryClient = useQueryClient();
  const [dateFilter, setDateFilter] = useState(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [gist, setGist] = useState('');
  const [criticalArticles, setCriticalArticles] = useState([]);
  const [isLoadingGist, setIsLoadingGist] = useState(false);
  const [isLoadingCritical, setIsLoadingCritical] = useState(false);

  const { articles, isLoadingArticles, fetchArticles, levelId, allowedLevelIds } = useFeedData(activeSector, activeSubsector);

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

  const { data: cacheData = [] } = useQuery({
    queryKey: ['sectorCache', levelId],
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

  useEffect(() => {
    if (savedCache) {
      setGist(savedCache.gist || '');
      setCriticalArticles(savedCache.critical_articles || []);
    } else {
      setGist('');
      setCriticalArticles([]);
    }
  }, [savedCache]);

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



  const generateGist = async () => {
    if (!activeSector) return;
    
    // Use filteredArticles which includes descendants and enforces isolation
    if (filteredArticles.length === 0) return;
    
    setIsLoadingGist(true);
    
    const instructions = activeSector?.ai_gist_instructions || settings?.default_gist_instructions || 
      'Provide a concise executive summary of the key themes and developments from these articles. Focus on actionable insights.';
    
    const articleSummaries = filteredArticles.slice(0, 15).map(a => `- ${a.title}: ${a.description}`).join('\n');
    
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `${instructions}\n\nArticles:\n${articleSummaries}\n\nProvide a comprehensive 6-8 sentence summary:`,
    });
    
    setGist(result);
    
    // Use level-safe cache key with levelId validation
    const cachePayload = {
      levelId: levelId,
      updatedAt: Date.now(),
      summary: result
    };
    localStorage.setItem(`summary_${levelId}`, JSON.stringify(cachePayload));
    
    if (activeSector) {
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
      queryClient.invalidateQueries({ queryKey: ['sectorCache', levelId] });
    }
    
    setIsLoadingGist(false);
  };

  const generateCritical = async () => {
    if (!activeSector) return;
    
    // Use filteredArticles which includes descendants and enforces isolation
    if (filteredArticles.length === 0) return;
    
    setIsLoadingCritical(true);
    
    const instructions = activeSector?.ai_critical_instructions || settings?.default_critical_instructions || 
      'Identify the most important and impactful articles that decision-makers should read.';
    
    const keywords = activeSector?.keywords?.join(', ') || '';
    
    const articleData = filteredArticles.slice(0, 20).map((a, i) => ({ 
      index: i, 
      title: a.title, 
      description: a.description 
    }));
    
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `${instructions}\n\n${keywords ? `Priority keywords: ${keywords}\n\n` : ''}Articles:\n${JSON.stringify(articleData)}\n\nSelect exactly 12 most featured articles and explain why each is important.`,
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
            },
            minItems: 12,
            maxItems: 12
          }
        }
      }
    });
    
    const critical = result.critical_articles?.map(c => ({
      ...filteredArticles[c.index],
      reasoning: c.reasoning
    })).filter(Boolean) || [];

    setCriticalArticles(critical);
    
    // Use level-safe cache key with levelId validation
    const cachePayload = {
      levelId: levelId,
      updatedAt: Date.now(),
      articles: critical
    };
    localStorage.setItem(`featured_${levelId}`, JSON.stringify(cachePayload));
    
    if (activeSector) {
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
      queryClient.invalidateQueries({ queryKey: ['sectorCache', levelId] });
    }
    
    setIsLoadingCritical(false);
  };



  const handleSaveArticle = (article) => {
    saveArticleMutation.mutate(article);
  };

  // STRICT LEVEL FILTERING: Block siblings and parents (roll-up only: selected + descendants)
  const filteredArticles = articles.filter(a => {
    // Level filter: enforce allowed origin levels (selected + descendants only)
    if (allowedLevelIds !== null && a.originLevelId) {
      if (!allowedLevelIds.has(a.originLevelId)) {
        return false; // Block siblings, parents, and unrelated levels
      }
    }
    
    // Date filter
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
    
    // Search filter
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
      settings.theme === 'pastel' ? "bg-[#2B2D42]" :
      settings.theme === 'dark' ? "bg-neutral-950" : "bg-gray-50"
    )}>
      <div className="w-full">
        <GistPanel 
          gist={gist} 
          isLoading={isLoadingGist}
          onRefresh={generateGist}
          sectorName={activeSector?.name}
          theme={settings.theme}
          isAggregated={activeSector && allowedLevelIds && allowedLevelIds.length > 1}
          descendantCount={allowedLevelIds ? allowedLevelIds.length - 1 : 0}
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
          sectorName={activeSubsector?.name || activeSector?.name}
          savedArticleIds={savedArticles.map(a => a.link)}
          theme={settings.theme}
          onRefresh={() => fetchArticles(true)}
          sectorKeywords={activeSector?.keywords || []}
        />
      </div>
    </main>
  );
}