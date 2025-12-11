import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { cn } from "@/lib/utils";
import { RefreshCw, Settings, BarChart3 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
        description: item.querySelector('description')?.textContent || '',
        pubDate: item.querySelector('pubDate')?.textContent || null,
      });
    });
    
    return articles;
  } catch (error) {
    console.error('Error parsing RSS:', error);
    return [];
  }
};

export default function KeywordHeatmapCard({ theme }) {
  const isDark = theme === 'dark';
  const isPastel = theme === 'pastel';
  const [keywordData, setKeywordData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSector, setSelectedSector] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedKeyword, setSelectedKeyword] = useState(null);
  const [relatedArticles, setRelatedArticles] = useState([]);
  const [viewType, setViewType] = useState('treemap');
  const [mode, setMode] = useState('analysis');
  const [activityKeywords, setActivityKeywords] = useState([]);
  const [activityData, setActivityData] = useState([]);
  const [customKeyword, setCustomKeyword] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [includeWords, setIncludeWords] = useState([]);
  const [excludeWords, setExcludeWords] = useState([]);
  const [newIncludeWord, setNewIncludeWord] = useState('');
  const [newExcludeWord, setNewExcludeWord] = useState('');

  const { data: sectors = [] } = useQuery({
    queryKey: ['sectors'],
    queryFn: () => base44.entities.Sector.list('order'),
  });

  const { data: rssSources = [] } = useQuery({
    queryKey: ['rssSources'],
    queryFn: () => base44.entities.RSSSource.list(),
  });

  const { data: savedArticles = [] } = useQuery({
    queryKey: ['savedArticles'],
    queryFn: () => base44.entities.SavedArticle.list(),
  });

  const suggestedWords = ['tariff', 'battery', 'lithium', 'steel', 'aluminum', 'sanctions', 'export', 'EV'];
  const colors = ['#f97316', '#3b82f6', '#22c55e', '#ef4444'];

  useEffect(() => {
    const cached = localStorage.getItem(`keyword_heatmap_${selectedSector?.id || 'all'}`);
    if (cached) {
      const data = JSON.parse(cached);
      setKeywordData(data);
    }
  }, [selectedSector]);

  const analyzeKeywords = async () => {
    setIsLoading(true);
    const keywordCounts = {};
    const allArticles = [];

    const sourcesToAnalyze = selectedSector
      ? rssSources.filter(s => s.sector_id === selectedSector.id && s.is_active !== false)
      : rssSources.filter(s => s.is_active !== false);

    for (const source of sourcesToAnalyze.slice(0, 10)) {
      const articles = await parseRSS(source.url);
      const sector = sectors.find(s => s.id === source.sector_id);
      
      articles.forEach(article => {
        allArticles.push({ ...article, source: source.name, sector: sector?.name });
        
        const text = `${article.title} ${article.description}`.toLowerCase();
        const words = text.match(/\b[a-z]{4,}\b/g) || [];
        
        words.forEach(word => {
          if (!excludeWords.includes(word)) {
            if (includeWords.length === 0 || includeWords.some(inc => word.includes(inc))) {
              keywordCounts[word] = (keywordCounts[word] || 0) + 1;
            }
          }
        });
      });
    }

    const sortedKeywords = Object.entries(keywordCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 30)
      .map(([word, count]) => ({ word, count, articles: allArticles }));

    setKeywordData(sortedKeywords);
    localStorage.setItem(`keyword_heatmap_${selectedSector?.id || 'all'}`, JSON.stringify(sortedKeywords));
    setIsLoading(false);
  };

  const analyzeActivity = async () => {
    setIsLoading(true);
    const timeSeriesData = {};
    
    const sourcesToAnalyze = rssSources.filter(s => s.is_active !== false);

    for (const source of sourcesToAnalyze.slice(0, 15)) {
      const articles = await parseRSS(source.url);
      
      articles.forEach(article => {
        if (!article.pubDate) return;
        
        const date = new Date(article.pubDate);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!timeSeriesData[monthKey]) {
          timeSeriesData[monthKey] = {};
        }
        
        const text = `${article.title} ${article.description}`.toLowerCase();
        
        activityKeywords.forEach(keyword => {
          const count = (text.match(new RegExp(keyword.toLowerCase(), 'g')) || []).length;
          if (count > 0) {
            timeSeriesData[monthKey][keyword] = (timeSeriesData[monthKey][keyword] || 0) + count;
          }
        });
      });
    }

    const chartData = Object.keys(timeSeriesData)
      .sort()
      .slice(-12)
      .map(month => {
        const dataPoint = { month };
        activityKeywords.forEach(keyword => {
          dataPoint[keyword] = timeSeriesData[month][keyword] || 0;
        });
        return dataPoint;
      });

    setActivityData(chartData);
    setIsLoading(false);
  };

  const handleKeywordClick = (keyword) => {
    const articles = keywordData.find(k => k.word === keyword)?.articles || [];
    const filtered = articles.filter(a => {
      const text = `${a.title} ${a.description}`.toLowerCase();
      return text.includes(keyword.toLowerCase());
    }).slice(0, 20);
    
    setSelectedKeyword(keyword);
    setRelatedArticles(filtered);
    setDialogOpen(true);
  };

  const handleSaveArticle = async (article) => {
    const existing = savedArticles.find(a => a.link === article.link);
    if (existing) {
      await base44.entities.SavedArticle.delete(existing.id);
    } else {
      await base44.entities.SavedArticle.create({ ...article, collection_ids: [] });
    }
  };

  const addActivityKeyword = (word) => {
    if (activityKeywords.length < 4 && !activityKeywords.includes(word)) {
      setActivityKeywords([...activityKeywords, word]);
    }
  };

  const removeActivityKeyword = (word) => {
    setActivityKeywords(activityKeywords.filter(k => k !== word));
  };

  const maxCount = Math.max(...keywordData.map(k => k.count), 1);

  return (
    <div className={cn("h-full flex flex-col border", 
      isPastel ? "bg-[#3A3D5C] border-[#4A4D6C]" :
      isDark ? "bg-[#131313] border-[#1F1F1F]" : "bg-white border-gray-300")}>
      <div className={cn("px-2 py-1 border-b flex items-center justify-between", 
        isPastel ? "border-[#4A4D6C]" :
        isDark ? "border-[#1F1F1F]" : "border-gray-300")}>
        <h3 className={cn("text-[10px] font-semibold uppercase tracking-wider", 
          isPastel ? "text-[#A5A8C0]" :
          isDark ? "text-neutral-500" : "text-gray-700")}>
          {mode === 'analysis' ? 'KEYWORD ANALYSIS' : 'KEYWORD ACTIVITY'}
        </h3>
        <div className="flex items-center gap-1">
          <Select value={mode} onValueChange={setMode}>
            <SelectTrigger className={cn("h-5 w-24 text-[9px]",
              isPastel ? "bg-[#2B2D42] border-[#4A4D6C]" :
              isDark ? "bg-neutral-900 border-neutral-700" : "")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className={isDark ? "bg-neutral-800 border-neutral-700" : ""}>
              <SelectItem value="analysis">Analysis</SelectItem>
              <SelectItem value="activity">Activity</SelectItem>
            </SelectContent>
          </Select>
          {mode === 'analysis' && (
            <>
              <Select value={viewType} onValueChange={setViewType}>
                <SelectTrigger className={cn("h-5 w-24 text-[9px]",
                  isPastel ? "bg-[#2B2D42] border-[#4A4D6C]" :
                  isDark ? "bg-neutral-900 border-neutral-700" : "")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className={isDark ? "bg-neutral-800 border-neutral-700" : ""}>
                  <SelectItem value="treemap">Treemap</SelectItem>
                  <SelectItem value="wordcloud">Word Cloud</SelectItem>
                </SelectContent>
              </Select>
              <Popover open={settingsOpen} onOpenChange={setSettingsOpen}>
                <PopoverTrigger asChild>
                  <Button size="sm" variant="ghost" className="h-4 w-4 p-0">
                    <Settings className={cn("w-2.5 h-2.5", 
                      isPastel ? "text-[#7B7E9C]" :
                      isDark ? "text-neutral-600" : "text-gray-500")} />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className={cn("w-80",
                  isPastel ? "bg-[#3A3D5C] border-[#4A4D6C]" :
                  isDark ? "bg-neutral-800 border-neutral-700" : "bg-white")} align="end">
                  <div className="space-y-3">
                    <div>
                      <Label className={cn("text-xs mb-1 block",
                        isDark ? "text-neutral-300" : "text-gray-700")}>Include Words</Label>
                      <div className="flex gap-1 mb-1">
                        <Input
                          value={newIncludeWord}
                          onChange={(e) => setNewIncludeWord(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && newIncludeWord.trim()) {
                              setIncludeWords([...includeWords, newIncludeWord.trim()]);
                              setNewIncludeWord('');
                            }
                          }}
                          placeholder="Add word..."
                          className={cn("h-6 text-xs",
                            isDark ? "bg-neutral-900 border-neutral-700" : "")}
                        />
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {includeWords.map((word, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {word}
                            <button onClick={() => setIncludeWords(includeWords.filter((_, i) => i !== idx))} className="ml-1">×</button>
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label className={cn("text-xs mb-1 block",
                        isDark ? "text-neutral-300" : "text-gray-700")}>Exclude Words</Label>
                      <div className="flex gap-1 mb-1">
                        <Input
                          value={newExcludeWord}
                          onChange={(e) => setNewExcludeWord(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && newExcludeWord.trim()) {
                              setExcludeWords([...excludeWords, newExcludeWord.trim()]);
                              setNewExcludeWord('');
                            }
                          }}
                          placeholder="Add word..."
                          className={cn("h-6 text-xs",
                            isDark ? "bg-neutral-900 border-neutral-700" : "")}
                        />
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {excludeWords.map((word, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {word}
                            <button onClick={() => setExcludeWords(excludeWords.filter((_, i) => i !== idx))} className="ml-1">×</button>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </>
          )}
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={mode === 'analysis' ? analyzeKeywords : analyzeActivity}
            disabled={isLoading || (mode === 'activity' && activityKeywords.length === 0)}
            className="h-4 w-4 p-0"
          >
            <RefreshCw className={cn("w-2.5 h-2.5", isLoading && "animate-spin", 
              isPastel ? "text-[#7B7E9C]" :
              isDark ? "text-neutral-600" : "text-gray-500")} />
          </Button>
        </div>
      </div>

      {mode === 'analysis' ? (
        <>
          <div className={cn("px-2 py-1 border-b",
            isPastel ? "border-[#4A4D6C]" :
            isDark ? "border-[#1F1F1F]" : "border-gray-300")}>
            <Select value={selectedSector?.id || 'all'} onValueChange={(value) => {
              const sector = value === 'all' ? null : sectors.find(s => s.id === value);
              setSelectedSector(sector);
            }}>
              <SelectTrigger className={cn("h-5 w-full text-[9px]",
                isPastel ? "bg-[#2B2D42] border-[#4A4D6C]" :
                isDark ? "bg-neutral-900 border-neutral-700" : "")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className={isDark ? "bg-neutral-800 border-neutral-700" : ""}>
                <SelectItem value="all">All Sectors</SelectItem>
                {sectors.map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className={cn("flex-1 overflow-hidden p-2", 
            isPastel ? "bg-[#32354C]" :
            isDark ? "bg-[#0A0A0A]" : "bg-gray-50")}>
            {keywordData.length === 0 && !isLoading ? (
              <div className={cn("text-center text-[10px] py-8", 
                isPastel ? "text-[#7B7E9C]" :
                isDark ? "text-neutral-700" : "text-gray-500")}>
                Click refresh to analyze keywords
              </div>
            ) : viewType === 'treemap' ? (
            <div className="h-full flex flex-wrap content-start gap-0.5">
              {keywordData.map((item) => {
                const size = Math.max(40, (item.count / maxCount) * 120);
                return (
                  <button
                    key={item.word}
                    onClick={() => handleKeywordClick(item.word)}
                    className={cn("transition-all hover:opacity-80 flex items-center justify-center text-center px-1",
                      isPastel ? "bg-[#9B8B6B] text-white" :
                      isDark ? "bg-orange-600 text-white" : "bg-orange-600 text-white")}
                    style={{
                      width: `${size}px`,
                      height: `${size * 0.6}px`,
                      fontSize: `${Math.max(8, size / 10)}px`,
                    }}
                  >
                    <div>
                      <div className="font-medium">{item.word}</div>
                      <div className="text-[8px] opacity-80">{item.count}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="h-full flex flex-wrap content-center justify-center gap-1">
              {keywordData.map((item) => {
                const size = Math.max(10, (item.count / maxCount) * 24);
                return (
                  <button
                    key={item.word}
                    onClick={() => handleKeywordClick(item.word)}
                    className={cn("transition-all hover:opacity-80",
                      isPastel ? "text-[#D0D2E0] hover:text-white" :
                      isDark ? "text-neutral-400 hover:text-white" : "text-gray-700 hover:text-gray-900")}
                    style={{ fontSize: `${size}px`, fontWeight: Math.min(900, 400 + item.count * 50) }}
                  >
                    {item.word}
                  </button>
                );
              })}
            </div>
            )}
          </div>
        </>
      ) : (
        <div className={cn("flex-1 flex flex-col", 
          isPastel ? "bg-[#32354C]" :
          isDark ? "bg-[#0A0A0A]" : "bg-gray-50")}>
          <div className="p-2 space-y-1">
            <div className="flex flex-wrap gap-1 mb-1">
              {suggestedWords.map(word => (
                <button
                  key={word}
                  onClick={() => addActivityKeyword(word)}
                  disabled={activityKeywords.includes(word) || activityKeywords.length >= 4}
                  className={cn("px-2 py-0.5 text-[9px] border transition-colors disabled:opacity-30",
                    activityKeywords.includes(word)
                      ? (isPastel ? "bg-[#9B8B6B] border-[#9B8B6B] text-white" :
                         isDark ? "bg-orange-600 border-orange-600 text-white" : "bg-orange-600 border-orange-600 text-white")
                      : (isPastel ? "bg-[#42456C] border-[#4A4D6C] text-[#D0D2E0] hover:border-[#9B8B6B]" :
                         isDark ? "bg-[#1A1A1A] border-neutral-700 text-neutral-400 hover:border-orange-600" : "bg-white border-gray-300 text-gray-700 hover:border-orange-600")
                  )}
                >
                  {word}
                </button>
              ))}
            </div>
            <div className="flex gap-1">
              <Input
                value={customKeyword}
                onChange={(e) => setCustomKeyword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && customKeyword.trim()) {
                    addActivityKeyword(customKeyword.trim());
                    setCustomKeyword('');
                  }
                }}
                placeholder="Add custom keyword..."
                disabled={activityKeywords.length >= 4}
                className={cn("h-6 text-[9px]",
                  isPastel ? "bg-[#2B2D42] border-[#4A4D6C] text-white" :
                  isDark ? "bg-neutral-900 border-neutral-700 text-white" : "")}
              />
            </div>
            <div className="flex flex-wrap gap-1">
              {activityKeywords.map((word, idx) => (
                <Badge key={word} style={{ backgroundColor: colors[idx] }} className="text-[9px]">
                  {word}
                  <button onClick={() => removeActivityKeyword(word)} className="ml-1">×</button>
                </Badge>
              ))}
            </div>
          </div>
          <div className="flex-1 p-2">
            {activityData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={activityData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1A1A1A' : '#e5e7eb'} />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: 8, fill: isDark ? '#737373' : '#9ca3af' }}
                    stroke={isDark ? '#1F1F1F' : '#e5e7eb'}
                  />
                  <YAxis 
                    tick={{ fontSize: 8, fill: isDark ? '#737373' : '#9ca3af' }}
                    stroke={isDark ? '#1F1F1F' : '#e5e7eb'}
                    width={25}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
                      border: isDark ? '1px solid #404040' : '1px solid #e5e7eb',
                      fontSize: '10px'
                    }}
                  />
                  {activityKeywords.map((keyword, idx) => (
                    <Line 
                      key={keyword}
                      type="monotone" 
                      dataKey={keyword} 
                      stroke={colors[idx]}
                      strokeWidth={2}
                      dot={{ r: 2 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className={cn("flex items-center justify-center h-full text-[10px]",
                isPastel ? "text-[#7B7E9C]" :
                isDark ? "text-neutral-700" : "text-gray-500")}>
                {activityKeywords.length === 0 ? 'Select keywords to track' : 'Click refresh to load activity'}
              </div>
            )}
          </div>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className={cn("max-w-2xl max-h-[80vh]",
          isDark ? "bg-neutral-900 border-neutral-800" : "bg-white")}>
          <DialogHeader>
            <DialogTitle className={isDark ? "text-white" : ""}>Articles mentioning "{selectedKeyword}"</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[60vh] space-y-2">
            {relatedArticles.map((article, idx) => (
              <div key={idx} className={cn("p-2 border",
                isDark ? "bg-neutral-800 border-neutral-700" : "bg-gray-50 border-gray-200")}>
                <a href={article.link} target="_blank" rel="noopener noreferrer"
                  className={cn("text-sm font-medium hover:underline block",
                    isDark ? "text-white" : "text-gray-900")}>
                  {article.title}
                </a>
                <p className={cn("text-xs mt-1",
                  isDark ? "text-neutral-400" : "text-gray-600")}>
                  {article.source} • {article.sector}
                </p>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}