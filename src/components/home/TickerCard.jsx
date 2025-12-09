import React, { useState, useEffect } from 'react';
import { cn } from "@/lib/utils";
import { Settings, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, CartesianGrid } from 'recharts';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

const DEFAULT_TICKER_CONFIG = [
  { label: 'WTI', symbol: 'CL=F' },
  { label: 'Brent', symbol: 'BZ=F' },
  { label: 'Lithium', symbol: 'LTHM' },
  { label: 'Naphtha', symbol: 'NQ=F' },
  { label: 'USD/KRW', symbol: 'KRW=X' },
  { label: 'USD/CNY', symbol: 'CNY=X' },
  { label: 'Natural Gas', symbol: 'NG=F' },
];

const fetchQuote = async (symbol, duration = '30') => {
  try {
    const corsProxy = 'https://api.allorigins.win/raw?url=';
    const rangeMap = {
      '1': '1d',
      '7': '5d',
      '30': '1mo',
      '365': '1y',
      'ytd': 'ytd'
    };
    const range = rangeMap[duration] || '1mo';
    const interval = duration === '1' ? '5m' : duration === '7' ? '30m' : '1d';
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=${interval}&range=${range}`;
    const response = await fetch(corsProxy + encodeURIComponent(url));
    const data = await response.json();
    
    const result = data?.chart?.result?.[0];
    if (!result) return null;
    
    const meta = result.meta;
    const timestamps = result.timestamp || [];
    const quote = result.indicators?.quote?.[0];
    const closes = quote?.close || [];
    
    const currentPrice = meta.regularMarketPrice;
    const previousClose = meta.previousClose || meta.chartPreviousClose;
    
    if (!currentPrice || !previousClose) return null;
    
    const change = currentPrice - previousClose;
    const changePercent = (change / previousClose) * 100;
    
    // Build chart data with appropriate time format based on duration
    const chartData = timestamps.map((time, idx) => {
      const date = new Date(time * 1000);
      let formattedTime;
      
      if (duration === '1') {
        // 1D: show time of day (HH:MM)
        formattedTime = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
      } else if (duration === '7' || duration === '30') {
        // 5D and 1M: show day labels (MMM D)
        formattedTime = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      } else {
        // 3M and 1Y: show month labels (MMM)
        formattedTime = date.toLocaleDateString('en-US', { month: 'short' });
      }
      
      return {
        time: formattedTime,
        price: closes[idx]
      };
    }).filter(d => d.price != null);
    
    return {
      price: currentPrice,
      change: change,
      changePercent: changePercent,
      positive: change >= 0,
      chartData: chartData
    };
  } catch (error) {
    console.error(`Error fetching ${symbol}:`, error);
    return null;
  }
};

export default function TickerCard({ theme }) {
  const isDark = theme === 'dark';
  const isPastel = theme === 'pastel';
  const [tickerConfig, setTickerConfig] = useState(DEFAULT_TICKER_CONFIG);
  const [editingConfig, setEditingConfig] = useState(DEFAULT_TICKER_CONFIG);
  const [tickerData, setTickerData] = useState({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedTicker, setSelectedTicker] = useState(DEFAULT_TICKER_CONFIG[0]);
  const [chartDuration, setChartDuration] = useState(() => localStorage.getItem('ticker_chart_duration') || '30');

  const { data: settingsData = [] } = useQuery({
    queryKey: ['appSettings'],
    queryFn: () => base44.entities.AppSettings.list(),
  });

  useEffect(() => {
    const duration = settingsData[0]?.ticker_chart_duration || localStorage.getItem('ticker_chart_duration') || '30';
    setChartDuration(duration);
  }, [settingsData]);

  useEffect(() => {
    refreshTickers();
    const interval = setInterval(refreshTickers, 60000);
    return () => clearInterval(interval);
  }, [tickerConfig]);

  useEffect(() => {
    // Refetch data when duration changes
    if (selectedTicker.symbol) {
      const refetchSelected = async () => {
        setIsRefreshing(true);
        const quote = await fetchQuote(selectedTicker.symbol, chartDuration);
        if (quote) {
          setTickerData(prev => ({ ...prev, [selectedTicker.symbol]: quote }));
        }
        setIsRefreshing(false);
      };
      refetchSelected();
    }
  }, [chartDuration]);

  const refreshTickers = async () => {
    setIsRefreshing(true);
    const newData = {};
    
    for (const config of tickerConfig) {
      const quote = await fetchQuote(config.symbol, chartDuration);
      if (quote) {
        newData[config.symbol] = quote;
      }
    }
    
    setTickerData(newData);
    setIsRefreshing(false);
  };

  const formatPrice = (price, symbol) => {
    if (symbol.includes('=X')) return price.toFixed(2);
    if (symbol.includes('=F')) return '$' + price.toFixed(2);
    return price.toFixed(2);
  };

  const selectedData = tickerData[selectedTicker.symbol];

  return (
    <div className={cn("h-full flex flex-col rounded", 
      isPastel ? "bg-[#3A3D5C] border border-[#4A4D6C] shadow-sm" :
      isDark ? "bg-[#131313] border border-[#1F1F1F] shadow-sm" : "bg-white border border-gray-300 shadow-sm")}>
      <div className={cn("flex items-center justify-between px-2 py-1 border-b", 
        isPastel ? "border-[#4A4D6C]" :
        isDark ? "border-[#1F1F1F]" : "border-gray-300")}>
        <h3 className={cn("text-[10px] font-semibold uppercase tracking-wider", 
          isPastel ? "text-[#A5A8C0]" :
          isDark ? "text-neutral-500" : "text-gray-700")}>MARKET TICKER</h3>
        <div className="flex items-center gap-1">
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={refreshTickers}
            disabled={isRefreshing}
            className="h-4 w-4 p-0"
          >
            <RefreshCw className={cn("w-2.5 h-2.5", isRefreshing && "animate-spin", 
              isPastel ? "text-[#7B7E9C]" :
              isDark ? "text-neutral-600" : "text-gray-500")} />
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button size="sm" variant="ghost" className="h-4 w-4 p-0">
                <Settings className={cn("w-2.5 h-2.5", 
                  isPastel ? "text-[#7B7E9C]" :
                  isDark ? "text-neutral-600" : "text-gray-500")} />
              </Button>
            </PopoverTrigger>
            <PopoverContent className={cn("w-80", isDark ? "bg-neutral-800 border-neutral-700" : "bg-white")} align="end">
              <div className="space-y-2">
                <h4 className={cn("font-medium text-[10px] uppercase", isDark ? "text-white" : "text-gray-900")}>Tickers</h4>
                {editingConfig.map((config, idx) => (
                  <div key={idx} className="flex gap-1 items-center">
                    <Input
                      value={config.label}
                      onChange={(e) => {
                        const newConfig = [...editingConfig];
                        newConfig[idx] = { ...newConfig[idx], label: e.target.value };
                        setEditingConfig(newConfig);
                      }}
                      className={cn("h-6 text-[10px] flex-1", isDark ? "bg-neutral-900 border-neutral-700 text-white" : "")}
                      placeholder="Label"
                    />
                    <Input
                      value={config.symbol}
                      onChange={(e) => {
                        const newConfig = [...editingConfig];
                        newConfig[idx] = { ...newConfig[idx], symbol: e.target.value };
                        setEditingConfig(newConfig);
                      }}
                      placeholder="Symbol"
                      className={cn("h-6 text-[10px] flex-1", isDark ? "bg-neutral-900 border-neutral-700 text-white" : "")}
                    />
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => {
                        const newConfig = editingConfig.filter((_, i) => i !== idx);
                        setEditingConfig(newConfig);
                      }}
                      className="h-6 w-6 p-0 text-[10px] text-red-500"
                    >
                      ×
                    </Button>
                  </div>
                ))}
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => {
                    setEditingConfig([...editingConfig, { label: 'New', symbol: 'CL=F' }]);
                  }}
                  className="w-full h-6 text-[10px]"
                >
                  + Add
                </Button>
                <div className="space-y-1 border-t border-neutral-700 pt-2">
                  <Label className={cn("text-[10px] uppercase", isDark ? "text-neutral-400" : "text-gray-600")}>Duration</Label>
                  <div className="grid grid-cols-5 gap-1">
                    {['1', '7', '30', '365', 'ytd'].map(days => (
                      <button
                        key={days}
                        onClick={async () => {
                          if (settingsData[0]?.id) {
                            await base44.entities.AppSettings.update(settingsData[0].id, { ticker_chart_duration: days });
                          }
                          localStorage.setItem('ticker_chart_duration', days);
                          setChartDuration(days);
                        }}
                        className={cn(
                          "text-[9px] uppercase px-1 py-0.5 transition-colors border",
                          chartDuration === days
                            ? (isDark ? "bg-[#1E1E1E] text-neutral-300 border-neutral-600" : "bg-gray-200 text-gray-900 border-gray-400")
                            : (isDark ? "bg-[#0D0D0D] text-neutral-600 hover:text-neutral-400 border-neutral-700" : "bg-white text-gray-600 hover:text-gray-900 border-gray-300")
                        )}
                      >
                        {days === 'ytd' ? 'YTD' : `${days}D`}
                      </button>
                    ))}
                  </div>
                </div>
                <Button 
                  size="sm" 
                  onClick={() => setTickerConfig(editingConfig)}
                  className="w-full h-6 text-[10px]"
                >
                  Save
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
      
      {/* Top Half - Chart */}
      <div className="flex-1 flex flex-col">
        <div className={cn("px-2 py-1 border-b flex items-center justify-between", 
          isPastel ? "border-[#4A4D6C]" :
          isDark ? "border-[#1F1F1F]" : "border-gray-300")}>
          <h4 className={cn("text-[9px] font-semibold uppercase tracking-wider", 
            isPastel ? "text-[#A5A8C0]" :
            isDark ? "text-neutral-500" : "text-gray-700")}>
            {selectedTicker.symbol}
          </h4>
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                const currentIndex = tickerConfig.findIndex(t => t.symbol === selectedTicker.symbol);
                const prevIndex = currentIndex === 0 ? tickerConfig.length - 1 : currentIndex - 1;
                setSelectedTicker(tickerConfig[prevIndex]);
              }}
              className={cn("p-0.5 transition-colors", 
                isPastel ? "text-[#7B7E9C] hover:text-[#A5A8C0]" :
                isDark ? "text-neutral-600 hover:text-neutral-400" : "text-gray-500 hover:text-gray-700")}
            >
              <ChevronLeft className="w-3 h-3" />
            </button>
            <button
              onClick={() => {
                const currentIndex = tickerConfig.findIndex(t => t.symbol === selectedTicker.symbol);
                const nextIndex = currentIndex === tickerConfig.length - 1 ? 0 : currentIndex + 1;
                setSelectedTicker(tickerConfig[nextIndex]);
              }}
              className={cn("p-0.5 transition-colors", 
                isPastel ? "text-[#7B7E9C] hover:text-[#A5A8C0]" :
                isDark ? "text-neutral-600 hover:text-neutral-400" : "text-gray-500 hover:text-gray-700")}
            >
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
        <div className={cn("flex-1", 
          isPastel ? "bg-[#32354C]" :
          isDark ? "bg-[#0A0A0A]" : "bg-gray-50")}>
          {selectedData?.chartData && selectedData.chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={selectedData.chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={
                  isPastel ? '#4A4D6C' :
                  isDark ? '#1A1A1A' : '#e5e7eb'} />
                <XAxis 
                  dataKey="time" 
                  tick={{ fontSize: 7, fill: isPastel ? '#9B9EBC' : isDark ? '#525252' : '#9ca3af' }}
                  stroke={isPastel ? '#4A4D6C' : isDark ? '#1F1F1F' : '#e5e7eb'}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  domain={['auto', 'auto']}
                  tick={{ fontSize: 7, fill: isPastel ? '#9B9EBC' : isDark ? '#525252' : '#9ca3af' }}
                  stroke={isPastel ? '#4A4D6C' : isDark ? '#1F1F1F' : '#e5e7eb'}
                  tickLine={false}
                  width={35}
                />
                <Line 
                  type="monotone" 
                  dataKey="price" 
                  stroke={selectedData.positive ? (isDark ? '#2D8659' : '#16a34a') : (isDark ? '#8B3A3A' : '#dc2626')} 
                  strokeWidth={1.5}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className={cn("flex items-center justify-center h-full text-[9px]", 
              isPastel ? "text-[#7B7E9C]" :
              isDark ? "text-neutral-700" : "text-gray-400")}>
              {isRefreshing ? 'Loading...' : 'No chart data'}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Half - Ticker List */}
        <div className={cn("border-t", 
          isPastel ? "border-[#4A4D6C] bg-[#2F3248]" :
          isDark ? "border-[#1F1F1F] bg-[#0F0F0F]" : "border-gray-300 bg-gray-50")}>
        <div className="divide-y divide-[#1F1F1F]">
          {tickerConfig.map((config) => {
            const data = tickerData[config.symbol];
            const isActive = selectedTicker.symbol === config.symbol;
            return (
              <button
                key={config.symbol}
                onClick={() => setSelectedTicker(config)}
                className={cn(
                  "w-full px-2 py-1 flex items-center justify-between transition-colors relative",
                  isPastel ? "hover:bg-[#42456C]" :
                  isDark ? "hover:bg-[#1A1A1A]" : "hover:bg-gray-100",
                  isActive && (isPastel ? "bg-[#42456C]" : isDark ? "bg-[#1A1A1A]" : "bg-gray-100")
                )}
              >
                {isActive && (
                  <div className={cn("absolute left-0 top-0 bottom-0 w-[2px]", 
                    isPastel ? "bg-[#9B8B6B]" :
                    isDark ? "bg-orange-500" : "bg-orange-600")} />
                )}
                <span className={cn("text-[9px] font-medium text-left pl-1", 
                  isPastel ? "text-[#D0D2E0]" :
                  isDark ? "text-neutral-400" : "text-gray-700")}>
                  {config.label}
                </span>
                {data ? (
                  <div className="flex items-center gap-2">
                    <span className={cn("text-[9px] font-mono font-bold", 
                      isPastel ? "text-white" :
                      isDark ? "text-white" : "text-gray-900")}>
                      {formatPrice(data.price, config.symbol)}
                    </span>
                    <span className={cn("text-[9px] font-mono", 
                      data.positive 
                        ? (isPastel ? "text-[#6B9B9B]" : isDark ? "text-[#2D8659]" : "text-green-600") 
                        : (isPastel ? "text-[#9B6B7B]" : isDark ? "text-[#8B3A3A]" : "text-red-600"))}>
                      {data.positive ? '+' : ''}{data.change.toFixed(2)} ({data.positive ? '+' : ''}{data.changePercent.toFixed(2)}%)
                    </span>
                  </div>
                ) : (
                  <span className={cn("text-[8px]", 
                    isPastel ? "text-[#7B7E9C]" :
                    isDark ? "text-neutral-700" : "text-gray-400")}>Loading...</span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}