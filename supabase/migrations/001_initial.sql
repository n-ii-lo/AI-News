-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create news table
CREATE TABLE news (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    published_at TIMESTAMPTZ NOT NULL,
    source TEXT NOT NULL,
    title TEXT NOT NULL,
    summary TEXT,
    url TEXT UNIQUE NOT NULL,
    image_url TEXT,
    video_url TEXT,
    tickers TEXT[] DEFAULT '{}',
    status TEXT CHECK (status IN ('queued', 'processing', 'done', 'error')) DEFAULT 'queued',
    inserted_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create analyses table
CREATE TABLE analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    news_id UUID NOT NULL REFERENCES news(id) ON DELETE CASCADE,
    model TEXT NOT NULL DEFAULT 'gpt-4o',
    status TEXT CHECK (status IN ('queued', 'processing', 'done', 'error')) DEFAULT 'queued',
    verdict JSONB,
    error TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(news_id)
);

-- Create daily_aggregate table
CREATE TABLE daily_aggregate (
    id DATE PRIMARY KEY,
    computed_at TIMESTAMPTZ DEFAULT NOW(),
    summary JSONB NOT NULL
);

-- Create jobs table
CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT CHECK (type IN ('fetch_news', 'analyze_news', 'compute_aggregate')) NOT NULL,
    payload JSONB NOT NULL,
    status TEXT CHECK (status IN ('queued', 'processing', 'done', 'error')) DEFAULT 'queued',
    error TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_news_published_at ON news(published_at DESC);
CREATE INDEX idx_news_url ON news(url);
CREATE INDEX idx_news_status ON news(status);
CREATE INDEX idx_news_tickers ON news USING GIN(tickers);

CREATE INDEX idx_analyses_news_id ON analyses(news_id);
CREATE INDEX idx_analyses_status ON analyses(status);
CREATE INDEX idx_analyses_created_at ON analyses(created_at DESC);

CREATE INDEX idx_jobs_type_status ON jobs(type, status);
CREATE INDEX idx_jobs_created_at ON jobs(created_at DESC);

-- Enable Row Level Security
ALTER TABLE news ENABLE ROW LEVEL SECURITY;
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_aggregate ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (public read access)
CREATE POLICY "Public read access for news" ON news FOR SELECT USING (true);
CREATE POLICY "Public read access for analyses" ON analyses FOR SELECT USING (true);
CREATE POLICY "Public read access for daily_aggregate" ON daily_aggregate FOR SELECT USING (true);

-- Service role can do everything (for cron jobs)
CREATE POLICY "Service role full access for news" ON news FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access for analyses" ON analyses FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access for daily_aggregate" ON daily_aggregate FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access for jobs" ON jobs FOR ALL USING (auth.role() = 'service_role');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_analyses_updated_at BEFORE UPDATE ON analyses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
