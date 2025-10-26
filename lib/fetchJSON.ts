export interface FetchJSONOptions extends RequestInit {
  timeout?: number;
}

export class FetchError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public url: string,
    public data?: unknown
  ) {
    super(`HTTP ${status}: ${statusText}`);
    this.name = 'FetchError';
  }
}

export async function fetchJSON<T>(
  input: RequestInfo,
  init?: FetchJSONOptions
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = init?.timeout
    ? setTimeout(() => controller.abort(), init.timeout)
    : undefined;

  try {
    const res = await fetch(input, {
      ...init,
      signal: init?.signal || controller.signal,
      headers: {
        accept: 'application/json',
        ...(init?.headers || {}),
      },
    });

    if (timeoutId) clearTimeout(timeoutId);

    if (!res.ok) {
      let data: unknown;
      try {
        data = await res.json();
      } catch {
        // ignore
      }
      throw new FetchError(res.status, res.statusText, res.url, data);
    }

    return res.json() as Promise<T>;
  } catch (error) {
    if (error instanceof FetchError) throw error;
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw error;
  }
}

