const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

export function apiFetch(url: string, options?: RequestInit) {
  return fetch(`${API_URL}${url}`, {
    ...options,
    credentials: 'include',
  });
}

export { API_URL };
