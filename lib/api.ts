// Simple API utility for authenticated requests
export function getAuthHeaders() {
  const token = localStorage.getItem('auth-token')
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  }
}

export async function apiRequest(url: string, options: RequestInit = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...options.headers,
    },
  })

  if (response.status === 401) {
    // Token expired or invalid
    localStorage.removeItem('auth-token')
    window.location.href = '/login'
    return null
  }

  return response
}
