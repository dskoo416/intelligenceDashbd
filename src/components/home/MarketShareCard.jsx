import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { cn } from "@/lib/utils";
import { RefreshCw } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";

const CATEGORIES = [
  { id: 'ev_oems', label: 'EV OEMs', cacheKey: 'market_share_ev_oems' },
  { id: 'batteries', label: 'Battery Makers', cacheKey: 'market_share_batteries' },
  { id: 'petrochem', label: 'Petrochemicals', cacheKey: 'market_share_petrochem' }
];

export default function MarketShareCard({ theme }) {
  const isDark = theme === 'dark';
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0]);
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showSources, setShowSources] = useState(false);

  useEffect(() => {
    const cached = localStorage.getItem(activeCategory.cacheKey);
    if (cached) {
      setData(JSON.parse(cached));
    } else {
      setData(null);
    }
  }, [activeCategory]);

  const fetchData = async () => {
    setIsLoading(true);

    try {
      let prompt = '';
      if (activeCategory.id === 'ev_oems') {
        prompt = `Search for the most recent global EV OEM market share data from reputable sources like IEA Global EV Outlook, CleanTechnica, Counterpoint, or major news outlets.

Return the top 8-10 EV manufacturers with their market share percentages. Use real data from cited sources only.`;
      } else if (activeCategory.id === 'batteries') {
        prompt = `Search for the most recent battery manufacturer market share data from sources like SNE Research, CleanTechnica, Reuters, or Korea Times.

Return the top 8-10 battery manufacturers (CATL, BYD, LGES, Panasonic, SK On, Samsung SDI, etc.) with their market share percentages. Use real data from cited sources only.`;
      } else if (activeCategory.id === 'petrochem') {
        prompt = `Search for the most recent petrochemical producer market share data from sources like Reuters, ICIS, PlasticsToday, or Statista.

Return the top 8-10 petrochemical producers with their market share percentages for PE/PP or overall petrochemicals. Use real data from cited sources only.`;
      }

      prompt += `\n\nCritical constraints:
- Numbers must come from cited articles/tables; do not invent percentages.
- If exact percentages unavailable, approximate to nearest integer but keep ranking correct.
- Prefer recent data (last available quarter or year).
- If no credible free source exists, return empty list.

Return JSON only.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: 'object',
          properties: {
            companies: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  share: { type: 'number' }
                }
              }
            },
            source: { type: 'string' },
            period: { type: 'string' }
          }
        }
      });

      if (result.companies && result.companies.length > 0) {
        result.companies.sort((a, b) => b.share - a.share);
        
        // Validate data - check if it's percentage data (should add up to ~100)
        const total = result.companies.reduce((sum, c) => sum + c.share, 0);
        const isPercentage = total > 50 && total <= 120;
        
        result.isPercentage = isPercentage;
        setData(result);
        localStorage.setItem(activeCategory.cacheKey, JSON.stringify(result));
      }
    } catch (error) {
      console.error('Error fetching market share:', error);
    }

    setIsLoading(false);
  };

  const maxShare = data?.companies ? Math.max(...data.companies.map(c => c.share)) : 100;

  return (
    <>
      <div className={cn("h-full flex flex-col border", isDark ? "bg-[#111215] border-[#262629]" : "bg-white border-gray-300")}>
        <div className={cn("px-3 py-2 border-b flex items-center justify-between", isDark ? "border-[#262629]" : "border-gray-300")}>
          <h3 className={cn("text-[11px] font-semibold uppercase tracking-wider", isDark ? "text-neutral-500" : "text-gray-700")}>
            MARKET SHARE
          </h3>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "text-[9px] uppercase px-2 py-0.5 border transition-colors",
                  activeCategory.id === cat.id
                    ? (isDark ? "border-neutral-500 text-neutral-300" : "border-gray-500 text-gray-700")
                    : (isDark ? "border-[#262629] text-neutral-600 hover:text-neutral-400" : "border-gray-300 text-gray-600 hover:text-gray-900")
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className={cn("flex-1 overflow-y-auto p-3", isDark ? "bg-[#0f0f10]" : "bg-gray-50")}>
        {!data && !isLoading ? (
          <div className={cn("text-[10px]", isDark ? "text-neutral-600" : "text-gray-500")}>
            Click refresh to load market share data
          </div>
        ) : data?.companies ? (
          <div className="space-y-2">
            {data.companies.map((company, idx) => (
              <div key={idx}>
                <div className="flex items-center justify-between mb-1">
                  <span className={cn("text-[10px]", isDark ? "text-neutral-400" : "text-gray-700")}>
                    {company.name}
                  </span>
                  <span className={cn("text-[10px] font-mono font-semibold", isDark ? "text-neutral-400" : "text-gray-700")}>
                    {data.isPercentage ? `${company.share}%` : company.share}
                  </span>
                </div>
                <div className={cn("h-1.5 w-full", isDark ? "bg-[#1A1A1A]" : "bg-gray-200")}>
                  <div 
                    className={cn("h-full transition-all", isDark ? "bg-neutral-600" : "bg-gray-500")}
                    style={{ width: `${(company.share / maxShare) * 100}%` }}
                  />
                </div>
              </div>
            ))}
            {data.source && (
              <div className={cn("text-[9px] mt-3 pt-2 border-t", isDark ? "text-neutral-700 border-[#262629]" : "text-gray-500 border-gray-300")} style={{ fontFamily: 'ui-monospace, monospace' }}>
                <button onClick={() => setShowSources(true)} className="hover:underline">(sources)</button>
              </div>
            )}
            {data.period && (
              <div className={cn("text-[9px] mt-1", isDark ? "text-neutral-700" : "text-gray-500")} style={{ fontFamily: 'ui-monospace, monospace' }}>
                {data.period}
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>

    <Dialog open={showSources} onOpenChange={setShowSources}>
      <DialogContent className={cn("max-w-xl border", isDark ? "bg-[#111215] border-[#262629]" : "bg-white border-gray-300")}>
        <div className={cn("px-3 py-2 border-b", isDark ? "border-[#262629]" : "border-gray-300")}>
          <h3 className={cn("text-[11px] font-semibold uppercase tracking-wider", isDark ? "text-neutral-500" : "text-gray-700")}>
            Data Sources
          </h3>
        </div>
        <div className={cn("px-3 py-3 text-[11px]", isDark ? "text-neutral-400" : "text-gray-700")}>
          {data?.source || 'No source information available'}
        </div>
      </DialogContent>
    </Dialog>
  </>
  );
}