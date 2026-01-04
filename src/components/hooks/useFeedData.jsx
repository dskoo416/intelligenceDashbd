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

  // Use unique levelId for cache keys
  const levelId = activeSector?.id || 'main';

  // Fetch Base44 cached news
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

  // Build allowed originLevelIds: selected + all descendants
  const buildAllowedLevelIds = useCallback((sectorId) => {
    if (!sectorId || sectorId === 'main') {
      // Main view: all levels allowed
      return null;
    }
    const children = sectors.filter(s => s.parent_id === sectorId);
    const allowed = new Set([sectorId]);
    const addDescendants = (id) => {
      const childSectors = sectors.filter(s => s.parent_id === id);
      childSectors.forEach(child => {
        allowed.add(child.id);
        addDescendants(child.id);
      });
    };
    addDescendants(sectorId);
    return allowed;
  }, [sectors]);

  // Get all descendant sectors recursively (for fetching sources)
  const getDescendantSectors = useCallback((sectorId) => {
    const children = sectors.filter(s => s.parent_id === sectorId);
    const descendants = [sectorId];
    children.forEach(child => {
      descendants.push(...getDescendantSectors(child.id));
    });
    return descendants;
  }, [sectors]);

  const fetchArticles = useCallback(async (forceRefresh = false) => {
    // Generate RSS config hash for cache invalidation
    const rssConfigHash = rssSources.map(s => s.id).sort().join(',');
    
    // Load from Base44 cache first (works in incognito)
    if (!forceRefresh && savedCache?.news_articles?.length > 0) {
      const TTL = 30 * 60 * 1000;
      const age = Date.now() - (savedCache.news_updated_at || 0);
      const hashMatch = savedCache.news_rss_hash === rssConfigHash;
      
      if (age < TTL && hashMatch) {
        setArticles(savedCache.news_articles);
        setIsLoadingArticles(false);
        return savedCache.news_articles;
      }
    }
    
    // Also try localStorage as fast cache
    const cacheKey = `news_${levelId}`;
    const cachedStr = localStorage.getItem(cacheKey);
    const cached = cachedStr ? JSON.parse(cachedStr) : null;
    
    if (cached?.levelId === levelId && cached?.articles?.length > 0 && !forceRefresh) {
      const TTL = 30 * 60 * 1000;
      const age = Date.now() - (cached.updatedAt || 0);
      if (age < TTL) {
        setArticles(cached.articles);
        setIsLoadingArticles(false);
        return cached.articles;
      }
    }
    
    setIsLoadingArticles(true);

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
        originLevelId: source.sector_id,
        originLevelLabel: sector?.name || '',
        displayLevelId: levelId,
        displayLevelLabel: activeSector?.name || 'Main'
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

    // Save to localStorage as fast cache
    const cachePayload = {
      levelId: levelId,
      updatedAt: Date.now(),
      articles: limited
    };

    try {
      localStorage.setItem(cacheKey, JSON.stringify(cachePayload));
    } catch (e) {
      if (e.name === 'QuotaExceededError') {
        const allKeys = Object.keys(localStorage);
        allKeys.forEach(k => {
          if (k.startsWith('news_') && k !== cacheKey) {
            localStorage.removeItem(k);
          }
        });
        try {
          cachePayload.articles = limited.slice(0, 300);
          localStorage.setItem(cacheKey, JSON.stringify(cachePayload));
        } catch (e2) {
          console.warn('Unable to cache articles:', e2);
        }
      }
    }

    // Save to Base44 for persistence across browsers/incognito
    const rssConfigHash = rssSources.map(s => s.id).sort().join(',');
    if (activeSector) {
      const subsectorName = activeSubsector?.name || '';
      if (savedCache?.id) {
        await base44.entities.SectorCache.update(savedCache.id, { 
          news_articles: limited,
          news_updated_at: Date.now(),
          news_rss_hash: rssConfigHash
        });
      } else {
        await base44.entities.SectorCache.create({
          sector_id: activeSector.id,
          subsector_name: subsectorName,
          gist: '',
          critical_articles: [],
          news_articles: limited,
          news_updated_at: Date.now(),
          news_rss_hash: rssConfigHash
        });
      }
    }

    setIsLoadingArticles(false);
    return limited;
    }, [activeSector, activeSubsector, rssSources, sectors, levelId, savedCache]);

  const clearArticlesForLevel = useCallback((levelKey) => {
    // Clear all cache types for this level
    localStorage.removeItem(`news_${levelKey}`);
    localStorage.removeItem(`featured_${levelKey}`);
    localStorage.removeItem(`summary_${levelKey}`);
    if (levelKey === levelId) {
      setArticles([]);
    }
  }, [levelId]);

  useEffect(() => {
    // Load cached articles immediately from Base44 if available
    if (savedCache?.news_articles?.length > 0) {
      setArticles(savedCache.news_articles);
    } else {
      setArticles([]);
    }
    // Then fetch fresh data in background
    fetchArticles(false);
  }, [activeSector?.id, activeSubsector, fetchArticles, savedCache]);

  // Get allowed level IDs for strict filtering
  const allowedLevelIds = buildAllowedLevelIds(activeSector?.id);

  return {
    articles,
    isLoadingArticles,
    fetchArticles,
    levelId,
    clearArticlesForLevel,
    allowedLevelIds
  };
}