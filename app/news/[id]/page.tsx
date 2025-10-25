'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import Link from 'next/link';
import { ExternalLink, ArrowLeft } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { VerdictPills } from '@/components/VerdictPills';
import { ConfidenceBar } from '@/components/ConfidenceBar';
import { WhyBlock } from '@/components/WhyBlock';
import { Skeletons } from '@/components/Skeletons';
import { ErrorState } from '@/components/ErrorState';
import { formatDate, extractDomain } from '@/lib/utils';
import type { Analysis, News } from '@/lib/schemas';

interface NewsDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function NewsDetailPage({ params }: NewsDetailPageProps) {
  const [id, setId] = React.useState<string | null>(null);
  
  React.useEffect(() => {
    params.then(({ id }) => setId(id));
  }, [params]);
  
  const { data: analysis, isLoading, error, refetch } = useQuery({
    queryKey: ['analysis', id],
    queryFn: async () => {
      const response = await fetch(`/api/analyses?news_id=${id}`);
      if (!response.ok) throw new Error('Failed to fetch analysis');
      return response.json() as Promise<Analysis & { news: News }>;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="p-4">
        <Skeletons />
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="p-4">
        <ErrorState 
          message="Failed to load analysis"
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const { news, verdict } = analysis;

  return (
    <div className="p-4 space-y-4">
      {/* Back button */}
      <Button variant="ghost" size="sm" asChild>
        <Link href="/news" className="flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to feed
        </Link>
      </Button>

      {/* News Header */}
      <Card className="p-4">
        <div className="space-y-3">
          {/* Image */}
          {news.image_url && (
            <div className="relative w-full h-48 rounded-none overflow-hidden">
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
            <h1 className="text-2xl font-bold leading-tight">{news.title}</h1>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <Badge variant="secondary">{news.source}</Badge>
              <span>{formatDate(news.published_at)}</span>
              <span>{extractDomain(news.url)}</span>
            </div>

            {/* Summary */}
            {news.summary && (
              <p className="text-muted-foreground leading-relaxed">
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

            {/* Read Original Link */}
            <Button variant="outline" size="sm" asChild>
              <Link href={news.url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 mr-2" />
                Read original
              </Link>
            </Button>
          </div>
        </div>
      </Card>

      {/* Analysis Status */}
      {analysis.status === 'processing' && (
        <Card className="p-4">
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            <span className="text-sm text-muted-foreground">Analyzing...</span>
          </div>
        </Card>
      )}

      {analysis.status === 'error' && (
        <Card className="p-4">
          <div className="text-center text-red-500">
            <p className="font-medium">Analysis failed</p>
            <p className="text-sm text-muted-foreground mt-1">
              {analysis.error || 'Unknown error occurred'}
            </p>
          </div>
        </Card>
      )}

      {/* Verdict */}
      {verdict && analysis.status === 'done' && (
        <div className="space-y-4">
          {/* Overall Verdict */}
          <Card className="p-4">
            <div className="space-y-3">
              <h2 className="text-lg font-semibold">AI Verdict</h2>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Overall Bias:</span>
                  <Badge 
                    variant="outline"
                    className={
                      verdict.overall.bias === 'bullish' ? 'text-green-500 border-green-500' :
                      verdict.overall.bias === 'bearish' ? 'text-red-500 border-red-500' :
                      verdict.overall.bias === 'mixed' ? 'text-yellow-500 border-yellow-500' :
                      'text-gray-500 border-gray-500'
                    }
                  >
                    {verdict.overall.bias.toUpperCase()}
                  </Badge>
                </div>
                
                <ConfidenceBar 
                  confidence={verdict.overall.confidence}
                  label="Overall Confidence"
                />
                
                <p className="text-sm text-muted-foreground">
                  {verdict.overall.rationale}
                </p>
              </div>
            </div>
          </Card>

          {/* Per-Coin Verdicts */}
          <Card className="p-4">
            <div className="space-y-3">
              <h2 className="text-lg font-semibold">Coin Impact</h2>
              
              <VerdictPills verdict={verdict} />
              
              <div className="space-y-3">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">BTC</h3>
                  <ConfidenceBar 
                    confidence={verdict.coins.BTC.confidence}
                    label={verdict.coins.BTC.direction}
                  />
                  <p className="text-xs text-muted-foreground">
                    {verdict.coins.BTC.rationale}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">SOL</h3>
                  <ConfidenceBar 
                    confidence={verdict.coins.SOL.confidence}
                    label={verdict.coins.SOL.direction}
                  />
                  <p className="text-xs text-muted-foreground">
                    {verdict.coins.SOL.rationale}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">BNB</h3>
                  <ConfidenceBar 
                    confidence={verdict.coins.BNB.confidence}
                    label={verdict.coins.BNB.direction}
                  />
                  <p className="text-xs text-muted-foreground">
                    {verdict.coins.BNB.rationale}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Why Block */}
          <WhyBlock verdict={verdict} />
        </div>
      )}
    </div>
  );
}
