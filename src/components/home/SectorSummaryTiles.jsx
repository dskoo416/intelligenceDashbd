import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { cn } from "@/lib/utils";
import { RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from "@/components/ui/button";

const parseRSS = async (url) => {
  try {
    const corsProxy = 'https://api.allorigins.win/raw?url=';
    const response = await fetch(corsProxy + encodeURIComponent(url));
    const text = await response.text();
    const parser = new DOMParser();
    const xml = parser.parseFromString(text, 'text/xml');
    const items = xml.querySelectorAll('item');
    const articles = [];
    
    items.forEach((item, idx) => {
      if (idx < 10) {
        articles.push({
          title: item.querySelector('title')?.textContent || '',
          description: item.querySelector('description')?.textContent?.replace(/<[^>]*>/g, '').slice(0, 200) || '',
        });
      }
    });
    
    return articles;
  } catch (error) {
    console.error('Error parsing RSS:', error);
    return [];
  }
};

export default function SectorSummaryTiles({ theme }) {
  const isDark = theme === 'dark';
  const isPastel = theme === 'pastel';
  const [summaries, setSummaries] = useState([]);
  const [loadingStates, setLoadingStates] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);

  const { data: sectors = [] } = useQuery({
    queryKey: ['sectors'],
    queryFn: () => base44.entities.Sector.list('order'),
  });

  const { data: rssSources = [] } = useQuery({
    queryKey: ['rssSources'],
    queryFn: () => base44.entities.RSSSource.list(),
  });

  useEffect(() => {
    const cached = localStorage.getItem('sector_summaries');
    if (cached) {
      setSummaries(JSON.parse(cached));
    } else if (sectors.length > 0) {
      setSummaries(sectors.map(s => ({ sectorId: s.id, sectorName: s.name, summary: '' })));
    }
  }, [sectors]);

  const generateSummary = async (sectorId) => {
    const sector = sectors.find(s => s.id === sectorId);
    if (!sector) return;

    setLoadingStates(prev => ({ ...prev, [sectorId]: true }));

    const sectorSources = rssSources.filter(s => s.sector_id === sector.id && s.is_active !== false);
    let articles = [];

    for (const source of sectorSources.slice(0, 3)) {
      const sourceArticles = await parseRSS(source.url);
      articles.push(...sourceArticles);
    }

    let summary = 'No recent updates available.';

    if (articles.length > 0) {
      const articleSummaries = articles.slice(0, 10).map(a => `- ${a.title}: ${a.description}`).join('\n');

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Provide a comprehensive 6-8 sentence snapshot summary for ${sector.name} level 1 based on these recent articles. Include key developments, trends, and important insights:\n\n${articleSummaries}\n\nProvide only the detailed summary with no extra text:`,
      });

      summary = result;
    }

    setSummaries(prev => {
      const updated = prev.map(s => 
        s.sectorId === sectorId ? { ...s, summary } : s
      );
      localStorage.setItem('sector_summaries', JSON.stringify(updated));
      return updated;
    });

    setLoadingStates(prev => ({ ...prev, [sectorId]: false }));
  };

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? summaries.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === summaries.length - 1 ? 0 : prev + 1));
  };

  const currentSummary = summaries[currentIndex];

  return (
    <div className={cn("w-full border", 
      isPastel ? "bg-[#3A3D5C] border-[#4A4D6C]" :
      isDark ? "bg-[#111215] border-[#262629]" : "bg-white border-gray-300")}>
      <div className={cn("px-2 py-1 border-b flex items-center justify-between", 
        isPastel ? "border-[#4A4D6C]" :
        isDark ? "border-[#262629]" : "border-gray-300")}>
        <div className="flex items-center gap-2">
          <h3 className={cn("text-[10px] font-semibold uppercase tracking-wider", 
            isPastel ? "text-[#A5A8C0]" :
            isDark ? "text-neutral-500" : "text-gray-700")}>LEVEL 1 SUMMARY</h3>
          {currentSummary && (
            <span className={cn("text-[9px] uppercase font-semibold",
              isPastel ? "text-[#9B8B6B]" :
              isDark ? "text-orange-500" : "text-orange-600")}>
              {currentSummary.sectorName}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handlePrevious}
            disabled={summaries.length === 0}
            className={cn("p-0.5 transition-colors", 
              isPastel ? "text-[#7B7E9C] hover:text-[#A5A8C0]" :
              isDark ? "text-neutral-600 hover:text-neutral-400" : "text-gray-500 hover:text-gray-700")}
          >
            <ChevronLeft className="w-3 h-3" />
          </button>
          <button
            onClick={handleNext}
            disabled={summaries.length === 0}
            className={cn("p-0.5 transition-colors", 
              isPastel ? "text-[#7B7E9C] hover:text-[#A5A8C0]" :
              isDark ? "text-neutral-600 hover:text-neutral-400" : "text-gray-500 hover:text-gray-700")}
          >
            <ChevronRight className="w-3 h-3" />
          </button>
          {currentSummary && (
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={() => generateSummary(currentSummary.sectorId)}
              disabled={loadingStates[currentSummary.sectorId]}
              className="h-4 w-4 p-0"
            >
              <RefreshCw className={cn("w-2.5 h-2.5", loadingStates[currentSummary.sectorId] && "animate-spin", 
                isPastel ? "text-[#7B7E9C]" :
                isDark ? "text-neutral-600" : "text-gray-500")} />
            </Button>
          )}
        </div>
      </div>
      <div className={cn("px-3 py-2", 
        isPastel ? "bg-[#32354C]" :
        isDark ? "bg-[#0f0f10]" : "bg-gray-50")}>
        {summaries.length === 0 ? (
          <div className={cn("text-[10px]", 
            isPastel ? "text-[#7B7E9C]" :
            isDark ? "text-neutral-600" : "text-gray-500")}>
            No levels configured
          </div>
        ) : currentSummary?.summary ? (
          <p className={cn("text-[10px] leading-[1.4]", 
            isPastel ? "text-[#D0D2E0]" :
            isDark ? "text-neutral-400" : "text-gray-700")}>
            {currentSummary.summary}
          </p>
        ) : (
          <div className={cn("text-[10px]", 
            isPastel ? "text-[#7B7E9C]" :
            isDark ? "text-neutral-600" : "text-gray-500")}>
            Click refresh to load summary
          </div>
        )}
      </div>
    </div>
  );
}