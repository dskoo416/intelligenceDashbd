import React from 'react';
import { cn } from "@/lib/utils";

export default function Home({ sidebarOpen }) {
  return (
    <div className="h-full flex bg-neutral-950 flex-1">
      {sidebarOpen && (
        <div className="w-52 flex-shrink-0 border-r border-neutral-800">
          {/* Placeholder for home sidebar - can be customized later */}
        </div>
      )}
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Welcome to Intelligence Feed</h1>
          <p className="text-neutral-400">Your home page - coming soon</p>
        </div>
      </div>
    </div>
  );
}