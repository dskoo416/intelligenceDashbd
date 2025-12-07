import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { RefreshCw } from 'lucide-react';
import { cn } from "@/lib/utils";
import ReactMarkdown from 'react-markdown';

export default function SpotlightCard({ theme }) {
  const [gist, setGist] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const isDark = theme === 'dark';

  React.useEffect(() => {
    const cached = localStorage.getItem('home_spotlight');
    if (cached) {
      setGist(cached);
    }
  }, []);

  const generateSpotlight = async () => {
    setIsLoading(true);
    
    try {
      const sectors = await base44.entities.Sector.list();
      const rssSources = await base44.entities.RSSSource.list();
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      let allArticles = [];
      
      for (const sector of sectors) {
        const sectorSources = rssSources.filter(s => s.sector_id === sector.id && s.is_active !== false);
        
        for (const source of sectorSources) {
          try {
            const corsProxy = 'https://api.allorigins.win/raw?url=';
            const response = await fetch(corsProxy + encodeURIComponent(source.url));
            const text = await response.text();
            const parser = new DOMParser();
            const xml = parser.parseFromString(text, 'text/xml');
            const items = xml.querySelectorAll('item');
            
            items.forEach((item) => {
              const pubDate = item.querySelector('pubDate')?.textContent;
              if (pubDate) {
                const articleDate = new Date(pubDate);
                if (articleDate >= today) {
                  allArticles.push({
                    title: item.querySelector('title')?.textContent || '',
                    description: item.querySelector('description')?.textContent?.replace(/<[^>]*>/g, '').slice(0, 200) || '',
                    sector: sector.name
                  });
                }
              }
            });
          } catch (error) {
            console.error('Error parsing RSS:', error);
          }
        }
      }
      
      if (allArticles.length === 0) {
        setGist('No articles found for today.');
        setIsLoading(false);
        return;
      }
      
      const articleSummaries = allArticles.slice(0, 20).map(a => `- [${a.sector}] ${a.title}: ${a.description}`).join('\n');
      
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Provide a concise executive summary of today's key themes and developments across all sectors from these articles. Focus on actionable insights and cross-sector trends.\n\nArticles:\n${articleSummaries}\n\nProvide a 2-3 paragraph intelligence summary:`,
      });
      
      setGist(result);
      localStorage.setItem('home_spotlight', result);
    } catch (error) {
      console.error('Error generating spotlight:', error);
      setGist('Error generating spotlight summary.');
    }
    
    setIsLoading(false);
  };

  return (
    <div className={cn("rounded-lg border p-4 h-full flex flex-col", isDark ? "bg-neutral-900 border-neutral-800" : "bg-white border-gray-200")}>
      <div className="flex items-center justify-between mb-3">
        <h3 className={cn("font-semibold text-sm", isDark ? "text-white" : "text-gray-900")}>Spotlight</h3>
        <Button
          size="sm"
          variant="ghost"
          onClick={generateSpotlight}
          disabled={isLoading}
          className={cn("h-7 w-7 p-0", isDark ? "hover:bg-neutral-800" : "hover:bg-gray-100")}
        >
          <RefreshCw className={cn("w-3.5 h-3.5", isLoading && "animate-spin", isDark ? "text-neutral-400" : "text-gray-600")} />
        </Button>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className={cn("text-xs", isDark ? "text-neutral-500" : "text-gray-500")}>
            Generating spotlight summary...
          </div>
        ) : gist ? (
          <ReactMarkdown className={cn("text-xs leading-relaxed prose prose-sm max-w-none", isDark ? "prose-invert text-neutral-300" : "text-gray-700")}>
            {gist}
          </ReactMarkdown>
        ) : (
          <div className={cn("text-xs", isDark ? "text-neutral-500" : "text-gray-500")}>
            Click refresh to generate today's spotlight summary
          </div>
        )}
      </div>
    </div>
  );
}