import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, Plus, X } from 'lucide-react';
import { cn } from "@/lib/utils";

const DEFAULT_POSITIVE = [
  { word: 'breakthrough', score: 1 }, { word: 'success', score: 1 }, { word: 'growth', score: 1 },
  { word: 'innovation', score: 1 }, { word: 'advance', score: 1 }, { word: 'achieve', score: 1 },
  { word: 'gain', score: 1 }, { word: 'increase', score: 1 }, { word: 'profit', score: 1 },
  { word: 'record', score: 1 }, { word: 'boost', score: 1 }, { word: 'win', score: 1 },
  { word: 'launch', score: 1 }, { word: 'expand', score: 1 }, { word: 'positive', score: 1 },
  { word: 'strong', score: 1 }, { word: 'high', score: 1 }, { word: 'up', score: 1 },
  { word: 'rise', score: 1 }, { word: 'surge', score: 1 }
];

const DEFAULT_NEGATIVE = [
  { word: 'decline', score: -1 }, { word: 'fall', score: -1 }, { word: 'loss', score: -1 },
  { word: 'drop', score: -1 }, { word: 'crisis', score: -1 }, { word: 'concern', score: -1 },
  { word: 'risk', score: -1 }, { word: 'warning', score: -1 }, { word: 'weak', score: -1 },
  { word: 'fail', score: -1 }, { word: 'cut', score: -1 }, { word: 'slash', score: -1 },
  { word: 'down', score: -1 }, { word: 'struggle', score: -1 }, { word: 'challenge', score: -1 },
  { word: 'problem', score: -1 }, { word: 'delay', score: -1 }, { word: 'issue', score: -1 },
  { word: 'negative', score: -1 }, { word: 'low', score: -1 }
];

export default function MarketSentimentCard({ theme }) {
  const [selectedSector, setSelectedSector] = useState(null);
  const [sentimentData, setSentimentData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [positiveKeywords, setPositiveKeywords] = useState(DEFAULT_POSITIVE);
  const [negativeKeywords, setNegativeKeywords] = useState(DEFAULT_NEGATIVE);
  const [newKeyword, setNewKeyword] = useState('');
  const [newScore, setNewScore] = useState(1);
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
        
        positiveKeywords.forEach(({ word, score: kwScore }) => {
          const count = (text.match(new RegExp(word, 'g')) || []).length;
          if (count > 0) {
            score += count * kwScore;
            positiveCount[word] = (positiveCount[word] || 0) + count;
          }
        });

        negativeKeywords.forEach(({ word, score: kwScore }) => {
          const count = (text.match(new RegExp(word, 'g')) || []).length;
          if (count > 0) {
            score += count * kwScore;
            negativeCount[word] = (negativeCount[word] || 0) + count;
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
  }, [selectedSector, rssSources, positiveKeywords, negativeKeywords]);

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
    <div className={cn("rounded border h-full flex flex-col", isDark ? "bg-neutral-900 border-neutral-800" : "bg-white border-gray-300")}>
      <div className={cn("px-3 py-2 border-b", isDark ? "border-neutral-800" : "border-gray-300")}>
        <div className="flex items-center justify-between mb-1.5">
          <h3 className={cn("font-semibold text-xs uppercase tracking-wide", isDark ? "text-neutral-300" : "text-gray-700")}>Market Sentiment</h3>
          <Popover>
            <PopoverTrigger asChild>
              <Button size="sm" variant="ghost" className="h-5 w-5 p-0">
                <Settings className={cn("w-3 h-3", isDark ? "text-neutral-500" : "text-gray-500")} />
              </Button>
            </PopoverTrigger>
            <PopoverContent className={cn("w-96", isDark ? "bg-neutral-800 border-neutral-700" : "bg-white")} align="end">
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                <h4 className={cn("font-medium text-xs", isDark ? "text-white" : "text-gray-900")}>Sentiment Keywords</h4>
                
                <div>
                  <Label className={cn("text-xs font-medium", isDark ? "text-green-400" : "text-green-600")}>Positive Keywords</Label>
                  <div className="space-y-1 mt-1">
                    {positiveKeywords.map((kw, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <Input value={kw.word} onChange={(e) => {
                          const newKws = [...positiveKeywords];
                          newKws[idx].word = e.target.value;
                          setPositiveKeywords(newKws);
                        }} className={cn("h-6 text-xs flex-1", isDark ? "bg-neutral-900 border-neutral-700 text-white" : "")} />
                        <Input type="number" value={kw.score} onChange={(e) => {
                          const newKws = [...positiveKeywords];
                          newKws[idx].score = Number(e.target.value);
                          setPositiveKeywords(newKws);
                        }} className={cn("h-6 text-xs w-16", isDark ? "bg-neutral-900 border-neutral-700 text-white" : "")} />
                        <Button size="sm" variant="ghost" onClick={() => setPositiveKeywords(positiveKeywords.filter((_, i) => i !== idx))} className="h-6 w-6 p-0">
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Input placeholder="New keyword" value={newKeyword} onChange={(e) => setNewKeyword(e.target.value)} className={cn("h-6 text-xs flex-1", isDark ? "bg-neutral-900 border-neutral-700 text-white" : "")} />
                    <Input type="number" placeholder="Score" value={newScore} onChange={(e) => setNewScore(Number(e.target.value))} className={cn("h-6 text-xs w-16", isDark ? "bg-neutral-900 border-neutral-700 text-white" : "")} />
                    <Button size="sm" onClick={() => { if (newKeyword) { setPositiveKeywords([...positiveKeywords, { word: newKeyword, score: newScore }]); setNewKeyword(''); setNewScore(1); }}} className="h-6">
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                <div>
                  <Label className={cn("text-xs font-medium", isDark ? "text-red-400" : "text-red-600")}>Negative Keywords</Label>
                  <div className="space-y-1 mt-1">
                    {negativeKeywords.map((kw, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <Input value={kw.word} onChange={(e) => {
                          const newKws = [...negativeKeywords];
                          newKws[idx].word = e.target.value;
                          setNegativeKeywords(newKws);
                        }} className={cn("h-6 text-xs flex-1", isDark ? "bg-neutral-900 border-neutral-700 text-white" : "")} />
                        <Input type="number" value={kw.score} onChange={(e) => {
                          const newKws = [...negativeKeywords];
                          newKws[idx].score = Number(e.target.value);
                          setNegativeKeywords(newKws);
                        }} className={cn("h-6 text-xs w-16", isDark ? "bg-neutral-900 border-neutral-700 text-white" : "")} />
                        <Button size="sm" variant="ghost" onClick={() => setNegativeKeywords(negativeKeywords.filter((_, i) => i !== idx))} className="h-6 w-6 p-0">
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
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