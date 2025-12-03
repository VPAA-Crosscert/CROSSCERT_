/**
 * API Configuration for CROSSCERT
 * Uses dashes (kebab-case) for all route names
 */

// Base API URL - can be configured via environment variable
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

/**
 * API Route paths using dashes (kebab-case)
 */
export const API_ROUTES = {
  // Authentication endpoints
  auth: {
    login: '/api/auth/login/',
    logout: '/api/auth/logout/',
    csrfToken: '/api/auth/csrf-token/',
    me: '/api/auth/me/',
  },
  
  // General API routes
  events: '/api/events',
  registrations: '/api/registrations',
  checkIns: '/api/check-ins',
  evaluations: '/api/evaluations',
  certificates: '/api/certificates',
  
  // Admin API routes (using dashes)
  admin: {
    events: '/api/admin/events',
    participants: '/api/admin/participants',
    checkIns: '/api/admin/check-ins',
    evaluations: '/api/admin/evaluations',
    certificates: '/api/admin/certificates',
  },
} as const

/**
 * Get full API URL for a route
 */
export function getApiUrl(route: string): string {
  return `${API_BASE_URL}${route}`
}

/**
 * Admin API helper functions
 */
export const adminApi = {
  events: () => getApiUrl(API_ROUTES.admin.events),
  participants: () => getApiUrl(API_ROUTES.admin.participants),
  checkIns: () => getApiUrl(API_ROUTES.admin.checkIns),
  evaluations: () => getApiUrl(API_ROUTES.admin.evaluations),
  certificates: () => getApiUrl(API_ROUTES.admin.certificates),
  
  // Helper to get a specific event by ID
  eventById: (id: string | number) => `${getApiUrl(API_ROUTES.admin.events)}/${id}/`,
  
  // Helper to get a specific participant by ID
  participantById: (id: string | number) => `${getApiUrl(API_ROUTES.admin.participants)}/${id}/`,
  
  // Helper to get check-ins for an event
  checkInsByEvent: (eventId: string | number) => `${getApiUrl(API_ROUTES.admin.checkIns)}/?event=${eventId}`,
}

/**
 * General API helper functions
 */
export const api = {
  events: () => getApiUrl(API_ROUTES.events),
  registrations: () => getApiUrl(API_ROUTES.registrations),
  checkIns: () => getApiUrl(API_ROUTES.checkIns),
  evaluations: () => getApiUrl(API_ROUTES.evaluations),
  certificates: () => getApiUrl(API_ROUTES.certificates),
  participants: () => getApiUrl('/api/participants'),
  
  // Helper to get a specific resource by ID
  eventById: (id: string | number) => `${getApiUrl(API_ROUTES.events)}/${id}/`,
  registrationById: (id: string | number) => `${getApiUrl(API_ROUTES.registrations)}/${id}/`,
  certificateById: (id: string | number) => `${getApiUrl(API_ROUTES.certificates)}/${id}/`,
}

/**
 * Authentication API helpers
 */
export const authApi = {
  login: () => getApiUrl(API_ROUTES.auth.login),
  logout: () => getApiUrl(API_ROUTES.auth.logout),
  csrfToken: () => getApiUrl(API_ROUTES.auth.csrfToken),
  me: () => getApiUrl(API_ROUTES.auth.me),
}

/**
 * Get CSRF token from cookies
 */
export function getCsrfToken(): string {
  if (typeof document === 'undefined') return ''
  
  const cookies = document.cookie.split(';')
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=')
    if (name === 'csrftoken') {
      return decodeURIComponent(value)
    }
  }
  return ''
}

/**
 * Make an authenticated API request with CSRF token
 */
export async function apiRequest<T = any>(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const headers: Record<string, string> = {
    'Accept': 'application/json',
    ...(typeof options.headers === 'object' ? (options.headers as Record<string, string>) : {}),
  }

  // Add CSRF token for POST, PUT, DELETE requests
  const method = (options.method || 'GET').toUpperCase()
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    const csrfToken = getCsrfToken()
    if (csrfToken) {
      headers['X-CSRFToken'] = csrfToken
    }
  }

  // Add Content-Type if not already set and there's a body
  if (options.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json'
  }

  console.log(`[API] ${method} ${url}`, { headers })

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // Include cookies for session auth
  })

  return response
}

/**
 * Convenience methods using apiRequest
 */
export const apiCall = {
  get: (url: string) => apiRequest(url, { method: 'GET' }),
  post: (url: string, data?: any) => apiRequest(url, { method: 'POST', body: JSON.stringify(data) }),
  put: (url: string, data?: any) => apiRequest(url, { method: 'PUT', body: JSON.stringify(data) }),
  patch: (url: string, data?: any) => apiRequest(url, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (url: string) => apiRequest(url, { method: 'DELETE' }),
}

