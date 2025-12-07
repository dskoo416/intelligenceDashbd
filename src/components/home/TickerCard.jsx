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
    <div className={cn("rounded-lg border p-4 h-full", isDark ? "bg-neutral-900 border-neutral-800" : "bg-white border-gray-200")}>
      <div className="flex items-center justify-between mb-3">
        <h3 className={cn("font-semibold text-sm", isDark ? "text-white" : "text-gray-900")}>Market Ticker</h3>
        <Popover>
          <PopoverTrigger asChild>
            <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
              <Settings className={cn("w-3.5 h-3.5", isDark ? "text-neutral-400" : "text-gray-600")} />
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
      
      <div className="space-y-2">
        {tickers.map((ticker, idx) => (
          <div key={idx} className="flex items-center justify-between">
            <span className={cn("text-xs", isDark ? "text-neutral-400" : "text-gray-600")}>{ticker.label}</span>
            <div className="text-right">
              <div className={cn("text-sm font-medium", isDark ? "text-white" : "text-gray-900")}>{ticker.value}</div>
              <div className={cn("text-xs", ticker.positive ? (isDark ? "text-green-400" : "text-green-600") : (isDark ? "text-red-400" : "text-red-600"))}>
                {ticker.change}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}