import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { cn } from "@/lib/utils";
import { RefreshCw } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { format } from 'date-fns';
import { withinDays } from '@/components/utils/dateFilters';

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

export default function DailyBriefing({ theme }) {
  const isDark = theme === 'dark';
  const isPastel = theme === 'pastel';
  const [briefing, setBriefing] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const { data: rssSources = [] } = useQuery({
    queryKey: ['rssSources'],
    queryFn: () => base44.entities.RSSSource.list(),
  });

  const { data: settingsData = [] } = useQuery({
    queryKey: ['appSettings'],
    queryFn: () => base44.entities.AppSettings.list(),
  });

  const settings = settingsData[0] || {};
  const daysToScan = settings?.featured_article_days || 14;

  const today = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
    const cacheKey = `daily_briefing:${today}:${daysToScan}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setBriefing(parsed);
      } catch (e) {
        localStorage.removeItem(cacheKey);
      }
    }
  }, [today, daysToScan]);

  const generateBriefing = async () => {
    setIsLoading(true);
    const nowMs = Date.now();
    const allArticles = [];

    for (const source of rssSources.filter(s => s.is_active !== false)) {
      const sourceArticles = await parseRSS(source.url);
      allArticles.push(...sourceArticles);
    }

    const recentArticles = allArticles.filter(a => withinDays(a.pubDate, daysToScan, nowMs));

    if (recentArticles.length === 0) {
      setBriefing({
        date: format(new Date(), 'MMMM d, yyyy'),
        executive: 'No recent articles available for today.',
        matters: [],
        implications: ''
      });
      setIsLoading(false);
      return;
    }

    const articleSummaries = recentArticles.slice(0, 30).map(a => `- ${a.title}: ${a.description}`).join('\n');

    const prompt = `You are a business intelligence analyst. Generate a comprehensive daily briefing for ${format(new Date(), 'MMMM d, yyyy')} based on these recent articles from the past ${daysToScan} days.

Articles:
${articleSummaries}

Generate a structured briefing with:
1. Executive Takeaway: 2-3 concise sentences summarizing the most important insights
2. What Matters Today: 4-6 bullet points explaining real business impact (not just headlines)
3. Implications: A short paragraph (3-4 sentences) covering business, supply chain, competition, or policy implications

Focus on actionable intelligence. Be specific and insightful.`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          executive_takeaway: { type: 'string' },
          what_matters_today: {
            type: 'array',
            items: { type: 'string' },
            minItems: 4,
            maxItems: 6
          },
          implications: { type: 'string' }
        }
      }
    });

    const newBriefing = {
      date: format(new Date(), 'MMMM d, yyyy'),
      executive: result.executive_takeaway || '',
      matters: result.what_matters_today || [],
      implications: result.implications || ''
    };

    setBriefing(newBriefing);
    const cacheKey = `daily_briefing:${today}:${daysToScan}`;
    localStorage.setItem(cacheKey, JSON.stringify(newBriefing));
    setIsLoading(false);
  };

  return (
    <div className={cn("w-full border", 
      isPastel ? "bg-[#3A3D5C] border-[#4A4D6C]" :
      isDark ? "bg-[#111215] border-[#262629]" : "bg-white border-gray-300")}>
      <div className={cn("px-2 py-1 border-b flex items-center justify-between", 
        isPastel ? "border-[#4A4D6C]" :
        isDark ? "border-[#262629]" : "border-gray-300")}>
        <h3 className={cn("text-[10px] font-semibold uppercase tracking-wider", 
          isPastel ? "text-[#A5A8C0]" :
          isDark ? "text-neutral-500" : "text-gray-700")}>
          DAILY BRIEFING
          {briefing && (
            <span className={cn("ml-2 font-normal", 
              isPastel ? "text-[#9B8B6B]" :
              isDark ? "text-orange-500" : "text-orange-600")}>
              {briefing.date}
            </span>
          )}
        </h3>
        <Button 
          size="sm" 
          variant="ghost" 
          onClick={generateBriefing}
          disabled={isLoading}
          className="h-4 w-4 p-0"
        >
          <RefreshCw className={cn("w-2.5 h-2.5", isLoading && "animate-spin", 
            isPastel ? "text-[#7B7E9C]" :
            isDark ? "text-neutral-600" : "text-gray-500")} />
        </Button>
      </div>
      <div className={cn("px-3 py-2", 
        isPastel ? "bg-[#32354C]" :
        isDark ? "bg-[#0f0f10]" : "bg-gray-50")}>
        {!briefing ? (
          <div className={cn("text-[10px]", 
            isPastel ? "text-[#7B7E9C]" :
            isDark ? "text-neutral-600" : "text-gray-500")}>
            Click refresh to load today's briefing
          </div>
        ) : (
          <div className="space-y-2">
            <div>
              <div className={cn("text-[9px] font-semibold uppercase tracking-wide mb-0.5", 
                isPastel ? "text-[#A5A8C0]" :
                isDark ? "text-neutral-500" : "text-gray-600")}>
                Executive Takeaway
              </div>
              <p className={cn("text-[10px] leading-[1.4]", 
                isPastel ? "text-[#D0D2E0]" :
                isDark ? "text-neutral-400" : "text-gray-700")}>
                {briefing.executive}
              </p>
            </div>
            
            {briefing.matters.length > 0 && (
              <div>
                <div className={cn("text-[9px] font-semibold uppercase tracking-wide mb-0.5", 
                  isPastel ? "text-[#A5A8C0]" :
                  isDark ? "text-neutral-500" : "text-gray-600")}>
                  What Matters Today
                </div>
                <ul className={cn("text-[10px] leading-[1.4] space-y-0.5 pl-3", 
                  isPastel ? "text-[#D0D2E0]" :
                  isDark ? "text-neutral-400" : "text-gray-700")}>
                  {briefing.matters.map((matter, idx) => (
                    <li key={idx} className="list-disc">{matter}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {briefing.implications && (
              <div>
                <div className={cn("text-[9px] font-semibold uppercase tracking-wide mb-0.5", 
                  isPastel ? "text-[#A5A8C0]" :
                  isDark ? "text-neutral-500" : "text-gray-600")}>
                  Implications
                </div>
                <p className={cn("text-[10px] leading-[1.4]", 
                  isPastel ? "text-[#D0D2E0]" :
                  isDark ? "text-neutral-400" : "text-gray-700")}>
                  {briefing.implications}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}