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
  const isPastel = theme === 'pastel';

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
    <div className={cn("h-full flex flex-col rounded", 
      isPastel ? "bg-[#3A3D5C] border border-[#4A4D6C] shadow-sm" :
      isDark ? "bg-[#131313] border border-[#1F1F1F] shadow-sm" : "bg-white border border-gray-300 shadow-sm")}>
      <div className={cn("flex items-center justify-between px-2 py-1 border-b", 
        isPastel ? "border-[#4A4D6C]" :
        isDark ? "border-[#1F1F1F]" : "border-gray-300")}>
        <h3 className={cn("text-[10px] font-semibold uppercase tracking-wider", 
          isPastel ? "text-[#A5A8C0]" :
          isDark ? "text-neutral-500" : "text-gray-700")}>SPOTLIGHT</h3>
        <Button
          size="sm"
          variant="ghost"
          onClick={generateSpotlight}
          disabled={isLoading}
          className={cn("h-4 w-4 p-0", 
            isPastel ? "hover:bg-[#4A4D6C]" :
            isDark ? "hover:bg-[#1F1F1F]" : "hover:bg-gray-100")}
        >
          <RefreshCw className={cn("w-2.5 h-2.5", isLoading && "animate-spin", 
            isPastel ? "text-[#7B7E9C]" :
            isDark ? "text-neutral-600" : "text-gray-500")} />
        </Button>
      </div>
      
      <div className="flex-1 overflow-y-auto px-2 py-1.5">
        {isLoading ? (
          <div className={cn("text-[10px]", 
            isPastel ? "text-[#7B7E9C]" :
            isDark ? "text-neutral-700" : "text-gray-500")}>
            Generating spotlight summary...
          </div>
        ) : gist ? (
          <ReactMarkdown 
            className={cn("prose prose-sm max-w-none", isPastel ? "prose-invert" : isDark ? "prose-invert" : "")}
            components={{
              p: ({node, ...props}) => <p className={cn("mb-1 text-[10px] leading-[1.3]", 
                isPastel ? "text-[#D0D2E0]" :
                isDark ? "text-neutral-500" : "text-gray-700")} {...props} />,
              ul: ({node, ...props}) => <ul className="mb-1 text-[10px] list-disc list-inside" {...props} />,
              li: ({node, ...props}) => <li className={cn("mb-0.5 text-[10px]", 
                isPastel ? "text-[#9B9EBC]" :
                isDark ? "text-neutral-600" : "text-gray-600")} {...props} />,
              strong: ({node, ...props}) => <strong className={cn("font-semibold", 
                isPastel ? "text-white" :
                isDark ? "text-neutral-400" : "text-gray-900")} {...props} />,
            }}
          >
            {gist}
          </ReactMarkdown>
        ) : (
          <div className={cn("text-[10px]", 
            isPastel ? "text-[#7B7E9C]" :
            isDark ? "text-neutral-700" : "text-gray-500")}>
            Click refresh to generate today's spotlight summary
          </div>
        )}
      </div>
    </div>
  );
}