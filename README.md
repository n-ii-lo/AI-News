# Crypto News Oracle

AI-powered crypto news analysis and market predictions for BTC, SOL, and BNB. Built with Next.js 14, Supabase, and OpenAI GPT-4o.

## Features

- **Real-time News Feed**: Crypto news from CryptoPanic API with automatic ticker extraction
- **AI Analysis**: GPT-4o powered analysis with structured JSON output and Zod validation
- **Market Predictions**: Tomorrow's price direction predictions for BTC, SOL, BNB
- **Bloomberg-style UI**: Dark theme, information-dense interface with real-time ticker
- **Aggregate Insights**: Daily market sentiment aggregation with confidence scoring
- **Responsive Design**: Desktop 3-pane layout, mobile tabs
- **Keyboard Navigation**: Arrow keys for navigation, Enter to select

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **Database**: Supabase (PostgreSQL with RLS)
- **AI**: OpenAI GPT-4o with JSON Schema validation
- **State Management**: TanStack Query (React Query)
- **Deployment**: Vercel with Cron Jobs
- **News API**: CryptoPanic (crypto-focused news)
- **Price API**: CoinGecko (free tier)

## Prerequisites

- Node.js 18+ and npm/pnpm
- Supabase account
- OpenAI API key
- CryptoPanic API key (optional, falls back to mock data)

## Quick Start

1. **Clone and install dependencies**:
   ```bash
   git clone <repository-url>
   cd ai-news
   npm install
   ```

2. **Set up Supabase**:
   - Create a new project at [supabase.com](https://supabase.com)
   - Go to Settings → API to get your project URL and anon key
   - Go to Settings → API → Service Role to get your service role key
   - Run the SQL migration in `supabase/migrations/001_initial.sql` in the SQL Editor

3. **Configure environment variables**:
   ```bash
   cp .env.example .env.local
   ```
   
   Fill in your `.env.local`:
   ```env
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   
   # OpenAI
   OPENAI_API_KEY=your_openai_api_key
   
   # CryptoPanic (optional)
   CRYPTOPANIC_API_KEY=your_cryptopanic_key
   
   # Security
   CRON_AUTH_TOKEN=your_random_token_here
   
   # App
   APP_URL=http://localhost:3000
   TZ=Europe/Kyiv
   ```

4. **Start development server**:
   ```bash
   npm run dev
   ```

5. **Test cron jobs** (optional):
   ```bash
   # Test fetch news
   curl -X POST http://localhost:3000/api/cron/fetch-news \
     -H "Authorization: Bearer your_cron_auth_token"
   
   # Test analyze
   curl -X POST http://localhost:3000/api/cron/analyze \
     -H "Authorization: Bearer your_cron_auth_token"
   
   # Test aggregate
   curl -X POST http://localhost:3000/api/cron/aggregate \
     -H "Authorization: Bearer your_cron_auth_token"
   ```

## Supabase Setup (Detailed)

### 1. Create Project
- Go to [supabase.com](https://supabase.com) and create a new project
- Choose a region close to your users
- Set a strong database password

### 2. Get API Keys
- **Project URL**: Found in Settings → API → Project URL
- **Anon Key**: Found in Settings → API → Project API keys → anon public
- **Service Role Key**: Found in Settings → API → Project API keys → service_role (keep this secret!)

### 3. Run Migration
- Go to SQL Editor in your Supabase dashboard
- Copy the contents of `supabase/migrations/001_initial.sql`
- Paste and run the SQL script
- This creates all necessary tables, indexes, and RLS policies

### 4. Verify Setup
- Check that tables are created: `news`, `analyses`, `daily_aggregate`, `jobs`
- Verify RLS is enabled on all tables
- Test that you can read from tables (anon key should work)

## API Keys Setup

### OpenAI API Key
1. Go to [platform.openai.com](https://platform.openai.com)
2. Create an API key in API Keys section
3. Add billing information (required for GPT-4o)
4. Copy the key to your `.env.local`

### CryptoPanic API Key (Optional)
1. Go to [cryptopanic.com](https://cryptopanic.com)
2. Sign up for a free account
3. Get your API key from the dashboard
4. Free tier: 500 requests/day
5. If not provided, the app uses mock data

## Deployment (Vercel)

### 1. Deploy to Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Follow the prompts to link your project
```

### 2. Configure Environment Variables
In Vercel dashboard → Settings → Environment Variables, add all variables from your `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `CRYPTOPANIC_API_KEY` (optional)
- `CRON_AUTH_TOKEN`
- `APP_URL` (your Vercel domain)

### 3. Enable Cron Jobs
Cron jobs are automatically enabled via `vercel.json`:
- **Fetch News**: Every 10 minutes
- **Analyze News**: Every minute
- **Aggregate**: Every 30 minutes

### 4. Test Production
```bash
# Test cron jobs in production
curl -X POST https://your-app.vercel.app/api/cron/fetch-news \
  -H "Authorization: Bearer your_cron_auth_token"
```

## Project Structure

```
/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout with TickerBar
│   ├── page.tsx          # Redirects to /news
│   ├── news/             # News pages
│   │   ├── layout.tsx    # 3-pane layout
│   │   ├── page.tsx      # News selection page
│   │   └── [id]/page.tsx # Individual news analysis
│   └── api/              # API routes
│       ├── news/         # Public news API
│       ├── analyses/     # Analysis API
│       ├── aggregate/    # Aggregate API
│       └── cron/         # Cron job endpoints
├── components/           # React components
│   ├── ui/              # shadcn/ui components
│   ├── TickerBar.tsx    # Real-time price ticker
│   ├── NewsList.tsx     # News feed with keyboard nav
│   ├── NewsCard.tsx     # Individual news item
│   ├── VerdictPills.tsx # AI verdict display
│   ├── AggregatePanel.tsx # Tomorrow's predictions
│   └── ...              # Other components
├── lib/                 # Utility libraries
│   ├── supabase.ts     # Database client & helpers
│   ├── ai.ts           # OpenAI integration
│   ├── news.ts         # News providers & price API
│   ├── aggregate.ts    # Aggregation logic
│   ├── schemas.ts      # Zod schemas & types
│   └── utils.ts        # Utility functions
├── supabase/
│   └── migrations/     # Database migrations
└── vercel.json         # Vercel cron configuration
```

## API Endpoints

### Public APIs
- `GET /api/news` - News feed with pagination and filters
- `GET /api/analyses?news_id=uuid` - Get analysis for specific news
- `GET /api/aggregate/tomorrow` - Get tomorrow's market predictions
- `GET /api/why/[news_id]` - Get "why" quotes and keywords
- `GET /api/backtest?days=30` - Mock backtest data

### Cron APIs (Protected)
- `POST /api/cron/fetch-news` - Fetch new news items
- `POST /api/cron/analyze` - Analyze queued news items
- `POST /api/cron/aggregate` - Compute daily aggregates

## Troubleshooting

### Common Issues

**"Failed to fetch news"**
- Check CryptoPanic API key (or use mock data)
- Verify network connectivity
- Check API rate limits

**"Analysis failed"**
- Verify OpenAI API key and billing
- Check GPT-4o model availability
- Review error logs in Supabase

**"Database connection failed"**
- Verify Supabase URL and keys
- Check RLS policies
- Ensure migration was run successfully

**Cron jobs not running**
- Verify `CRON_AUTH_TOKEN` matches in Vercel env vars
- Check Vercel cron logs
- Test endpoints manually with curl

### Debug Mode
Set `NODE_ENV=development` to see detailed error messages and logs.

### Logs
- **Vercel**: Check Function logs in Vercel dashboard
- **Supabase**: Check logs in Supabase dashboard → Logs
- **Browser**: Check Network tab for API errors

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Disclaimer

This application is for educational and informational purposes only. The AI predictions are not financial advice and should not be used for trading decisions. Always do your own research and consult with financial professionals before making investment decisions.