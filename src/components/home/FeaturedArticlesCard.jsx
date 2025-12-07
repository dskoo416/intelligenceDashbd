import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { RefreshCw, ExternalLink } from 'lucide-react';
import { cn } from "@/lib/utils";
import { format } from 'date-fns';

export default function FeaturedArticlesCard({ theme }) {
  const [criticalArticles, setCriticalArticles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const isDark = theme === 'dark';

  const { data: sectors = [] } = useQuery({
    queryKey: ['sectors'],
    queryFn: () => base44.entities.Sector.list(),
  });

  const { data: rssSources = [] } = useQuery({
    queryKey: ['rssSources'],
    queryFn: () => base44.entities.RSSSource.list(),
  });

  const { data: settingsData = [] } = useQuery({
    queryKey: ['appSettings'],
    queryFn: () => base44.entities.AppSettings.list(),
  });

  const settings = settingsData[0] || {};

  const generateFeatured = async () => {
    setIsLoading(true);

    try {
      let allArticles = [];

      for (const sector of sectors.slice(0, 4)) {
        const sectorSources = rssSources.filter(s => s.sector_id === sector.id && s.is_active !== false);

        for (const source of sectorSources.slice(0, 5)) {
          try {
            const corsProxy = 'https://api.allorigins.win/raw?url=';
            const response = await fetch(corsProxy + encodeURIComponent(source.url));
            const text = await response.text();
            const parser = new DOMParser();
            const xml = parser.parseFromString(text, 'text/xml');
            const items = xml.querySelectorAll('item');

            items.forEach((item, idx) => {
              if (idx < 5) {
                allArticles.push({
                  title: item.querySelector('title')?.textContent || '',
                  link: item.querySelector('link')?.textContent || '',
                  description: item.querySelector('description')?.textContent?.replace(/<[^>]*>/g, '').slice(0, 200) || '',
                  pubDate: item.querySelector('pubDate')?.textContent || null,
                  source: source.name,
                  sector: sector.name
                });
              }
            });
          } catch (error) {
            console.error('Error parsing RSS:', error);
          }
        }
      }

      allArticles = allArticles.slice(0, 30);

      const instructions = settings?.default_critical_instructions || 
        'Identify the most important and impactful articles that decision-makers should read across all sectors.';

      const articleData = allArticles.map((a, i) => ({ 
        index: i, 
        title: a.title, 
        description: a.description,
        sector: a.sector
      }));

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `${instructions}\n\nArticles across all sectors:\n${JSON.stringify(articleData)}\n\nSelect the 4 most featured articles and explain why each is important.`,
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
        ...allArticles[c.index],
        reasoning: c.reasoning
      })).filter(Boolean) || [];

      setCriticalArticles(critical);
      localStorage.setItem('home_featured_articles', JSON.stringify(critical));
    } catch (error) {
      console.error('Error generating featured:', error);
    }

    setIsLoading(false);
  };

  React.useEffect(() => {
    const cached = localStorage.getItem('home_featured_articles');
    if (cached) {
      setCriticalArticles(JSON.parse(cached));
    }
  }, []);

  return (
    <div className={cn("h-full flex flex-col", isDark ? "bg-[#131313] border border-[#1F1F1F]" : "bg-white border border-gray-300")}>
      <div className={cn("flex items-center justify-between px-2 py-1 border-b", isDark ? "border-[#1F1F1F]" : "border-gray-300")}>
        <h3 className={cn("text-[10px] font-semibold uppercase tracking-wider", isDark ? "text-neutral-500" : "text-gray-700")}>FEATURED ARTICLES</h3>
        <Button
          size="sm"
          variant="ghost"
          onClick={generateFeatured}
          disabled={isLoading}
          className={cn("h-4 w-4 p-0", isDark ? "hover:bg-[#1F1F1F]" : "hover:bg-gray-100")}
        >
          <RefreshCw className={cn("w-2.5 h-2.5", isLoading && "animate-spin", isDark ? "text-neutral-600" : "text-gray-500")} />
        </Button>
      </div>

      {isLoading ? (
        <div className={cn("flex-1 flex items-center justify-center text-[10px]", isDark ? "text-neutral-700" : "text-gray-500")}>
          Analyzing featured articles...
        </div>
      ) : criticalArticles.length === 0 ? (
        <div className={cn("flex-1 flex items-center justify-center text-[10px]", isDark ? "text-neutral-700" : "text-gray-500")}>
          Click refresh to generate featured articles
        </div>
      ) : (
        <div className="flex-1 grid grid-cols-4 gap-1 overflow-y-auto p-1.5">
          {criticalArticles.map((article, idx) => (
            <a
              key={idx}
              href={article.link}
              target="_blank"
              rel="noopener noreferrer"
              className={cn("border p-1.5 transition-all", isDark ? "bg-[#0A0A0A] border-[#1F1F1F] hover:border-[#2A2A2A]" : "bg-gray-50 border-gray-300 hover:border-gray-400")}
            >
              <div className="flex items-start justify-between gap-1 mb-1">
                <h4 className={cn("text-[10px] font-medium line-clamp-2 leading-[1.2]", isDark ? "text-neutral-400" : "text-gray-900")}>
                  {article.title}
                </h4>
                <ExternalLink className={cn("w-2 h-2 flex-shrink-0 mt-0.5", isDark ? "text-neutral-700" : "text-gray-400")} />
              </div>
              <div className={cn("text-[9px] mb-0.5 border-b pb-0.5", isDark ? "border-[#1F1F1F]" : "border-gray-200")}>
                <span className={cn(isDark ? "text-neutral-700" : "text-gray-500")}>{article.source}</span>
                <span className={cn("mx-1", isDark ? "text-neutral-800" : "text-gray-400")}>•</span>
                <span className={cn(isDark ? "text-blue-500" : "text-blue-600")}>{article.sector}</span>
              </div>
              {article.pubDate && (
                <div className={cn("text-[9px] mb-0.5", isDark ? "text-neutral-800" : "text-gray-400")}>
                  {format(new Date(article.pubDate), 'MMM d, yyyy')}
                </div>
              )}
              {article.reasoning && (
                <p className={cn("text-[9px] line-clamp-2 leading-[1.2]", isDark ? "text-neutral-600" : "text-gray-600")}>
                  {article.reasoning}
                </p>
              )}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}