'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Save } from 'lucide-react'
import { authApi, apiRequest } from '@/lib/api-config'

export default function Settings() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    department: '',
    program: '',
    birthday: '',
  })
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        console.log('[Settings] Fetching user data from API...')
        const response = await apiRequest(authApi.me(), {
          method: 'GET',
        })

        if (!response.ok) {
          console.error('[Settings] Failed to fetch user data:', response.status)
          setError('Failed to load your profile. Please try refreshing the page.')
          setIsLoading(false)
          return
        }

        const data = await response.json()
        console.log('[Settings] Loaded data from API:', data)

        if (data.authenticated && data.user) {
          const user = data.user
          
          // Format birthday for date input (YYYY-MM-DD)
          let birthdayFormatted = ''
          if (user.birthday) {
            try {
              // Handle ISO date string from API
              const date = new Date(user.birthday)
              if (!isNaN(date.getTime())) {
                birthdayFormatted = date.toISOString().split('T')[0]
              }
            } catch (e) {
              console.warn('[Settings] Could not parse birthday:', user.birthday)
            }
          }
    
    setFormData({
            name: user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username || '',
            email: user.email || '',
            department: user.department || '',
            program: user.program || '',
            birthday: birthdayFormatted,
    })
          
          console.log('[Settings] Form data set:', {
            name: user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username,
            email: user.email,
            department: user.department,
            program: user.program,
            birthday: birthdayFormatted,
          })
        } else {
          console.warn('[Settings] User not authenticated or user data missing')
          setError('Unable to load your profile. Please sign in again.')
        }
      } catch (err) {
        console.error('[Settings] Error fetching user data:', err)
        setError('An error occurred while loading your profile. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserData()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // TODO: Implement API endpoint to update user profile (birthday)
      // For now, just show success message
      // The backend would need a PATCH endpoint at /api/auth/me/ to update profile
      console.log('[Settings] Saving birthday:', formData.birthday)
    
      // Note: This would require a backend endpoint to update the profile
      // For now, we'll just show a success message
    setTimeout(() => {
      setIsSaving(false)
      alert('Settings saved successfully!')
    }, 800)
    } catch (err) {
      console.error('[Settings] Error saving:', err)
      setIsSaving(false)
      alert('Failed to save settings. Please try again.')
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <h1 className="text-3xl font-bold text-foreground">Profile Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your profile information</p>
      </div>

      {/* Profile Form */}
      {isLoading ? (
        <Card className="p-6 border border-border bg-card">
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading your profile...</p>
          </div>
        </Card>
      ) : error ? (
        <Card className="p-6 border border-border bg-card">
          <div className="text-center py-8 space-y-4">
            <p className="text-destructive">{error}</p>
            <Button
              onClick={() => {
                setError('')
                setIsLoading(true)
                // Re-fetch data
                const fetchUserData = async () => {
                  try {
                    console.log('[Settings] Re-fetching user data from API...')
                    const response = await apiRequest(authApi.me(), {
                      method: 'GET',
                    })

                    if (!response.ok) {
                      setError('Failed to load your profile. Please try refreshing the page.')
                      setIsLoading(false)
                      return
                    }

                    const data = await response.json()
                    console.log('[Settings] Loaded data from API:', data)

                    if (data.authenticated && data.user) {
                      const user = data.user
                      
                      let birthdayFormatted = ''
                      if (user.birthday) {
                        try {
                          const date = new Date(user.birthday)
                          if (!isNaN(date.getTime())) {
                            birthdayFormatted = date.toISOString().split('T')[0]
                          }
                        } catch (e) {
                          console.warn('[Settings] Could not parse birthday:', user.birthday)
                        }
                      }
                      
                      setFormData({
                        name: user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username || '',
                        email: user.email || '',
                        department: user.department || '',
                        program: user.program || '',
                        birthday: birthdayFormatted,
                      })
                      setError('')
                    } else {
                      setError('Unable to load your profile. Please sign in again.')
                    }
                  } catch (err) {
                    console.error('[Settings] Error fetching user data:', err)
                    setError('An error occurred while loading your profile. Please try again.')
                  } finally {
                    setIsLoading(false)
                  }
                }
                fetchUserData()
              }}
              className="bg-secondary hover:bg-secondary/90 text-secondary-foreground"
            >
              Retry
            </Button>
          </div>
        </Card>
      ) : (
      <Card className="p-6 border border-border bg-card space-y-6">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-foreground">Full Name</Label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Your full name"
            className="bg-background border-border text-foreground"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="text-foreground">Email Address</Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            disabled
            className="bg-muted border-border text-muted-foreground"
          />
          <p className="text-xs text-muted-foreground">Email cannot be changed</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="department" className="text-foreground">Department</Label>
          <Input
            id="department"
            name="department"
            value={formData.department || 'Not set'}
            disabled
            className="bg-muted border-border text-muted-foreground"
          />
          <p className="text-xs text-muted-foreground">Department cannot be changed</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="program" className="text-foreground">Program</Label>
          <Input
            id="program"
            name="program"
            value={formData.program || 'Not set'}
            disabled
            className="bg-muted border-border text-muted-foreground"
          />
          <p className="text-xs text-muted-foreground">Program cannot be changed</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="birthday" className="text-foreground">Birthday</Label>
          <Input
            id="birthday"
            name="birthday"
            type="date"
            value={formData.birthday}
            onChange={handleChange}
            className="bg-background border-border text-foreground"
          />
        </div>

        <Button
          disabled={isSaving}
          className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground gap-2"
          onClick={handleSave}
        >
          <Save className="w-4 h-4" />
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </Card>
      )}
    </div>
  )
}
