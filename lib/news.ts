import type { News, PriceData, CoinGeckoPrice } from './schemas';

// Extract tickers from text using regex
export function extractTickers(text: string): string[] {
  const tickerRegex = /\b(BTC|ETH|SOL|BNB)\b/gi;
  const matches = text.match(tickerRegex);
  return matches ? [...new Set(matches.map(m => m.toUpperCase()))] : [];
}

// News provider interface
export interface NewsProvider {
  name: string;
  fetchNews(): Promise<NewsItem[]>;
}

export interface NewsItem {
  title: string;
  summary?: string;
  url: string;
  source: string;
  published_at: string;
  image_url?: string;
  video_url?: string;
}

// Mock news provider for development
export class MockNewsProvider implements NewsProvider {
  name = 'Mock Provider';

  async fetchNews(): Promise<NewsItem[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    return [
      {
        title: "Bitcoin ETF Approval Expected This Week, Analysts Predict 20% Price Surge",
        summary: "Major financial institutions are optimistic about Bitcoin ETF approval, with Goldman Sachs predicting significant market impact and increased institutional adoption.",
        url: "https://example.com/bitcoin-etf-approval",
        source: "CryptoNews",
        published_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        image_url: "https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=400"
      },
      {
        title: "Solana Network Upgrade Improves Transaction Speed by 40%",
        summary: "The latest Solana network upgrade introduces new consensus mechanisms that significantly improve transaction throughput and reduce fees.",
        url: "https://example.com/solana-upgrade",
        source: "SolanaNews",
        published_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
        image_url: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400"
      },
      {
        title: "Binance Announces New BNB Token Burn Program",
        summary: "Binance will burn 2 million BNB tokens this quarter, reducing total supply and potentially increasing token value through deflationary pressure.",
        url: "https://example.com/binance-bnb-burn",
        source: "BinanceNews",
        published_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
        image_url: "https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=400"
      },
      {
        title: "Ethereum Layer 2 Solutions See Record Transaction Volume",
        summary: "Arbitrum and Optimism networks processed over 1 million transactions yesterday, indicating growing adoption of Ethereum scaling solutions.",
        url: "https://example.com/ethereum-l2-volume",
        source: "EthereumNews",
        published_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), // 8 hours ago
        image_url: "https://images.unsplash.com/photo-1639322537504-6427a16b0a28?w=400"
      },
      {
        title: "Regulatory Clarity Improves for Crypto Markets in Europe",
        summary: "New EU regulations provide clearer guidelines for cryptocurrency trading, potentially boosting institutional confidence and market stability.",
        url: "https://example.com/eu-crypto-regulations",
        source: "RegulatoryNews",
        published_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
        image_url: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400"
      }
    ];
  }
}

// CryptoPanic API provider (for production)
export class CryptoPanicProvider implements NewsProvider {
  name = 'CryptoPanic';
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async fetchNews(): Promise<NewsItem[]> {
    const url = `https://cryptopanic.com/api/v1/posts/?auth_token=${this.apiKey}&currencies=BTC,SOL,BNB&kind=news&public=true`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`CryptoPanic API error: ${response.status}`);
    }

    const data = await response.json();
    
    return data.results.map((item: any) => ({
      title: item.title as string,
      summary: (item.metadata?.description as string) || '',
      url: item.url as string,
      source: (item.source?.title as string) || 'CryptoPanic',
      published_at: item.published_at as string,
      image_url: item.metadata?.image_url as string
    }));
  }
}

// Normalize news item to database format
export function normalizeNewsItem(item: NewsItem): Omit<News, 'id' | 'inserted_at'> {
  const tickers = extractTickers(`${item.title} ${item.summary || ''}`);
  
  return {
    published_at: item.published_at,
    source: item.source,
    title: item.title,
    summary: item.summary || null,
    url: item.url,
    image_url: item.image_url || null,
    video_url: item.video_url || null,
    tickers,
    status: 'queued' as const
  };
}

// Get current provider based on environment
export function getNewsProvider(): NewsProvider {
  const apiKey = process.env.CRYPTOPANIC_API_KEY;
  
  // Force mock provider for now to avoid API issues
  if (false && apiKey) {
    return new CryptoPanicProvider(apiKey as string);
  }
  
  return new MockNewsProvider();
}

// Price fetching from CoinGecko
export async function fetchPrices(): Promise<PriceData[]> {
  try {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,solana,binancecoin&vs_currencies=usd&include_24hr_change=true'
    );
    
    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data: CoinGeckoPrice = await response.json();
    
    return [
      {
        symbol: 'BTC',
        price: data.bitcoin?.usd || 0,
        change24h: data.bitcoin?.usd_24h_change || 0,
        changePercent24h: data.bitcoin?.usd_24h_change || 0
      },
      {
        symbol: 'SOL',
        price: data.solana?.usd || 0,
        change24h: data.solana?.usd_24h_change || 0,
        changePercent24h: data.solana?.usd_24h_change || 0
      },
      {
        symbol: 'BNB',
        price: data.binancecoin?.usd || 0,
        change24h: data.binancecoin?.usd_24h_change || 0,
        changePercent24h: data.binancecoin?.usd_24h_change || 0
      }
    ];
  } catch (error) {
    console.error('Failed to fetch prices:', error);
    
    // Return mock data on error
    return [
      { symbol: 'BTC', price: 45000, change24h: 1200, changePercent24h: 2.74 },
      { symbol: 'SOL', price: 95, change24h: -2.5, changePercent24h: -2.56 },
      { symbol: 'BNB', price: 320, change24h: 8.5, changePercent24h: 2.73 }
    ];
  }
}
