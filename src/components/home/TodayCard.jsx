import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

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

export default function TodayCard({ theme }) {
  const isDark = theme === 'dark';
  const [todayIndex, setTodayIndex] = useState(0);
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { data: sectors = [] } = useQuery({
    queryKey: ['sectors'],
    queryFn: () => base44.entities.Sector.list('order'),
  });

  const { data: rssSources = [] } = useQuery({
    queryKey: ['rssSources'],
    queryFn: () => base44.entities.RSSSource.list(),
  });

  const { data: cacheData = [] } = useQuery({
    queryKey: ['sectorCache'],
    queryFn: () => base44.entities.SectorCache.list(),
  });

  useEffect(() => {
    const cachedGist = localStorage.getItem('gist_main');
    if (cachedGist) {
      setContent(cachedGist);
    }
  }, []);

  useEffect(() => {
    if (todayIndex === 0) {
      const cachedGist = localStorage.getItem('gist_main');
      if (cachedGist) {
        setContent(cachedGist);
      }
    } else if (sectors.length > 0 && todayIndex > 0) {
      loadGist();
    }
  }, [sectorIndex, todayIndex, sectors]);

  const generateToday = async () => {
    const cachedStr = localStorage.getItem('today_summary_all');
    if (cachedStr) {
      const summaries = JSON.parse(cachedStr);
      if (summaries[todayIndex]) {
        setContent(summaries[todayIndex]);
        return;
      }
    }

    setIsLoading(true);
    const today = new Date();
    const todayStr = today.toDateString();
    
    const targetSector = todayIndex === 0 ? null : sectors[todayIndex - 1];
    const allArticles = [];

    if (targetSector) {
      const sectorSources = rssSources.filter(s => s.sector_id === targetSector.id && s.is_active !== false);
      
      for (const source of sectorSources.slice(0, 3)) {
        const articles = await parseRSS(source.url);
        const todayArticles = articles.filter(a => {
          if (!a.pubDate) return false;
          return new Date(a.pubDate).toDateString() === todayStr;
        });
        allArticles.push(...todayArticles.map(a => ({ ...a, sector: targetSector.name })));
      }
    } else {
      for (const sector of sectors.slice(0, 4)) {
        const sectorSources = rssSources.filter(s => s.sector_id === sector.id && s.is_active !== false);
        
        for (const source of sectorSources.slice(0, 3)) {
          const articles = await parseRSS(source.url);
          const todayArticles = articles.filter(a => {
            if (!a.pubDate) return false;
            return new Date(a.pubDate).toDateString() === todayStr;
          });
          allArticles.push(...todayArticles.map(a => ({ ...a, sector: sector.name })));
        }
      }
    }

    if (allArticles.length === 0) {
      setContent('No articles published today yet. Check back later for updates.');
      setIsLoading(false);
      return;
    }

    const articleSummaries = allArticles.slice(0, 20).map(a => 
      `- [${a.sector}] ${a.title}: ${a.description}`
    ).join('\n');

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Provide a concise daily intelligence summary for ${targetSector ? targetSector.name : 'all sectors'}. Focus on key themes and developments.\n\nArticles from today:\n${articleSummaries}\n\nProvide a 2-3 paragraph executive summary:`,
    });

    setContent(result);
    
    const cachedAll = cachedStr ? JSON.parse(cachedStr) : [];
    cachedAll[todayIndex] = result;
    localStorage.setItem('today_summary_all', JSON.stringify(cachedAll));
    setIsLoading(false);
  };

  const loadGist = async () => {
    if (sectors.length === 0 || todayIndex === 0) return;
    
    const sector = sectors[todayIndex - 1];
    const cache = cacheData.find(c => c.sector_id === sector.id && !c.subsector_name);
    
    if (cache?.gist) {
      setContent(cache.gist);
    } else {
      setContent('Select a sector and add RSS sources to generate a summary.');
    }
  };

  const handlePrev = () => {
    if (todayIndex === 0) {
      setTodayIndex(sectors.length);
    } else {
      setTodayIndex((prev) => prev - 1);
    }
  };

  const handleNext = () => {
    if (todayIndex === sectors.length) {
      setTodayIndex(0);
    } else {
      setTodayIndex((prev) => prev + 1);
    }
  };



  const handleRefresh = () => {
    if (todayIndex === 0) {
      generateToday();
    } else {
      loadGist();
    }
  };

  return (
    <div className={cn("h-full flex flex-col border", isDark ? "bg-[#111215] border-[#262629]" : "bg-white border-gray-300")}>
      <div className={cn("px-3 py-2 border-b flex items-center justify-between", isDark ? "border-[#262629]" : "border-gray-300")}>
        <h3 className={cn("text-[11px] font-semibold uppercase tracking-wider", isDark ? "text-neutral-500" : "text-gray-700")}>
          {view === 'today' ? 'SUMMARY - MAIN' : `SUMMARY: ${sectors[sectorIndex]?.name || ''}`}
        </h3>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <button
              onClick={handlePrev}
              className={cn("p-0.5 transition-colors", isDark ? "text-neutral-600 hover:text-neutral-400" : "text-gray-500 hover:text-gray-700")}
            >
              <ChevronLeft className="w-3 h-3" />
            </button>
            <button
              onClick={handleNext}
              className={cn("p-0.5 transition-colors", isDark ? "text-neutral-600 hover:text-neutral-400" : "text-gray-500 hover:text-gray-700")}
            >
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className={cn("text-[9px] uppercase px-2 py-0.5 border transition-colors", isDark ? "border-[#262629] text-neutral-500 hover:text-neutral-300 hover:border-neutral-600" : "border-gray-300 text-gray-600 hover:text-gray-900 hover:border-gray-400")}
          >
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>
      
      <div className={cn("flex-1 overflow-y-auto p-3", isDark ? "bg-[#0f0f10]" : "bg-gray-50")}>
        {content ? (
          <ReactMarkdown
            className={cn("text-[12px] leading-[1.4] space-y-2", isDark ? "text-neutral-400" : "text-gray-700")}
            components={{
              p: ({node, ...props}) => <p className="mb-2" {...props} />,
              strong: ({node, ...props}) => <strong className={cn("font-semibold", isDark ? "text-neutral-300" : "text-gray-900")} {...props} />,
              ul: ({node, ...props}) => <ul className="list-disc list-inside space-y-1" {...props} />,
              li: ({node, ...props}) => <li className={cn(isDark ? "text-neutral-400" : "text-gray-700")} {...props} />
            }}
          >
            {content}
          </ReactMarkdown>
        ) : (
          <div className={cn("text-[11px]", isDark ? "text-neutral-600" : "text-gray-500")}>
            {isLoading ? 'Generating summary...' : 'No content available.'}
          </div>
        )}
      </div>
    </div>
  );
}