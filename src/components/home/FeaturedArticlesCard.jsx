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
    <div className={cn("h-full flex flex-col border", isDark ? "bg-[#111215] border-[#262629]" : "bg-white border-gray-300")}>
      <div className={cn("flex items-center justify-between px-3 py-2 border-b", isDark ? "border-[#262629]" : "border-gray-300")}>
        <h3 className={cn("text-[11px] font-semibold uppercase tracking-wider", isDark ? "text-neutral-500" : "text-gray-700")}>FEATURED</h3>
        <Button
          size="sm"
          variant="ghost"
          onClick={generateFeatured}
          disabled={isLoading}
          className="h-4 w-4 p-0"
        >
          <RefreshCw className={cn("w-2.5 h-2.5", isLoading && "animate-spin", isDark ? "text-neutral-600" : "text-gray-500")} />
        </Button>
      </div>

      <div className={cn("flex-1 overflow-y-auto px-3 py-2", isDark ? "bg-[#0f0f10]" : "bg-gray-50")}>
        {criticalArticles.length === 0 && !isLoading ? (
          <div className={cn("text-[10px]", isDark ? "text-neutral-600" : "text-gray-500")}>
            Click refresh to generate featured articles
          </div>
        ) : (
          <div 
            className="grid gap-x-6 gap-y-1"
            style={{
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gridAutoFlow: 'column'
            }}
          >
            {criticalArticles.map((article, idx) => (
              <div key={idx} className={cn("pb-1 border-b", isDark ? "border-[#262629]" : "border-gray-300")}>
                <a
                  href={article.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "block text-[11px] leading-[1.4] transition-colors",
                    isDark 
                      ? "text-orange-500 hover:text-orange-400" 
                      : "text-orange-600 hover:text-orange-700"
                  )}
                  style={{ fontFamily: 'ui-monospace, monospace' }}
                >
                  <span className={cn("mr-1.5", isDark ? "text-neutral-600" : "text-gray-500")}>{idx + 1})</span>
                  {article.title}
                </a>
                <div className={cn("text-[9px] mt-0.5", isDark ? "text-neutral-700" : "text-gray-500")}>
                  {article.source} • {article.sector} • {article.pubDate && format(new Date(article.pubDate), 'MMM d')}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}