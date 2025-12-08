import React, { useState } from 'react';
import { cn } from "@/lib/utils";
import { Settings } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const DEFAULT_TICKERS = [
  { label: 'WTI', value: '$72.45', change: '+1.2%', positive: true },
  { label: 'Crude Oil Futures', value: '$71.30', change: '-0.8%', positive: false },
  { label: 'SOFR Rate', value: '4.35%', change: '+0.05%', positive: true },
  { label: 'USD/KRW', value: '1,305.50', change: '+2.3', positive: true },
  { label: 'USD/CNY', value: '7.25', change: '-0.01', positive: false },
];

export default function TickerCard({ theme }) {
  const isDark = theme === 'dark';
  const [tickers, setTickers] = useState(DEFAULT_TICKERS);
  const [editingTickers, setEditingTickers] = useState(DEFAULT_TICKERS);

  return (
    <div className={cn("h-full flex flex-col", isDark ? "bg-[#131313] border border-[#1F1F1F]" : "bg-white border border-gray-300")}>
      <div className={cn("flex items-center justify-between px-2 py-1 border-b", isDark ? "border-[#1F1F1F]" : "border-gray-300")}>
        <h3 className={cn("text-[10px] font-semibold uppercase tracking-wider", isDark ? "text-neutral-500" : "text-gray-700")}>MARKET TICKER</h3>
        <Popover>
          <PopoverTrigger asChild>
            <Button size="sm" variant="ghost" className="h-4 w-4 p-0">
              <Settings className={cn("w-2.5 h-2.5", isDark ? "text-neutral-600" : "text-gray-500")} />
            </Button>
          </PopoverTrigger>
          <PopoverContent className={cn("w-80", isDark ? "bg-neutral-800 border-neutral-700" : "bg-white")} align="end">
            <div className="space-y-3">
              <h4 className={cn("font-medium text-xs", isDark ? "text-white" : "text-gray-900")}>Configure Tickers</h4>
              {editingTickers.map((ticker, idx) => (
                <div key={idx}>
                  <Label className={cn("text-xs", isDark ? "text-neutral-400" : "text-gray-600")}>Ticker {idx + 1}</Label>
                  <Input
                    value={ticker.label}
                    onChange={(e) => {
                      const newTickers = [...editingTickers];
                      newTickers[idx] = { ...newTickers[idx], label: e.target.value };
                      setEditingTickers(newTickers);
                    }}
                    className={cn("mt-1 h-7 text-xs", isDark ? "bg-neutral-900 border-neutral-700 text-white" : "")}
                  />
                </div>
              ))}
              <Button 
                size="sm" 
                onClick={() => setTickers(editingTickers)}
                className="w-full text-xs"
              >
                Save Changes
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
      
      <div className="flex-1 flex flex-col justify-center px-2 py-1 space-y-0">
        {tickers.map((ticker, idx) => (
          <div key={idx} className={cn("flex items-center justify-between py-0.5 leading-none")}>
            <span className={cn("text-[10px] font-medium", isDark ? "text-neutral-600" : "text-gray-600")}>{ticker.label}</span>
            <div className="flex items-center gap-2">
              <span className={cn("text-[10px] font-mono tabular-nums", isDark ? "text-neutral-400" : "text-gray-900")}>{ticker.value}</span>
              <span className={cn("text-[10px] font-mono flex items-center gap-0.5 min-w-[45px] justify-end", ticker.positive ? (isDark ? "text-green-500" : "text-green-600") : (isDark ? "text-red-500" : "text-red-600"))}>
                {ticker.positive ? '▲' : '▼'}{ticker.change.replace(/[+-]/g, '')}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}