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

  // Get all descendant sectors recursively
  const getDescendantSectors = useCallback((sectorId) => {
    const children = sectors.filter(s => s.parent_id === sectorId);
    const descendants = [sectorId];
    children.forEach(child => {
      descendants.push(...getDescendantSectors(child.id));
    });
    return descendants;
  }, [sectors]);

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

    // HIERARCHICAL AGGREGATION: Roll-up only, no spillover
    let sectorSources;
    if (activeSector) {
      // Get all descendant sectors for roll-up aggregation
      const descendantIds = getDescendantSectors(activeSector.id);
      sectorSources = rssSources.filter(s => 
        descendantIds.includes(s.sector_id) && 
        s.is_active !== false &&
        (!activeSubsector || s.subsector === activeSubsector)
      );
    } else {
      // Main shows everything
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
        subsubsector: source.subsubsector || '',
        originLevel: sector?.name || '',
        originLevelId: source.sector_id,
        displayLevel: activeSector?.name || 'Main'
      })));
    }
    
    // When refreshing, keep existing articles and prepend new ones
    const existingArticles = forceRefresh && articles.length > 0 ? articles : (cached?.articles || []);
    const existingLinks = new Set(existingArticles.map(a => a.link));
    const uniqueNew = newArticles.filter(a => !existingLinks.has(a.link));
    
    // Deduplicate by URL across all sources
    const combined = [...uniqueNew, ...existingArticles];
    const deduped = Array.from(new Map(combined.map(a => [a.link, a])).values());
    
    deduped.sort((a, b) => {
      if (!a.pubDate || !b.pubDate) return 0;
      return new Date(b.pubDate) - new Date(a.pubDate);
    });
    
    // Limit to 500 most recent articles to prevent quota issues
    const limited = deduped.slice(0, 500);
    
    setArticles(limited);
    
    // Try to save to localStorage with error handling
    try {
      localStorage.setItem(`articles_${key}`, JSON.stringify({ articles: limited }));
    } catch (e) {
      if (e.name === 'QuotaExceededError') {
        // Clear old caches and try again with fewer articles
        const allKeys = Object.keys(localStorage);
        allKeys.forEach(k => {
          if (k.startsWith('articles_') && k !== `articles_${key}`) {
            localStorage.removeItem(k);
          }
        });
        try {
          // Try with only 300 articles
          localStorage.setItem(`articles_${key}`, JSON.stringify({ articles: limited.slice(0, 300) }));
        } catch (e2) {
          console.warn('Unable to cache articles:', e2);
        }
      }
    }
    
    setIsLoadingArticles(false);
    return limited;
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

  // Get allowed level IDs for filtering (selected + descendants only)
  const getAllowedLevelIds = useCallback(() => {
    if (!activeSector) {
      // Main view: all levels allowed
      return null;
    }
    // Selected level + all descendants
    return getDescendantSectors(activeSector.id);
  }, [activeSector, getDescendantSectors]);

  return {
    articles,
    isLoadingArticles,
    fetchArticles,
    sectorKey,
    clearArticlesForLevel,
    allowedLevelIds: getAllowedLevelIds()
  };
}