'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { VerdictPayload } from '@/lib/schemas';

interface WhyBlockProps {
  verdict: VerdictPayload;
  className?: string;
}

export function WhyBlock({ verdict, className }: WhyBlockProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={`space-y-3 ${className}`}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 p-0 h-auto font-medium"
      >
        Why this verdict?
        {isExpanded ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
      </Button>

      {isExpanded && (
        <div className="space-y-4 animate-in slide-in-from-top-2 duration-200">
          {/* Quotes */}
          <div className="space-y-3">
            {verdict.why.quotes.map((quote, index) => (
              <div key={index} className="p-3 bg-muted/50 rounded-lg">
                <blockquote className="text-sm italic text-muted-foreground mb-2">
                  &ldquo;{quote.text}&rdquo;
                </blockquote>
                <div className="text-xs">
                  <span className="font-medium">Reason:</span> {quote.reason}
                </div>
                <div className="flex gap-1 mt-2">
                  {quote.affects.map(asset => (
                    <Badge key={asset} variant="secondary" className="text-xs">
                      {asset}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Keywords */}
          <div>
            <div className="text-xs font-medium text-muted-foreground mb-2">
              Key terms:
            </div>
            <div className="flex flex-wrap gap-1">
              {verdict.why.keywords.map(keyword => (
                <Badge key={keyword} variant="outline" className="text-xs">
                  {keyword}
                </Badge>
              ))}
            </div>
          </div>

          {/* Disclaimer */}
          <div className="text-xs text-muted-foreground italic">
            Not financial advice. Modelled from headlines.
          </div>
        </div>
      )}
    </div>
  );
}
