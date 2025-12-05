import React from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function GistPanel({ gist, isLoading, sectorName }) {
  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-900/50 rounded-xl border border-slate-800/50 p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-6 h-6 rounded-md bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
          <Sparkles className="w-3.5 h-3.5 text-white" />
        </div>
        <h3 className="text-sm font-semibold text-slate-300">
          AI Intelligence Summary
        </h3>
        {sectorName && (
          <span className="ml-auto text-xs text-slate-500 bg-slate-800/50 px-2 py-1 rounded">
            {sectorName}
          </span>
        )}
      </div>
      
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
          <span className="ml-3 text-slate-400 text-sm">Generating intelligence summary...</span>
        </div>
      ) : gist ? (
        <div className="prose prose-sm prose-invert max-w-none">
          <ReactMarkdown
            components={{
              p: ({ children }) => <p className="text-slate-300 leading-relaxed text-sm mb-3 last:mb-0">{children}</p>,
              strong: ({ children }) => <strong className="text-white font-semibold">{children}</strong>,
              ul: ({ children }) => <ul className="text-slate-300 text-sm space-y-1 list-disc list-inside">{children}</ul>,
              li: ({ children }) => <li className="text-slate-300">{children}</li>,
            }}
          >
            {gist}
          </ReactMarkdown>
        </div>
      ) : (
        <p className="text-slate-500 text-sm italic">
          Select a sector and add RSS sources to generate an AI summary.
        </p>
      )}
    </div>
  );
}