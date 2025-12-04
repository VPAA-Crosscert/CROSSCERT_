/**
 * Utility functions for authentication and localStorage management
 */

/**
 * Clear all localStorage data related to the application
 */
export function clearAllLocalStorage(): void {
  if (typeof window === 'undefined') return

  // List of all localStorage keys used in the application
  const keysToRemove = [
    'userRole',
    'userEmail',
    'userId',
    'isStaff',
    'userDepartment',
    'userProgram',
    'userName',
    'userBirthday',
    'crosscert_local_events',
    'events',
    'bookmarkedEvents',
    'registrations',
    'evaluations',
  ]

  console.log('[Logout] Clearing localStorage...')
  keysToRemove.forEach((key) => {
    try {
      localStorage.removeItem(key)
      console.log(`[Logout] Removed: ${key}`)
    } catch (err) {
      console.warn(`[Logout] Failed to remove ${key}:`, err)
    }
  })

  // Clear any remaining localStorage items that might have been added
  try {
    const remainingKeys: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key) {
        remainingKeys.push(key)
      }
    }
    
    // Remove any remaining keys that start with common prefixes
    remainingKeys.forEach((key) => {
      if (
        key.startsWith('crosscert_') ||
        key.startsWith('user') ||
        key === 'events' ||
        key === 'bookmarkedEvents' ||
        key === 'registrations' ||
        key === 'evaluations'
      ) {
        try {
          localStorage.removeItem(key)
          console.log(`[Logout] Removed additional key: ${key}`)
        } catch (err) {
          console.warn(`[Logout] Failed to remove additional key ${key}:`, err)
        }
      }
    })
  } catch (err) {
    console.warn('[Logout] Error clearing additional localStorage items:', err)
  }

  console.log('[Logout] ✅ localStorage cleared successfully')
}

/**
 * Logout function that clears localStorage and optionally calls API logout
 */
export async function performLogout(apiLogout: boolean = true): Promise<void> {
  console.log('[Logout] Starting logout process...')
  
  // Clear all localStorage data
  clearAllLocalStorage()

  // Optionally call API logout endpoint
  if (apiLogout) {
    try {
      const { authApi, apiCall } = await import('@/lib/api-config')
      const response = await apiCall.post(authApi.logout(), {})
      console.log('[Logout] API logout response:', response.status, response.statusText)
    } catch (err) {
      console.warn('[Logout] API logout failed (non-critical):', err)
      // Don't throw - localStorage is already cleared
    }
  }

  console.log('[Logout] ✅ Logout complete')
}

/**
 * Alias for performLogout for backward compatibility
 */
export const handleLogout = performLogout

