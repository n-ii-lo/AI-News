import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/news/route';
import { NextRequest } from 'next/server';
import { db } from '@/lib/supabase';

// Mock the database
vi.mock('@/lib/supabase', () => ({
  db: {
    getNews: vi.fn(),
  },
}));

const mockDb = vi.mocked(db);

describe('/api/news route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return news data with ETag', async () => {
    const mockNews = [
      {
        id: '1',
        published_at: '2024-01-01T10:00:00Z',
        source: 'Test Source',
        title: 'Test News',
        summary: 'Test summary',
        url: 'https://test.com',
        image_url: null,
        video_url: null,
        tickers: ['BTC'],
        status: 'done' as const,
        inserted_at: '2024-01-01T10:00:00Z',
      },
    ];

    mockDb.getNews.mockResolvedValue(mockNews);

    const request = new NextRequest('http://localhost:3000/api/news?limit=10');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data).toEqual(mockNews);
    expect(response.headers.get('ETag')).toBeTruthy();
    expect(response.headers.get('Last-Modified')).toBeTruthy();
    expect(response.headers.get('Cache-Control')).toBe('no-cache, must-revalidate');
  });

  it('should return 304 when If-None-Match matches ETag', async () => {
    const mockNews = [
      {
        id: '1',
        published_at: '2024-01-01T10:00:00Z',
        source: 'Test Source',
        title: 'Test News',
        summary: 'Test summary',
        url: 'https://test.com',
        image_url: null,
        video_url: null,
        tickers: ['BTC'],
        status: 'done' as const,
        inserted_at: '2024-01-01T10:00:00Z',
      },
    ];

    mockDb.getNews.mockResolvedValue(mockNews);

    // First request to get ETag
    const firstRequest = new NextRequest('http://localhost:3000/api/news');
    const firstResponse = await GET(firstRequest);
    const etag = firstResponse.headers.get('ETag');

    // Second request with If-None-Match header
    const secondRequest = new NextRequest('http://localhost:3000/api/news', {
      headers: {
        'If-None-Match': etag!,
      },
    });
    const secondResponse = await GET(secondRequest);

    expect(secondResponse.status).toBe(304);
    expect(await secondResponse.text()).toBe('');
  });

  it('should use after parameter for delta requests', async () => {
    const mockNews = [
      {
        id: '2',
        published_at: '2024-01-01T11:00:00Z',
        source: 'Test Source',
        title: 'Newer News',
        summary: 'Newer summary',
        url: 'https://test.com/2',
        image_url: null,
        video_url: null,
        tickers: ['SOL'],
        status: 'done' as const,
        inserted_at: '2024-01-01T11:00:00Z',
      },
    ];

    mockDb.getNews.mockResolvedValue(mockNews);

    const request = new NextRequest('http://localhost:3000/api/news?after=2024-01-01T10:00:00Z');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data).toEqual(mockNews);
    expect(mockDb.getNews).toHaveBeenCalledWith({
      cursor: '2024-01-01T10:00:00Z',
      limit: 20,
      tickers: undefined,
      status: undefined,
      search: undefined,
    });
  });

  it('should handle filters correctly', async () => {
    const mockNews = [
      {
        id: '1',
        published_at: '2024-01-01T10:00:00Z',
        source: 'Test Source',
        title: 'Test News',
        summary: 'Test summary',
        url: 'https://test.com',
        image_url: null,
        video_url: null,
        tickers: ['BTC'],
        status: 'done' as const,
        inserted_at: '2024-01-01T10:00:00Z',
      },
    ];

    mockDb.getNews.mockResolvedValue(mockNews);

    const request = new NextRequest('http://localhost:3000/api/news?tickers=BTC,SOL&status=done&q=test&limit=5');
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(mockDb.getNews).toHaveBeenCalledWith({
      cursor: undefined,
      limit: 5,
      tickers: ['BTC', 'SOL'],
      status: 'done',
      search: 'test',
    });
  });

  it('should not fetch total count for delta requests', async () => {
    const mockNews = [
      {
        id: '1',
        published_at: '2024-01-01T10:00:00Z',
        source: 'Test Source',
        title: 'Test News',
        summary: 'Test summary',
        url: 'https://test.com',
        image_url: null,
        video_url: null,
        tickers: ['BTC'],
        status: 'done' as const,
        inserted_at: '2024-01-01T10:00:00Z',
      },
    ];

    mockDb.getNews.mockResolvedValue(mockNews);

    const request = new NextRequest('http://localhost:3000/api/news?after=2024-01-01T09:00:00Z');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.total).toBe(0); // Should be 0 for delta requests
    expect(mockDb.getNews).toHaveBeenCalledTimes(1); // Only called once for the main query
  });

  it('should handle errors gracefully', async () => {
    mockDb.getNews.mockRejectedValue(new Error('Database error'));

    const request = new NextRequest('http://localhost:3000/api/news');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal server error');
    expect(data.details).toBe('Database error');
  });

  it('should generate consistent ETag for same data', async () => {
    const mockNews = [
      {
        id: '1',
        published_at: '2024-01-01T10:00:00Z',
        source: 'Test Source',
        title: 'Test News',
        summary: 'Test summary',
        url: 'https://test.com',
        image_url: null,
        video_url: null,
        tickers: ['BTC'],
        status: 'done' as const,
        inserted_at: '2024-01-01T10:00:00Z',
      },
    ];

    mockDb.getNews.mockResolvedValue(mockNews);

    const request1 = new NextRequest('http://localhost:3000/api/news');
    const request2 = new NextRequest('http://localhost:3000/api/news');
    
    const response1 = await GET(request1);
    const response2 = await GET(request2);

    const etag1 = response1.headers.get('ETag');
    const etag2 = response2.headers.get('ETag');

    expect(etag1).toBe(etag2);
  });
});
