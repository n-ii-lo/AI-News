import { createClient } from '@supabase/supabase-js';
import type { News, Analysis, DailyAggregate, Job } from './schemas';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Client for browser/client components
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Service client for server-side operations (cron jobs)
export const supabaseService = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : createClient(supabaseUrl, supabaseAnonKey); // Fallback to anon key for build

// Database helper functions
export const db = {
  // News operations
  async insertNews(newsData: Omit<News, 'id' | 'inserted_at'>) {
    const { data, error } = await supabaseService
      .from('news')
      .insert(newsData)
      .select()
      .single();
    
    if (error) throw error;
    return data as News;
  },

  async getNews(filters?: {
    cursor?: string;
    limit?: number;
    tickers?: string[];
    status?: string;
    search?: string;
  }) {
    let query = supabase
      .from('news')
      .select('*')
      .order('published_at', { ascending: false });

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    if (filters?.cursor) {
      query = query.lt('published_at', filters.cursor);
    }

    if (filters?.tickers && filters.tickers.length > 0) {
      query = query.overlaps('tickers', filters.tickers);
    }

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.search) {
      query = query.or(`title.ilike.%${filters.search}%,summary.ilike.%${filters.search}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as News[];
  },

  async getNewsById(id: string) {
    const { data, error } = await supabase
      .from('news')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data as News;
  },

  async updateNewsStatus(id: string, status: News['status']) {
    const { data, error } = await supabaseService
      .from('news')
      .update({ status })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as News;
  },

  // Analysis operations
  async insertAnalysis(analysisData: Omit<Analysis, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabaseService
      .from('analyses')
      .insert(analysisData)
      .select()
      .single();
    
    if (error) throw error;
    return data as Analysis;
  },

  async upsertAnalysis(analysisData: Omit<Analysis, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabaseService
      .from('analyses')
      .upsert(analysisData, { onConflict: 'news_id' })
      .select()
      .single();
    
    if (error) throw error;
    return data as Analysis;
  },

  async getAnalysisByNewsId(newsId: string) {
    const { data, error } = await supabase
      .from('analyses')
      .select(`
        *,
        news:news_id(*)
      `)
      .eq('news_id', newsId)
      .single();
    
    if (error) throw error;
    return data as Analysis & { news: News };
  },

  async getAnalysesByStatus(status: Analysis['status'], limit = 5) {
    const { data, error } = await supabaseService
      .from('analyses')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: true })
      .limit(limit);
    
    if (error) throw error;
    return data as Analysis[];
  },

  async updateAnalysisStatus(id: string, status: Analysis['status'], error?: string) {
    const updateData: Record<string, unknown> = { status };
    if (error) updateData.error = error;

    const { data, error: dbError } = await supabaseService
      .from('analyses')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (dbError) throw dbError;
    return data as Analysis;
  },

  // Daily aggregate operations
  async upsertDailyAggregate(date: string, summary: DailyAggregate['summary']) {
    const { data, error } = await supabaseService
      .from('daily_aggregate')
      .upsert({ id: date, summary }, { onConflict: 'id' })
      .select()
      .single();
    
    if (error) throw error;
    return data as DailyAggregate;
  },

  async getDailyAggregate(date?: string) {
    let query = supabase
      .from('daily_aggregate')
      .select('*')
      .order('id', { ascending: false })
      .limit(1);

    if (date) {
      query = query.eq('id', date);
    }

    const { data, error } = await query.single();
    if (error) throw error;
    return data as DailyAggregate;
  },

  // Job operations
  async createJob(type: Job['type'], payload: Record<string, unknown>) {
    const { data, error } = await supabaseService
      .from('jobs')
      .insert({ type, payload })
      .select()
      .single();
    
    if (error) throw error;
    return data as Job;
  },

  async getJobsByTypeAndStatus(type: Job['type'], status: Job['status'], limit = 5) {
    const { data, error } = await supabaseService
      .from('jobs')
      .select('*')
      .eq('type', type)
      .eq('status', status)
      .order('created_at', { ascending: true })
      .limit(limit);
    
    if (error) throw error;
    return data as Job[];
  },

  async updateJobStatus(id: string, status: Job['status'], error?: string) {
    const updateData: Record<string, unknown> = { status };
    if (error) updateData.error = error;

    const { data, error: dbError } = await supabaseService
      .from('jobs')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (dbError) throw dbError;
    return data as Job;
  }
};
