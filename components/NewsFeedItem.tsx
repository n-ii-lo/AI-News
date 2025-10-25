'use client';

import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import Link from 'next/link';
import { ExternalLink, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfidenceBar } from '@/components/ConfidenceBar';
import { formatDate, extractDomain } from '@/lib/utils';
import type { News, Analysis } from '@/lib/schemas';

interface NewsFeedItemProps {
  news: News;
}

export function NewsFeedItem({ news }: NewsFeedItemProps) {
  const { data: analysis, isLoading, error } = useQuery({
    queryKey: ['analysis', news.id],
    queryFn: async () => {
      const response = await fetch(`/api/analyses?news_id=${news.id}`);
      if (!response.ok) throw new Error('Failed to fetch analysis');
      return response.json() as Promise<Analysis & { news: News }>;
    },
    refetchInterval: news.status === 'processing' ? 2000 : false,
  });

  const getStatusIcon = () => {
    if (news.status === 'processing') {
      return (
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
      );
    }
    if (news.status === 'done' && analysis?.verdict) {
      const overallBias = analysis.verdict.overall.bias;
      if (overallBias === 'bullish') return <ArrowUp className="w-4 h-4 text-green-500" />;
      if (overallBias === 'bearish') return <ArrowDown className="w-4 h-4 text-red-500" />;
      return <Minus className="w-4 h-4 text-gray-500" />;
    }
    if (news.status === 'error') {
      return <span className="text-red-500 text-xs font-bold">ERR</span>;
    }
    return <span className="text-amber-500 text-xs">⏳</span>;
  };

  const getStatusText = () => {
    if (news.status === 'processing') return 'Analyzing...';
    if (news.status === 'done') return 'Done';
    if (news.status === 'error') return 'Error';
    return 'Queued';
  };

  return (
    <div className="relative" data-news-item={news.id}>
      {/* Animated border for processing status */}
      {news.status === 'processing' && (
        <div className="absolute -inset-1 rounded-lg animate-analysis-border">
          <div className="absolute inset-0 rounded-lg bg-background"></div>
        </div>
      )}
      
      <Card className={`p-4 ${news.status === 'processing' ? 'relative z-10' : ''}`}>
        <div className="space-y-4">
          {/* News Content */}
          <div className="space-y-3">
            {/* Image */}
            {news.image_url && (
              <div className="relative w-full h-40 md:h-32 rounded-lg overflow-hidden">
                <Image
                  src={news.image_url}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
            )}

            {/* Title and Meta */}
            <div className="space-y-2">
              <h3 className="text-xl md:text-lg font-semibold leading-tight line-clamp-2">{news.title}</h3>
              
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Badge variant="secondary">{news.source}</Badge>
                <span>{formatDate(news.published_at)}</span>
                <span>{extractDomain(news.url)}</span>
              </div>

              {/* Summary */}
              {news.summary && (
                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                  {news.summary}
                </p>
              )}

              {/* Tickers */}
              {news.tickers.length > 0 && (
                <div className="flex gap-2">
                  {news.tickers.map((ticker: string) => (
                    <Badge key={ticker} variant="outline">
                      {ticker}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Status */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon()}
                  <span className="text-sm text-muted-foreground">{getStatusText()}</span>
                </div>
                
                <Button variant="outline" size="sm" asChild>
                  <Link href={news.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-3 h-3 mr-1" />
                    Read
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-border"></div>

          {/* AI Verdict Section */}
          {analysis?.verdict && analysis.status === 'done' ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold">AI Verdict</h4>
                <Badge 
                  variant="outline"
                  className={
                    analysis.verdict.overall.bias === 'bullish' ? 'text-green-500 border-green-500' :
                    analysis.verdict.overall.bias === 'bearish' ? 'text-red-500 border-red-500' :
                    analysis.verdict.overall.bias === 'mixed' ? 'text-yellow-500 border-yellow-500' :
                    'text-gray-500 border-gray-500'
                  }
                >
                  {analysis.verdict.overall.bias.toUpperCase()}
                </Badge>
              </div>
              
              <ConfidenceBar 
                confidence={analysis.verdict.overall.confidence}
                label="Overall Confidence"
              />
              
              <p className="text-xs text-muted-foreground">
                {analysis.verdict.overall.rationale}
              </p>

              {/* Per-coin predictions */}
              <div className="space-y-2">
                <h5 className="text-xs font-medium">Coin Predictions:</h5>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(analysis.verdict.coins).map(([coin, prediction]) => (
                    <div key={coin} className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <span className="text-xs font-medium">{coin}</span>
                        {prediction.direction === 'up' && <ArrowUp className="w-3 h-3 text-green-500" />}
                        {prediction.direction === 'down' && <ArrowDown className="w-3 h-3 text-red-500" />}
                        {prediction.direction === 'neutral' && <Minus className="w-3 h-3 text-gray-500" />}
                      </div>
                      <ConfidenceBar 
                        confidence={prediction.confidence}
                        label=""
                        className="h-1"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Why Block - compact version */}
              {analysis.verdict.why && (
                <details className="group">
                  <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                    Why this verdict? (click to expand)
                  </summary>
                  <div className="mt-2 space-y-2">
                    {analysis.verdict.why.quotes?.slice(0, 2).map((quote, index) => (
                      <div key={index} className="text-xs">
                        <p className="italic text-muted-foreground">"{quote.text}"</p>
                        <p className="text-muted-foreground mt-1">{quote.reason}</p>
                      </div>
                    ))}
                    {analysis.verdict.why.keywords && (
                      <div className="flex flex-wrap gap-1">
                        {analysis.verdict.why.keywords.slice(0, 5).map((keyword, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </details>
              )}
            </div>
          ) : isLoading ? (
            <div className="flex items-center justify-center space-x-2 py-4">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              <span className="text-sm text-muted-foreground">Loading analysis...</span>
            </div>
          ) : error ? (
            <div className="text-center text-red-500 py-4">
              <p className="text-sm font-medium">Failed to load analysis</p>
              <p className="text-xs text-muted-foreground mt-1">
                Try refreshing the page
              </p>
            </div>
          ) : news.status === 'processing' ? (
            <div className="flex items-center justify-center space-x-2 py-4">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              <span className="text-sm text-muted-foreground">AI is analyzing this news...</span>
            </div>
          ) : news.status === 'queued' ? (
            <div className="text-center text-muted-foreground py-4">
              <p className="text-sm">Waiting for AI analysis...</p>
            </div>
          ) : null}
        </div>
      </Card>
    </div>
  );
}
