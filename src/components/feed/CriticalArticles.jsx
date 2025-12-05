import React from 'react';
import { AlertTriangle, ExternalLink, Clock, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

export default function CriticalArticles({ articles, isLoading }) {
  return (
    <div className="bg-slate-900/50 rounded-xl border border-amber-500/20 p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-6 h-6 rounded-md bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
          <AlertTriangle className="w-3.5 h-3.5 text-white" />
        </div>
        <h3 className="text-sm font-semibold text-amber-200">
          Critical Intelligence
        </h3>
        <span className="ml-auto text-xs text-amber-500/60 bg-amber-500/10 px-2 py-1 rounded">
          AI Curated
        </span>
      </div>
      
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
          <span className="ml-3 text-slate-400 text-sm">Analyzing critical articles...</span>
        </div>
      ) : articles.length > 0 ? (
        <div className="grid gap-3">
          {articles.map((article, idx) => (
            <a
              key={idx}
              href={article.link}
              target="_blank"
              rel="noopener noreferrer"
              className="group block p-4 bg-slate-800/50 rounded-lg border border-slate-700/50 hover:border-amber-500/30 transition-all hover:bg-slate-800"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-white group-hover:text-amber-200 transition-colors line-clamp-2">
                    {article.title}
                  </h4>
                  <p className="text-xs text-slate-400 mt-1.5 line-clamp-2">
                    {article.description}
                  </p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-slate-500">{article.source}</span>
                    {article.pubDate && (
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        <Clock className="w-3 h-3" />
                        {format(new Date(article.pubDate), 'MMM d, h:mm a')}
                      </span>
                    )}
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition-colors flex-shrink-0" />
              </div>
              {article.reasoning && (
                <div className="mt-3 pt-3 border-t border-slate-700/50">
                  <p className="text-xs text-amber-400/80 italic">
                    "{article.reasoning}"
                  </p>
                </div>
              )}
            </a>
          ))}
        </div>
      ) : (
        <p className="text-slate-500 text-sm text-center py-6">
          No critical articles identified yet.
        </p>
      )}
    </div>
  );
}