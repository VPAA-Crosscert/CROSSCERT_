export interface Event {
  id: number | string
  name?: string  // Frontend property
  title?: string // Backend property (maps to name)
  description: string
  date: string
  startTime?: string
  start_time?: string // Backend property
  endTime?: string
  end_time?: string // Backend property
  timezone: string
  speakers: string
  venue?: string
  location?: string // Backend property (maps to venue)
  coverImage?: string
  cover_image?: string // Backend property
  capacity?: number | string
  requireApproval?: boolean
  isPaidEvent?: boolean
  ticketPrice?: number
  isPublic?: boolean
  theme?: number
  participants?: number
  attended?: number
  evaluated?: number
  certificates?: number
  createdAt?: string
  category?: string
  department?: string
  status?: 'Upcoming' | 'Ongoing' | 'Completed' | 'draft' | 'scheduled' | 'live' | 'completed'
  code_prefix?: string // Backend property for event code prefix
}

export interface RegistrationStatus {
  eventId: string | number
  status: 'registered' | 'checked-in' | 'evaluated' | 'none'
}

export const getStoredEvents = (): Event[] => {
  if (typeof window === 'undefined') return []
  // Prefer the new key used by the admin local-create flow, fall back to legacy 'events'
  const storedNew = localStorage.getItem('crosscert_local_events')
  if (storedNew) return JSON.parse(storedNew)
  const stored = localStorage.getItem('events')
  return stored ? JSON.parse(stored) : []
}

export const getEventById = (id: string | number): Event | null => {
  const events = getStoredEvents()
  return events.find(e => e.id === id || e.id === parseInt(id as string)) || null
}

// Cache for user department to avoid repeated API calls
let userDepartmentCache: string | null = null
let userDepartmentCacheTime: number = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export const getDepartmentFromUser = (): string => {
  if (typeof window === 'undefined') return ''
  
  // Return cached value if still valid
  if (userDepartmentCache && Date.now() - userDepartmentCacheTime < CACHE_DURATION) {
    return userDepartmentCache
  }
  
  // Try to fetch from API (async, but return empty for now)
  // Components should use fetchUserDepartment() instead
  return ''
}

export const fetchUserDepartment = async (): Promise<string> => {
  if (typeof window === 'undefined') return ''
  
  // Return cached value if still valid
  if (userDepartmentCache && Date.now() - userDepartmentCacheTime < CACHE_DURATION) {
    return userDepartmentCache
  }
  
  try {
    const { authApi, apiRequest } = await import('@/lib/api-config')
    const response = await apiRequest(authApi.me(), {
      method: 'GET',
    })
    
    if (response.ok) {
      const data = await response.json()
      if (data.authenticated && data.user && data.user.department) {
        userDepartmentCache = data.user.department
        userDepartmentCacheTime = Date.now()
        return data.user.department
      }
    }
  } catch (err) {
    console.error('[event-context] Error fetching user department:', err)
  }
  
  return ''
}

export const clearUserDepartmentCache = (): void => {
  userDepartmentCache = null
  userDepartmentCacheTime = 0
}

export const getRegistrationStatus = (eventId: string | number): RegistrationStatus['status'] => {
  if (typeof window === 'undefined') return 'none'
  const registrations = localStorage.getItem('registrations')
  if (registrations) {
    const reg = JSON.parse(registrations)
    return reg[eventId] || 'none'
  }
  return 'none'
}

export const updateRegistrationStatus = (eventId: string | number, status: RegistrationStatus['status']) => {
  if (typeof window === 'undefined') return
  const registrations = JSON.parse(localStorage.getItem('registrations') || '{}')
  registrations[eventId] = status
  localStorage.setItem('registrations', JSON.stringify(registrations))
}
