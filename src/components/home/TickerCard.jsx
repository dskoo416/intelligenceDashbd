import React, { useState, useEffect } from 'react';
import { cn } from "@/lib/utils";
import { Settings, RefreshCw } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const DEFAULT_TICKER_CONFIG = [
  { label: 'WTI', symbol: 'CL=F' },
  { label: 'Brent', symbol: 'BZ=F' },
  { label: 'USD/KRW', symbol: 'KRW=X' },
  { label: 'USD/CNY', symbol: 'CNY=X' },
  { label: 'Natural Gas', symbol: 'NG=F' },
];

const fetchQuote = async (symbol) => {
  try {
    const corsProxy = 'https://api.allorigins.win/raw?url=';
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=5d`;
    const response = await fetch(corsProxy + encodeURIComponent(url));
    const data = await response.json();
    
    const result = data?.chart?.result?.[0];
    if (!result) return null;
    
    const meta = result.meta;
    const quote = result.indicators?.quote?.[0];
    
    const currentPrice = meta.regularMarketPrice;
    const previousClose = meta.previousClose || meta.chartPreviousClose;
    
    if (!currentPrice || !previousClose) return null;
    
    const change = currentPrice - previousClose;
    const changePercent = (change / previousClose) * 100;
    
    return {
      price: currentPrice,
      change: change,
      changePercent: changePercent,
      positive: change >= 0
    };
  } catch (error) {
    console.error(`Error fetching ${symbol}:`, error);
    return null;
  }
};

export default function TickerCard({ theme }) {
  const isDark = theme === 'dark';
  const [tickerConfig, setTickerConfig] = useState(DEFAULT_TICKER_CONFIG);
  const [editingConfig, setEditingConfig] = useState(DEFAULT_TICKER_CONFIG);
  const [tickerData, setTickerData] = useState({});
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    refreshTickers();
    const interval = setInterval(refreshTickers, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [tickerConfig]);

  const refreshTickers = async () => {
    setIsRefreshing(true);
    const newData = {};
    
    for (const config of tickerConfig) {
      const quote = await fetchQuote(config.symbol);
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

  return (
    <div className={cn("h-full flex flex-col rounded", isDark ? "bg-[#131313] border border-[#1F1F1F] shadow-sm" : "bg-white border border-gray-300 shadow-sm")}>
      <div className={cn("flex items-center justify-between px-2 py-1 border-b", isDark ? "border-[#1F1F1F]" : "border-gray-300")}>
        <h3 className={cn("text-[10px] font-semibold uppercase tracking-wider", isDark ? "text-neutral-500" : "text-gray-700")}>MARKET TICKER</h3>
        <div className="flex items-center gap-1">
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={refreshTickers}
            disabled={isRefreshing}
            className="h-4 w-4 p-0"
          >
            <RefreshCw className={cn("w-2.5 h-2.5", isRefreshing && "animate-spin", isDark ? "text-neutral-600" : "text-gray-500")} />
          </Button>
          <Popover>
          <PopoverTrigger asChild>
            <Button size="sm" variant="ghost" className="h-4 w-4 p-0">
              <Settings className={cn("w-2.5 h-2.5", isDark ? "text-neutral-600" : "text-gray-500")} />
            </Button>
          </PopoverTrigger>
          <PopoverContent className={cn("w-96", isDark ? "bg-neutral-800 border-neutral-700" : "bg-white")} align="end">
            <div className="space-y-3">
              <h4 className={cn("font-medium text-xs", isDark ? "text-white" : "text-gray-900")}>Configure Tickers</h4>
              {editingConfig.map((config, idx) => (
                <div key={idx} className="flex gap-2">
                  <div className="flex-1">
                    <Label className={cn("text-xs", isDark ? "text-neutral-400" : "text-gray-600")}>Label</Label>
                    <Input
                      value={config.label}
                      onChange={(e) => {
                        const newConfig = [...editingConfig];
                        newConfig[idx] = { ...newConfig[idx], label: e.target.value };
                        setEditingConfig(newConfig);
                      }}
                      className={cn("mt-1 h-7 text-xs", isDark ? "bg-neutral-900 border-neutral-700 text-white" : "")}
                    />
                  </div>
                  <div className="flex-1">
                    <Label className={cn("text-xs", isDark ? "text-neutral-400" : "text-gray-600")}>Symbol</Label>
                    <Input
                      value={config.symbol}
                      onChange={(e) => {
                        const newConfig = [...editingConfig];
                        newConfig[idx] = { ...newConfig[idx], symbol: e.target.value };
                        setEditingConfig(newConfig);
                      }}
                      placeholder="e.g. CL=F"
                      className={cn("mt-1 h-7 text-xs", isDark ? "bg-neutral-900 border-neutral-700 text-white" : "")}
                    />
                  </div>
                  <div className="flex items-end gap-1">
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => {
                        if (idx > 0) {
                          const newConfig = [...editingConfig];
                          [newConfig[idx], newConfig[idx-1]] = [newConfig[idx-1], newConfig[idx]];
                          setEditingConfig(newConfig);
                        }
                      }}
                      disabled={idx === 0}
                      className="h-7 w-7 p-0 text-xs"
                    >
                      ↑
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => {
                        if (idx < editingConfig.length - 1) {
                          const newConfig = [...editingConfig];
                          [newConfig[idx], newConfig[idx+1]] = [newConfig[idx+1], newConfig[idx]];
                          setEditingConfig(newConfig);
                        }
                      }}
                      disabled={idx === editingConfig.length - 1}
                      className="h-7 w-7 p-0 text-xs"
                    >
                      ↓
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => {
                        const newConfig = editingConfig.filter((_, i) => i !== idx);
                        setEditingConfig(newConfig);
                      }}
                      className="h-7 w-7 p-0 text-xs text-red-500"
                    >
                      ×
                    </Button>
                  </div>
                </div>
              ))}
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => {
                  setEditingConfig([...editingConfig, { label: 'New Ticker', symbol: 'CL=F' }]);
                }}
                className="w-full text-xs"
              >
                + Add Ticker
              </Button>
              <Button 
                size="sm" 
                onClick={() => setTickerConfig(editingConfig)}
                className="w-full text-xs"
              >
                Save Changes
              </Button>
            </div>
          </PopoverContent>
        </div>
        </Popover>
      </div>
      
      <div className="flex-1 flex flex-col justify-center px-2 py-1 space-y-0">
        {tickerConfig.map((config, idx) => {
          const data = tickerData[config.symbol];
          return (
            <div key={idx} className={cn("flex items-center justify-between py-0.5 leading-none")}>
              <span className={cn("text-[10px] font-medium", isDark ? "text-neutral-600" : "text-gray-600")}>{config.label}</span>
              <div className="flex items-center gap-2">
                {data ? (
                  <>
                    <span className={cn("text-[10px] font-mono tabular-nums", isDark ? "text-neutral-400" : "text-gray-900")}>
                      {formatPrice(data.price, config.symbol)}
                    </span>
                    <span className={cn("text-[10px] font-mono flex items-center gap-0.5 min-w-[45px] justify-end", data.positive ? (isDark ? "text-[#2D8659]" : "text-green-600") : (isDark ? "text-[#8B3A3A]" : "text-red-600"))}>
                      {data.positive ? '▲' : '▼'}{Math.abs(data.changePercent).toFixed(2)}%
                    </span>
                  </>
                ) : (
                  <span className={cn("text-[10px] font-mono", isDark ? "text-neutral-700" : "text-gray-400")}>N/A</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}