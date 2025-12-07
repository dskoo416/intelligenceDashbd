import React from 'react';
import { cn } from "@/lib/utils";

export default function SectorHeatmapCard({ theme }) {
  const isDark = theme === 'dark';

  return (
    <div className={cn("rounded-lg border p-4 h-full flex items-center justify-center", isDark ? "bg-neutral-900 border-neutral-800" : "bg-white border-gray-200")}>
      <div className="text-center">
        <h3 className={cn("font-semibold text-sm mb-2", isDark ? "text-white" : "text-gray-900")}>Sector Heatmap</h3>
        <p className={cn("text-xs", isDark ? "text-neutral-500" : "text-gray-500")}>Coming Soon</p>
      </div>
    </div>
  );
}