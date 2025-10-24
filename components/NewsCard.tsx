'use client';

import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate, truncateText, extractDomain } from '@/lib/utils';
import { ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import type { News } from '@/lib/schemas';

interface NewsCardProps {
  news: News;
  onClick: () => void;
  isSelected?: boolean;
  isActive?: boolean;
}

export function NewsCard({ news, onClick, isSelected, isActive }: NewsCardProps) {
  const getStatusIcon = () => {
    switch (news.status) {
      case 'queued':
        return (
          <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" 
               aria-label="Queued for analysis" />
        );
      case 'processing':
        return (
          <Loader2 className="w-3 h-3 animate-spin text-blue-500" 
                   aria-label="Analyzing..." />
        );
      case 'done':
        return (
          <ArrowRight className="w-3 h-3 text-green-500" 
                      aria-label="Analysis complete" />
        );
      case 'error':
        return (
          <AlertCircle className="w-3 h-3 text-red-500" 
                       aria-label="Analysis failed" />
        );
      default:
        return null;
    }
  };

  const getStatusText = () => {
    switch (news.status) {
      case 'queued': return 'Queued';
      case 'processing': return 'Analyzing...';
      case 'done': return 'Done';
      case 'error': return 'ERR';
      default: return '';
    }
  };

  return (
    <Card 
      className={`
        p-4 cursor-pointer transition-all duration-200 hover:bg-accent/50 rounded-none border-l-0 border-r-0 border-t-0
        ${isSelected ? 'bg-accent border-primary' : ''}
        ${isActive ? 'ring-2 ring-primary' : ''}
      `}
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label={`${news.title} - ${news.source}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <div className="flex gap-3">
        {/* Thumbnail */}
        <div className="flex-shrink-0 w-16 h-16 relative">
          {news.image_url ? (
            <Image
              src={news.image_url}
              alt=""
              fill
              className="object-cover rounded-none"
              sizes="64px"
            />
          ) : (
            <div className="w-full h-full bg-muted rounded-none flex items-center justify-center">
              <span className="text-xs text-muted-foreground">
                {extractDomain(news.url).substring(0, 2).toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-medium text-sm leading-tight line-clamp-2">
              {truncateText(news.title, 80)}
            </h3>
            <div className="flex items-center gap-1 flex-shrink-0">
              {getStatusIcon()}
              <span className="text-xs text-muted-foreground">
                {getStatusText()}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="secondary" className="text-xs px-1 py-0">
              {news.source}
            </Badge>
            <span>{formatDate(news.published_at)}</span>
            {news.tickers.length > 0 && (
              <div className="flex gap-1">
                {news.tickers.map(ticker => (
                  <Badge key={ticker} variant="outline" className="text-xs px-1 py-0">
                    {ticker}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
