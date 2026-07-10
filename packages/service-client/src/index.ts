/**
 * Typed HTTP client stub for future service-to-service calls.
 */

export type ServiceClientOptions = {
  baseUrl: string;
  headers?: Record<string, string>;
  timeoutMs?: number;
};

export type ServiceClient = {
  baseUrl: string;
  get: <T = unknown>(path: string, init?: RequestInit) => Promise<T>;
  post: <T = unknown>(path: string, body?: unknown, init?: RequestInit) => Promise<T>;
};

function joinUrl(baseUrl: string, path: string) {
  const base = baseUrl.replace(/\/$/, "");
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${base}${suffix}`;
}

export function createServiceClient(
  options: ServiceClientOptions,
): ServiceClient {
  const timeoutMs = options.timeoutMs ?? 15_000;
  const defaultHeaders = {
    Accept: "application/json",
    ...options.headers,
  };

  async function request<T>(
    path: string,
    init?: RequestInit,
  ): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(joinUrl(options.baseUrl, path), {
        ...init,
        headers: {
          ...defaultHeaders,
          ...init?.headers,
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new Error(
          `Service request failed (${response.status}): ${text || response.statusText}`,
        );
      }

      if (response.status === 204) {
        return undefined as T;
      }

      return (await response.json()) as T;
    } finally {
      clearTimeout(timer);
    }
  }

  return {
    baseUrl: options.baseUrl,
    get: (path, init) => request(path, { ...init, method: "GET" }),
    post: (path, body, init) =>
      request(path, {
        ...init,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...init?.headers,
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      }),
  };
}
