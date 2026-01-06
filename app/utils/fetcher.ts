/* eslint-disable @typescript-eslint/no-explicit-any */

export class FetchError extends Error {
  info?: any;
  status?: number;

  constructor(message: string, status?: number, info?: any) {
    super(message);
    this.name = 'FetchError';
    this.status = status;
    this.info = info;
    // Set the prototype explicitly to allow instanceof to work correctly
    Object.setPrototypeOf(this, FetchError.prototype);
  }
}

export const fetcher = async (url: string, options?: RequestInit) => {
  const headers: Record<string, string> = { ...(options?.headers as Record<string, string> || {}) };

  // Do not set Content-Type if body is FormData, browser will set it with boundary
  if (!(options?.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(url, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let errorInfo;
    try {
      errorInfo = await res.json();
    } catch (_) { // Variable is intentionally unused
      errorInfo = await res.text();
    }
    throw new FetchError(
      errorInfo?.message || (typeof errorInfo === 'string' ? errorInfo : 'An error occurred while fetching the data.'),
      res.status,
      errorInfo
    );
  }

  if (res.status === 204) {
    return null;
  }
  
  return res.json();
};
