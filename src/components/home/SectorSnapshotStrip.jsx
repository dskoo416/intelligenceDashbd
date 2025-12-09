import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { cn } from "@/lib/utils";
import { RefreshCw } from 'lucide-react';
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

export default function SectorSnapshotStrip({ theme }) {
  const isDark = theme === 'dark';
  const isPastel = theme === 'pastel';
  const [snapshots, setSnapshots] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const { data: sectors = [] } = useQuery({
    queryKey: ['sectors'],
    queryFn: () => base44.entities.Sector.list('order'),
  });

  const { data: rssSources = [] } = useQuery({
    queryKey: ['rssSources'],
    queryFn: () => base44.entities.RSSSource.list(),
  });

  useEffect(() => {
    const cached = localStorage.getItem('sector_snapshots');
    if (cached) {
      setSnapshots(JSON.parse(cached));
    }
  }, []);

  const generateSnapshots = async () => {
    setIsLoading(true);
    const newSnapshots = [];

    for (const sector of sectors.slice(0, 4)) {
      const sectorSources = rssSources.filter(s => s.sector_id === sector.id && s.is_active !== false);
      let articles = [];

      for (const source of sectorSources.slice(0, 3)) {
        const sourceArticles = await parseRSS(source.url);
        articles.push(...sourceArticles);
      }

      if (articles.length === 0) {
        newSnapshots.push({ sector: sector.name, summary: 'No recent updates available.' });
        continue;
      }

      const articleSummaries = articles.slice(0, 10).map(a => `- ${a.title}: ${a.description}`).join('\n');

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Provide a single-sentence snapshot summary for ${sector.name} sector based on these articles:\n\n${articleSummaries}\n\nProvide only the one-sentence summary with no extra text:`,
      });

      newSnapshots.push({ sector: sector.name, summary: result });
    }

    setSnapshots(newSnapshots);
    localStorage.setItem('sector_snapshots', JSON.stringify(newSnapshots));
    setIsLoading(false);
  };

  return (
    <div className={cn("w-full border", 
      isPastel ? "bg-[#3A3D5C] border-[#4A4D6C]" :
      isDark ? "bg-[#111215] border-[#262629]" : "bg-white border-gray-300")}>
      <div className={cn("px-3 py-1 border-b flex items-center justify-between", 
        isPastel ? "border-[#4A4D6C]" :
        isDark ? "border-[#262629]" : "border-gray-300")}>
        <h3 className={cn("text-[10px] font-semibold uppercase tracking-wider", 
          isPastel ? "text-[#A5A8C0]" :
          isDark ? "text-neutral-500" : "text-gray-700")}>SECTOR SNAPSHOT</h3>
        <Button 
          size="sm" 
          variant="ghost" 
          onClick={generateSnapshots}
          disabled={isLoading}
          className="h-4 w-4 p-0"
        >
          <RefreshCw className={cn("w-2.5 h-2.5", isLoading && "animate-spin", 
            isPastel ? "text-[#7B7E9C]" :
            isDark ? "text-neutral-600" : "text-gray-500")} />
        </Button>
      </div>
      <div className="grid grid-cols-4 divide-x divide-[#262629]">
        {snapshots.length === 0 ? (
          <div className={cn("col-span-4 px-3 py-2 text-[10px]", 
            isPastel ? "text-[#7B7E9C]" :
            isDark ? "text-neutral-600" : "text-gray-500")}>
            Click refresh to load sector snapshots
          </div>
        ) : (
          snapshots.map((snap, idx) => (
            <div key={idx} className="px-3 py-2">
              <div className={cn("text-[9px] font-semibold uppercase mb-0.5", 
                isPastel ? "text-[#A5A8C0]" :
                isDark ? "text-neutral-400" : "text-gray-700")}>
                {snap.sector}
              </div>
              <div className={cn("text-[10px] leading-[1.3] truncate", 
                isPastel ? "text-[#D0D2E0]" :
                isDark ? "text-neutral-500" : "text-gray-600")}>
                {snap.summary}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}