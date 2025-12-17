import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { cn } from "@/lib/utils";
import { Settings, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, CartesianGrid } from 'recharts';

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
    
    const chartData = timestamps.map((time, idx) => {
      const date = new Date(time * 1000);
      let formattedTime;
      
      if (duration === '1') {
        formattedTime = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
      } else if (duration === '7' || duration === '30') {
        formattedTime = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      } else {
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
  const queryClient = useQueryClient();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [tickerData, setTickerData] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [tickers, setTickers] = useState([]);
  const [newLabel, setNewLabel] = useState('');
  const [newSymbol, setNewSymbol] = useState('');
  const [chartDuration, setChartDuration] = useState('30');

  const { data: tickerConfig = [] } = useQuery({
    queryKey: ['tickerConfig'],
    queryFn: () => base44.entities.TickerConfig.list(),
  });

  useEffect(() => {
    if (tickerConfig.length > 0) {
      const config = tickerConfig[0];
      setTickers(config.tickers || []);
      setChartDuration(config.chart_duration || '30');
    }
  }, [tickerConfig]);

  useEffect(() => {
    if (tickers.length > 0) {
      loadTickerData();
      const interval = setInterval(loadTickerData, 60000);
      return () => clearInterval(interval);
    }
  }, [tickers, chartDuration]);

  const loadTickerData = async () => {
    setIsLoading(true);
    const data = {};
    for (const ticker of tickers) {
      const quote = await fetchQuote(ticker.symbol, chartDuration);
      if (quote) data[ticker.symbol] = quote;
    }
    setTickerData(data);
    setIsLoading(false);
  };

  const handleSave = async () => {
    const config = tickerConfig[0];
    const data = {
      tickers,
      chart_duration: chartDuration
    };
    
    if (config) {
      await base44.entities.TickerConfig.update(config.id, data);
    } else {
      await base44.entities.TickerConfig.create(data);
    }
    
    queryClient.invalidateQueries({ queryKey: ['tickerConfig'] });
    setSettingsOpen(false);
    setCurrentIndex(0);
    setTickerData({});
  };

  const handleDelete = async (index) => {
    const updated = tickers.filter((_, i) => i !== index);
    setTickers(updated);
    
    const config = tickerConfig[0];
    if (config) {
      await base44.entities.TickerConfig.update(config.id, { tickers: updated, chart_duration: chartDuration });
      queryClient.invalidateQueries({ queryKey: ['tickerConfig'] });
    }
    
    if (currentIndex >= updated.length) {
      setCurrentIndex(Math.max(0, updated.length - 1));
    }
    setTickerData({});
  };

  const handleAddTicker = () => {
    if (newLabel && newSymbol) {
      setTickers([...tickers, { label: newLabel, symbol: newSymbol }]);
      setNewLabel('');
      setNewSymbol('');
    }
  };

  const currentTicker = tickers[currentIndex];
  const currentData = currentTicker ? tickerData[currentTicker.symbol] : null;

  const formatPrice = (price, symbol) => {
    if (symbol.includes('=X')) return price.toFixed(2);
    if (symbol.includes('=F')) return '$' + price.toFixed(2);
    return price.toFixed(2);
  };

  return (
    <div className={cn("h-full flex flex-col border", 
      isPastel ? "bg-[#3A3D5C] border-[#4A4D6C]" :
      isDark ? "bg-[#131313] border-[#1F1F1F]" : "bg-white border-gray-300")}>
      <div className={cn("px-2 py-1 border-b flex items-center justify-between", 
        isPastel ? "border-[#4A4D6C]" :
        isDark ? "border-[#1F1F1F]" : "border-gray-300")}>
        <h3 className={cn("text-[10px] font-semibold uppercase tracking-wider", 
          isPastel ? "text-[#A5A8C0]" :
          isDark ? "text-neutral-500" : "text-gray-700")}>MARKET TICKER</h3>
        <div className="flex items-center gap-1">
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={loadTickerData}
            disabled={isLoading || tickers.length === 0}
            className="h-4 w-4 p-0"
          >
            <RefreshCw className={cn("w-2.5 h-2.5", isLoading && "animate-spin", 
              isPastel ? "text-[#7B7E9C]" :
              isDark ? "text-neutral-600" : "text-gray-500")} />
          </Button>
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
              <div className="space-y-2">
                <h4 className={cn("font-medium text-[10px] uppercase",
                  isPastel ? "text-[#E8E9F0]" :
                  isDark ? "text-white" : "text-gray-900")}>Tickers</h4>
                {tickers.map((ticker, idx) => (
                  <div key={idx} className="flex gap-1 items-center">
                    <Input
                      value={ticker.label}
                      onChange={(e) => {
                        const updated = [...tickers];
                        updated[idx] = { ...updated[idx], label: e.target.value };
                        setTickers(updated);
                      }}
                      className={cn("h-6 text-[10px] flex-1",
                        isPastel ? "bg-[#2B2D42] border-[#4A4D6C] text-white" :
                        isDark ? "bg-neutral-900 border-neutral-700 text-white" : "")}
                      placeholder="Label"
                    />
                    <Input
                      value={ticker.symbol}
                      onChange={(e) => {
                        const updated = [...tickers];
                        updated[idx] = { ...updated[idx], symbol: e.target.value };
                        setTickers(updated);
                      }}
                      placeholder="Symbol"
                      className={cn("h-6 text-[10px] flex-1",
                        isPastel ? "bg-[#2B2D42] border-[#4A4D6C] text-white" :
                        isDark ? "bg-neutral-900 border-neutral-700 text-white" : "")}
                    />
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => handleDelete(idx)}
                      className="h-6 w-6 p-0 text-[10px] text-red-500"
                    >
                      ×
                    </Button>
                  </div>
                ))}
                <div className="flex gap-1">
                  <Input
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    placeholder="Label"
                    className={cn("h-6 text-[10px] flex-1",
                      isPastel ? "bg-[#2B2D42] border-[#4A4D6C] text-white" :
                      isDark ? "bg-neutral-900 border-neutral-700 text-white" : "")}
                  />
                  <Input
                    value={newSymbol}
                    onChange={(e) => setNewSymbol(e.target.value)}
                    placeholder="Symbol"
                    className={cn("h-6 text-[10px] flex-1",
                      isPastel ? "bg-[#2B2D42] border-[#4A4D6C] text-white" :
                      isDark ? "bg-neutral-900 border-neutral-700 text-white" : "")}
                  />
                  <Button 
                    size="sm" 
                    onClick={handleAddTicker}
                    className="h-6 px-2 text-[10px]"
                  >
                    +
                  </Button>
                </div>
                <div className={cn("space-y-1 pt-2 border-t",
                  isPastel ? "border-[#4A4D6C]" : "border-neutral-700")}>
                  <Label className={cn("text-[10px] uppercase",
                    isPastel ? "text-[#A5A8C0]" :
                    isDark ? "text-neutral-400" : "text-gray-600")}>Duration</Label>
                  <div className="grid grid-cols-5 gap-1">
                    {['1', '7', '30', '365', 'ytd'].map(days => (
                      <button
                        key={days}
                        onClick={() => setChartDuration(days)}
                        className={cn(
                          "text-[9px] uppercase px-1 py-0.5 transition-colors border",
                          chartDuration === days
                            ? (isPastel ? "bg-[#42456C] text-white border-[#5A5D7C]" :
                               isDark ? "bg-[#1E1E1E] text-neutral-300 border-neutral-600" : "bg-gray-200 text-gray-900 border-gray-400")
                            : (isPastel ? "bg-[#2B2D42] text-[#9B9EBC] hover:text-white border-[#4A4D6C]" :
                               isDark ? "bg-[#0D0D0D] text-neutral-600 hover:text-neutral-400 border-neutral-700" : "bg-white text-gray-600 hover:text-gray-900 border-gray-300")
                        )}
                      >
                        {days === 'ytd' ? 'YTD' : `${days}D`}
                      </button>
                    ))}
                  </div>
                </div>
                <Button 
                  size="sm" 
                  onClick={handleSave}
                  className="w-full h-6 text-[10px]"
                >
                  Save
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
      
      <div className="flex-1 p-2 relative">
        {tickers.length === 0 ? (
          <div className={cn("flex flex-col items-center justify-center h-full text-[10px] gap-2",
            isPastel ? "text-[#7B7E9C]" :
            isDark ? "text-neutral-700" : "text-gray-500")}>
            <span>No tickers configured</span>
            <Button 
              size="sm" 
              onClick={() => setSettingsOpen(true)}
              className={cn("h-6 text-[9px]",
                isPastel ? "bg-[#9B8B6B] hover:bg-[#8B7B5B]" :
                "bg-orange-600 hover:bg-orange-700")}
            >
              Add Ticker
            </Button>
          </div>
        ) : currentTicker ? (
          <>
            <div className="flex items-center justify-between mb-2">
              <div>
                <h4 className={cn("text-[10px] font-semibold",
                  isPastel ? "text-[#E8E9F0]" :
                  isDark ? "text-white" : "text-gray-900")}>{currentTicker.label}</h4>
                {currentData && (
                  <div className="flex items-center gap-2">
                    <span className={cn("text-[14px] font-bold",
                      isPastel ? "text-white" :
                      isDark ? "text-white" : "text-gray-900")}>
                      {formatPrice(currentData.price, currentTicker.symbol)}
                    </span>
                    <span className={cn("text-[10px]",
                      currentData.positive ? "text-green-500" : "text-red-500")}>
                      {currentData.positive ? '+' : ''}{currentData.change.toFixed(2)} ({currentData.positive ? '+' : ''}{currentData.changePercent.toFixed(2)}%)
                    </span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                  disabled={currentIndex === 0}
                  className={cn("p-0.5",
                    isPastel ? "text-[#7B7E9C] hover:text-[#A5A8C0] disabled:opacity-30" :
                    isDark ? "text-neutral-600 hover:text-neutral-400 disabled:opacity-30" : "text-gray-500 hover:text-gray-700 disabled:opacity-30")}
                >
                  <ChevronLeft className="w-3 h-3" />
                </button>
                <button
                  onClick={() => setCurrentIndex(Math.min(tickers.length - 1, currentIndex + 1))}
                  disabled={currentIndex === tickers.length - 1}
                  className={cn("p-0.5",
                    isPastel ? "text-[#7B7E9C] hover:text-[#A5A8C0] disabled:opacity-30" :
                    isDark ? "text-neutral-600 hover:text-neutral-400 disabled:opacity-30" : "text-gray-500 hover:text-gray-700 disabled:opacity-30")}
                >
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
            {currentData?.chartData && currentData.chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="85%">
                <LineChart data={currentData.chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={
                    isPastel ? '#4A4D6C' :
                    isDark ? '#1A1A1A' : '#e5e7eb'} />
                  <XAxis 
                    dataKey="time" 
                    tick={{ fontSize: 7, fill: isPastel ? '#9B9EBC' : isDark ? '#525252' : '#9ca3af' }}
                    stroke={isPastel ? '#4A4D6C' : isDark ? '#1F1F1F' : '#e5e7eb'}
                    tickLine={false}
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
                    stroke={currentData.positive ? '#16a34a' : '#dc2626'} 
                    strokeWidth={1.5}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className={cn("flex items-center justify-center h-full text-[9px]",
                isPastel ? "text-[#7B7E9C]" :
                isDark ? "text-neutral-700" : "text-gray-400")}>
                {isLoading ? 'Loading...' : 'No chart data'}
              </div>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}