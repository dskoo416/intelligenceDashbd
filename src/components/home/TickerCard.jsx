import React from 'react';
import { cn } from "@/lib/utils";

export default function TickerCard({ theme }) {
  const isDark = theme === 'dark';

  const tickers = [
    { label: 'WTI', value: '$72.45', change: '+1.2%', positive: true },
    { label: 'Crude Oil Futures', value: '$71.30', change: '-0.8%', positive: false },
    { label: 'SOFR Rate', value: '4.35%', change: '+0.05%', positive: true },
    { label: 'USD/KRW', value: '1,305.50', change: '+2.3', positive: true },
    { label: 'USD/CNY', value: '7.25', change: '-0.01', positive: false },
  ];

  return (
    <div className={cn("rounded-lg border p-4 h-full", isDark ? "bg-neutral-900 border-neutral-800" : "bg-white border-gray-200")}>
      <h3 className={cn("font-semibold text-sm mb-3", isDark ? "text-white" : "text-gray-900")}>Market Ticker</h3>
      
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