import { z } from "zod";

export const Direction = z.enum(["up", "down", "neutral"]);
export const CoinImpact = z.object({
  direction: Direction,
  confidence: z.number().min(0).max(1),
  rationale: z.string().min(1),
  horizon: z.literal("tomorrow")
});

export const VerdictPayload = z.object({
  newsUrl: z.string().url(),
  newsTitle: z.string(),
  coins: z.object({
    BTC: CoinImpact,
    SOL: CoinImpact,
    BNB: CoinImpact
  }),
  overall: z.object({
    bias: z.enum(["bullish", "bearish", "mixed", "neutral"]),
    confidence: z.number().min(0).max(1),
    rationale: z.string().min(1)
  }),
  why: z.object({
    quotes: z.array(z.object({
      text: z.string().min(1),
      reason: z.string().min(1),
      affects: z.array(z.enum(["BTC","SOL","BNB","market"]))
    })).min(1).max(3),
    keywords: z.array(z.string()).max(10)
  })
});

export type Direction = z.infer<typeof Direction>;
export type CoinImpact = z.infer<typeof CoinImpact>;
export type VerdictPayload = z.infer<typeof VerdictPayload>;

// Database types
export interface News {
  id: string;
  published_at: string;
  source: string;
  title: string;
  summary: string | null;
  url: string;
  image_url: string | null;
  video_url: string | null;
  tickers: string[];
  status: 'queued' | 'processing' | 'done' | 'error';
  inserted_at: string;
}

export interface Analysis {
  id: string;
  news_id: string;
  model: string;
  status: 'queued' | 'processing' | 'done' | 'error';
  verdict: VerdictPayload | null;
  error: string | null;
  created_at: string;
  updated_at: string;
}

export interface DailyAggregate {
  id: string; // date
  computed_at: string;
  summary: {
    BTC: { direction: Direction; confidence: number; score: number };
    SOL: { direction: Direction; confidence: number; score: number };
    BNB: { direction: Direction; confidence: number; score: number };
    overall: { bias: 'bullish' | 'bearish' | 'mixed' | 'neutral'; confidence: number };
  };
}

export interface Job {
  id: string;
  type: 'fetch_news' | 'analyze_news' | 'compute_aggregate';
  payload: Record<string, unknown>;
  status: 'queued' | 'processing' | 'done' | 'error';
  error: string | null;
  created_at: string;
  updated_at: string;
}

// Price data types
export interface PriceData {
  symbol: string;
  price: number;
  change24h: number;
  changePercent24h: number;
}

export interface CoinGeckoPrice {
  [key: string]: {
    usd: number;
    usd_24h_change: number;
  };
}
