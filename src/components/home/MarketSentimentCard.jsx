import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const POSITIVE_KEYWORDS = ['breakthrough', 'success', 'growth', 'innovation', 'advance', 'achieve', 'gain', 'increase', 'profit', 'record', 'boost', 'win', 'launch', 'expand', 'positive', 'strong', 'high', 'up', 'rise', 'surge'];
const NEGATIVE_KEYWORDS = ['decline', 'fall', 'loss', 'drop', 'crisis', 'concern', 'risk', 'warning', 'weak', 'fail', 'cut', 'slash', 'down', 'struggle', 'challenge', 'problem', 'delay', 'issue', 'negative', 'low'];

export default function MarketSentimentCard({ theme }) {
  const [selectedSector, setSelectedSector] = useState(null);
  const [sentimentData, setSentimentData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const isDark = theme === 'dark';

  const { data: sectors = [] } = useQuery({
    queryKey: ['sectors'],
    queryFn: () => base44.entities.Sector.list('order'),
  });

  const { data: rssSources = [] } = useQuery({
    queryKey: ['rssSources'],
    queryFn: () => base44.entities.RSSSource.list(),
  });

  React.useEffect(() => {
    if (sectors.length > 0 && !selectedSector) {
      setSelectedSector(sectors[0]);
    }
  }, [sectors]);

  React.useEffect(() => {
    if (!selectedSector) return;

    const analyzeSentiment = async () => {
      setIsLoading(true);
      const sectorSources = rssSources.filter(s => s.sector_id === selectedSector.id && s.is_active !== false);
      let articles = [];

      for (const source of sectorSources.slice(0, 10)) {
        try {
          const corsProxy = 'https://api.allorigins.win/raw?url=';
          const response = await fetch(corsProxy + encodeURIComponent(source.url));
          const text = await response.text();
          const parser = new DOMParser();
          const xml = parser.parseFromString(text, 'text/xml');
          const items = xml.querySelectorAll('item');

          items.forEach((item, idx) => {
            if (idx < 5) {
              articles.push({
                title: item.querySelector('title')?.textContent || '',
                description: item.querySelector('description')?.textContent?.replace(/<[^>]*>/g, '') || '',
              });
            }
          });
        } catch (error) {
          console.error('Error parsing RSS:', error);
        }
      }

      articles = articles.slice(0, 50);

      let score = 0;
      const positiveCount = {};
      const negativeCount = {};

      articles.forEach(article => {
        const text = `${article.title} ${article.description}`.toLowerCase();
        
        POSITIVE_KEYWORDS.forEach(kw => {
          const count = (text.match(new RegExp(kw, 'g')) || []).length;
          if (count > 0) {
            score += count;
            positiveCount[kw] = (positiveCount[kw] || 0) + count;
          }
        });

        NEGATIVE_KEYWORDS.forEach(kw => {
          const count = (text.match(new RegExp(kw, 'g')) || []).length;
          if (count > 0) {
            score -= count;
            negativeCount[kw] = (negativeCount[kw] || 0) + count;
          }
        });
      });

      const maxScore = articles.length * 3;
      const normalizedScore = maxScore > 0 ? Math.round(((score + maxScore) / (2 * maxScore)) * 100) : 50;

      const topPositive = Object.entries(positiveCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

      const topNegative = Object.entries(negativeCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

      setSentimentData({
        index: normalizedScore,
        topPositive,
        topNegative
      });
      setIsLoading(false);
    };

    analyzeSentiment();
  }, [selectedSector, rssSources]);

  const getColor = (index) => {
    if (index >= 65) return isDark ? 'text-green-400' : 'text-green-600';
    if (index >= 45) return isDark ? 'text-yellow-400' : 'text-yellow-600';
    return isDark ? 'text-red-400' : 'text-red-600';
  };

  const getBarColor = (index) => {
    if (index >= 65) return 'bg-green-500';
    if (index >= 45) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className={cn("rounded-lg border p-4 h-full flex flex-col", isDark ? "bg-neutral-900 border-neutral-800" : "bg-white border-gray-200")}>
      <div className="mb-3">
        <h3 className={cn("font-semibold text-sm mb-2", isDark ? "text-white" : "text-gray-900")}>Market Sentiment</h3>
        <Select value={selectedSector?.id} onValueChange={(id) => setSelectedSector(sectors.find(s => s.id === id))}>
          <SelectTrigger className={cn("h-7 text-xs", isDark ? "bg-neutral-800 border-neutral-700" : "bg-gray-50")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent className={cn(isDark ? "bg-neutral-800 border-neutral-700" : "bg-white")}>
            {sectors.map(sector => (
              <SelectItem key={sector.id} value={sector.id} className={cn("text-xs", isDark ? "text-white focus:bg-neutral-700" : "")}>
                {sector.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className={cn("text-xs flex-1 flex items-center justify-center", isDark ? "text-neutral-500" : "text-gray-500")}>
          Loading sentiment data...
        </div>
      ) : sentimentData ? (
        <div className="flex-1 flex flex-col gap-3">
          <div className="text-center">
            <div className={cn("text-3xl font-bold", getColor(sentimentData.index))}>
              {sentimentData.index}
            </div>
            <div className={cn("text-xs mt-1", isDark ? "text-neutral-500" : "text-gray-500")}>Sentiment Index</div>
            <div className="w-full h-2 bg-gray-200 dark:bg-neutral-800 rounded-full mt-2 overflow-hidden">
              <div 
                className={cn("h-full transition-all", getBarColor(sentimentData.index))}
                style={{ width: `${sentimentData.index}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs flex-1 overflow-y-auto">
            <div>
              <div className={cn("font-medium mb-1", isDark ? "text-green-400" : "text-green-600")}>Positive</div>
              {sentimentData.topPositive.map(([kw, count]) => (
                <div key={kw} className={cn("flex justify-between", isDark ? "text-neutral-400" : "text-gray-600")}>
                  <span>{kw}</span>
                  <span>{count}</span>
                </div>
              ))}
            </div>
            <div>
              <div className={cn("font-medium mb-1", isDark ? "text-red-400" : "text-red-600")}>Negative</div>
              {sentimentData.topNegative.map(([kw, count]) => (
                <div key={kw} className={cn("flex justify-between", isDark ? "text-neutral-400" : "text-gray-600")}>
                  <span>{kw}</span>
                  <span>{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className={cn("text-xs flex-1 flex items-center justify-center", isDark ? "text-neutral-500" : "text-gray-500")}>
          Loading sentiment data...
        </div>
      )}
    </div>
  );
}