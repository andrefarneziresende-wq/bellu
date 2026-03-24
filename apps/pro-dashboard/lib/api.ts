const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('pro_token') : null;

  const headers: Record<string, string> = {};
  if (options.body) headers['Content-Type'] = 'application/json';
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    });
  } catch {
    throw new ApiError('Network error - check your connection', 0, 'NETWORK_ERROR');
  }

  if (res.status === 401) {
    // Don't redirect if this IS the login request
    const isLoginRequest = path.includes('/auth/login');
    if (!isLoginRequest && typeof window !== 'undefined') {
      localStorage.removeItem('pro_token');
      localStorage.removeItem('pro_user');
      window.location.href = '/login';
    }
    // Try to extract the server message
    let message = 'Unauthorized';
    try {
      const json = await res.json();
      message = json.message || message;
    } catch { /* ignore parse error */ }
    throw new ApiError(message, 401, 'UNAUTHORIZED');
  }

  let json: Record<string, unknown>;
  try {
    json = await res.json();
  } catch {
    if (res.ok) return {} as T;
    throw new ApiError(`Server error (${res.status})`, res.status, 'PARSE_ERROR');
  }

  if (!json.success) {
    const message = (json.message || json.error || 'Unknown error') as string;
    const code = (json.code || '') as string;
    throw new ApiError(message, res.status, code);
  }

  return json as T;
}

/**
 * Upload a file to R2 via the API.
 */
export async function apiUpload(file: File, folder = 'portfolio'): Promise<string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('pro_token') : null;
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_URL}/api/upload?folder=${folder}`, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Upload failed' }));
    throw new ApiError(err.message || 'Upload failed', res.status);
  }

  const json = await res.json();
  return json.data?.url;
}
