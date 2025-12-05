import React from 'react';
import { ExternalLink, Clock, Rss, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

export default function NewsFeed({ articles, isLoading }) {
  return (
    <div className="bg-slate-900/30 rounded-xl border border-slate-800/50 p-5 flex-1 overflow-hidden flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-6 h-6 rounded-md bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center">
          <Rss className="w-3.5 h-3.5 text-white" />
        </div>
        <h3 className="text-sm font-semibold text-slate-300">
          Latest News
        </h3>
        <span className="ml-auto text-xs text-slate-500">
          {articles.length} articles
        </span>
      </div>
      
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
          <span className="ml-3 text-slate-400 text-sm">Fetching news feed...</span>
        </div>
      ) : articles.length > 0 ? (
        <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
          {articles.map((article, idx) => (
            <a
              key={idx}
              href={article.link}
              target="_blank"
              rel="noopener noreferrer"
              className="group block p-3 bg-slate-800/30 rounded-lg border border-slate-800/50 hover:border-slate-700 transition-all hover:bg-slate-800/50"
            >
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-slate-200 group-hover:text-white transition-colors line-clamp-1">
                    {article.title}
                  </h4>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-slate-500">{article.source}</span>
                    {article.pubDate && (
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        <Clock className="w-3 h-3" />
                        {format(new Date(article.pubDate), 'MMM d, h:mm a')}
                      </span>
                    )}
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors flex-shrink-0" />
              </div>
            </a>
          ))}
        </div>
      ) : (
        <p className="text-slate-500 text-sm text-center py-12">
          No articles available. Add RSS sources in settings.
        </p>
      )}
    </div>
  );
}