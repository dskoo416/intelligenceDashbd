import { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

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

export function useFeedData(activeSector, activeSubsector) {
  const [articles, setArticles] = useState([]);
  const [isLoadingArticles, setIsLoadingArticles] = useState(false);
  
  const { data: sectors = [] } = useQuery({
    queryKey: ['sectors'],
    queryFn: () => base44.entities.Sector.list('order'),
  });

  const { data: rssSources = [] } = useQuery({
    queryKey: ['rssSources'],
    queryFn: () => base44.entities.RSSSource.list(),
  });

  const sectorKey = activeSector?.id || 'main';

  const fetchArticles = useCallback(async (forceRefresh = false) => {
    const key = activeSector?.id || 'main';
    const cachedStr = localStorage.getItem(`articles_${key}`);
    const cached = cachedStr ? JSON.parse(cachedStr) : null;

    if (cached?.articles?.length > 0 && !forceRefresh) {
      setArticles(cached.articles);
      setIsLoadingArticles(false);
      return cached.articles;
    }
    
    // Don't clear existing articles when refreshing
    if (!forceRefresh || articles.length === 0) {
      setIsLoadingArticles(true);
    }

    // STRICT: Only fetch sources for exact selected level
    let sectorSources;
    if (activeSector) {
      sectorSources = rssSources.filter(s => 
        s.sector_id === activeSector.id && 
        s.is_active !== false &&
        (!activeSubsector || s.subsector === activeSubsector)
      );
    } else {
      sectorSources = rssSources.filter(s => s.is_active !== false);
    }

    if (sectorSources.length === 0) {
      setArticles([]);
      setIsLoadingArticles(false);
      return [];
    }

    const newArticles = [];

    for (const source of sectorSources) {
      const sourceArticles = await parseRSS(source.url);
      const sector = sectors.find(s => s.id === source.sector_id);
      newArticles.push(...sourceArticles.map(a => ({ 
        ...a, 
        source: source.name,
        sector: sector?.name || '',
        sectorId: source.sector_id,
        subsector: source.subsector || '',
        subsubsector: source.subsubsector || ''
      })));
    }
    
    // When refreshing, keep existing articles and prepend new ones
    const existingArticles = forceRefresh && articles.length > 0 ? articles : (cached?.articles || []);
    const existingLinks = new Set(existingArticles.map(a => a.link));
    const uniqueNew = newArticles.filter(a => !existingLinks.has(a.link));
    
    // Prepend new articles to existing ones
    const combined = [...uniqueNew, ...existingArticles];
    
    combined.sort((a, b) => {
      if (!a.pubDate || !b.pubDate) return 0;
      return new Date(b.pubDate) - new Date(a.pubDate);
    });
    
    setArticles(combined);
    localStorage.setItem(`articles_${key}`, JSON.stringify({ articles: combined }));
    setIsLoadingArticles(false);
    return combined;
  }, [activeSector, activeSubsector, rssSources, sectors]);

  const clearArticlesForLevel = useCallback((levelKey) => {
    localStorage.removeItem(`articles_${levelKey}`);
    if (levelKey === sectorKey) {
      setArticles([]);
    }
  }, [sectorKey]);

  useEffect(() => {
    // Clear cache when sector changes
    setArticles([]);
    fetchArticles(false);
  }, [activeSector?.id, activeSubsector, fetchArticles]);

  return {
    articles,
    isLoadingArticles,
    fetchArticles,
    sectorKey,
    clearArticlesForLevel
  };
}