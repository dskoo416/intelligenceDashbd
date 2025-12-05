import React from 'react';
import { Button } from "@/components/ui/button";
import { Settings, Download, Newspaper, RefreshCw } from 'lucide-react';

export default function TopBar({ onOpenSettings, onExport, onRefresh, isRefreshing }) {
  return (
    <header className="h-14 bg-slate-950 border-b border-slate-800/50 flex items-center justify-between px-6">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
          <Newspaper className="w-4 h-4 text-white" />
        </div>
        <h1 className="text-lg font-semibold text-white tracking-tight">
          Intelligence Feed
        </h1>
      </div>
      
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="text-slate-400 hover:text-white hover:bg-slate-800"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onExport}
          className="text-slate-400 hover:text-white hover:bg-slate-800"
        >
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>
        
        <div className="w-px h-6 bg-slate-800 mx-2" />
        
        <Button
          variant="ghost"
          size="icon"
          onClick={onOpenSettings}
          className="text-slate-400 hover:text-white hover:bg-slate-800"
        >
          <Settings className="w-5 h-5" />
        </Button>
      </div>
    </header>
  );
}