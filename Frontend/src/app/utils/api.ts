// Base API helper for authenticated requests
export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem("token");
  
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }

  // endpoint should start with a slash, e.g. "/v1/rentals"
  const url = `/api${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorData = null;
    try {
      errorData = await response.json();
    } catch (e) {
      // Ignored
    }
    throw new Error(errorData?.message || `API Error: ${response.status}`);
  }

  const text = await response.text();
  return text ? JSON.parse(text) : null;
}
