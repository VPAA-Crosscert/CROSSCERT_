'use client'

import { useRouter, useParams } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, MapPin, Calendar, Users, Bookmark } from 'lucide-react'
import { useState, useEffect } from 'react'
import { getEventById, getRegistrationStatus, updateRegistrationStatus, fetchUserDepartment } from '@/lib/event-context'
import { Event } from '@/lib/event-context'
import { api, apiCall, getAuthenticatedUserEmail } from '@/lib/api-config'
import { QRCodeSVG } from 'qrcode.react'

const DEPARTMENT_ABBR = {
  'College of Criminal Justice Education': 'CCJE',
  'College of Engineering and Technology': 'CET',
  'College of Hospitality & Tourism Management': 'CHATME',
  'College of Arts & Sciences': 'HUSOCOM',
  'College of Maritime Education': 'COME',
  'School of Business & Management': 'SBME',
  'School of Teacher Education': 'STE',
}

// Add a reverse mapping function
const getDepartmentAbbr = (fullName: string): string | null => {
  if (!fullName) return null
  // Check if it's already an abbreviation
  if (Object.values(DEPARTMENT_ABBR).includes(fullName as any)) {
    return fullName
  }
  // Map full name to abbreviation
  return DEPARTMENT_ABBR[fullName as keyof typeof DEPARTMENT_ABBR] || null
}

export default function ParticipantEventDetail() {
  const router = useRouter()
  const params = useParams()
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [registrationStatus, setRegistrationStatus] = useState<'registered' | 'checked-in' | 'evaluated' | 'none'>('none')
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [buttonLabel, setButtonLabel] = useState('Register Now')
  const [registrationData, setRegistrationData] = useState<{
    qr_code?: string
    qr_code_value?: string
  } | null>(null)
  const [hasAccess, setHasAccess] = useState(true)
  const [userDepartment, setUserDepartment] = useState('')
  const [eventStatus, setEventStatus] = useState<string>('')

  useEffect(() => {
    const fetchEvent = async () => {
      const eventId = params.id as string
      console.log('[Participant Event Detail] Looking for event with ID:', eventId)
      
      // First try to fetch from API
      try {
        const eventUrl = api.eventById(eventId)
        console.log('[Participant Event Detail] Fetching from API:', eventUrl)
        
        const response = await apiCall.get(eventUrl)
        console.log('[Participant Event Detail] API response status:', response.status, response.statusText)
        
        if (response.ok) {
          const apiEvent = await response.json()
          console.log('[Participant Event Detail] ✅ Event found in API!')
          console.log('[Participant Event Detail] Event title:', apiEvent.title)
          
          // Check if event is public
          if (apiEvent.is_public === false) {
            console.warn('[Participant Event Detail] Event is not public')
            setEvent(null)
            setLoading(false)
            return
          }
          
          setEvent(apiEvent as Event)
          setEventStatus(apiEvent.status || '')
          
          // Check access control - fetch user department from API
          const userDept = await fetchUserDepartment()
          setUserDepartment(userDept)
          
          const canAccess = (() => {
            const eventCategory = apiEvent.category || 'HCDC'
            const eventDept = apiEvent.department
            
            // HCDC events are accessible to everyone
            if (eventCategory === 'HCDC') return true
            
            // If no department restriction, allow access
            if (!eventDept) return true
            
            // Get user's department
            if (!userDept) {
              console.log('[Event Detail] User department not set, access denied')
              return false
            }
            
            // Convert both to abbreviations for comparison
            const userDeptAbbr = getDepartmentAbbr(userDept)
            const eventDeptAbbr = getDepartmentAbbr(eventDept)
            
            console.log('[Event Detail] Access check:', {
              eventCategory,
              eventDept,
              eventDeptAbbr,
              userDept,
              userDeptAbbr,
              match: userDeptAbbr === eventDeptAbbr
            })
            
            // Match if abbreviations match
            return userDeptAbbr !== null && eventDeptAbbr !== null && userDeptAbbr === eventDeptAbbr
          })()
          
          setHasAccess(canAccess)
          console.log('[Event Detail] Has access:', canAccess)
          
          // Load bookmark status from localStorage
          const storedBookmarks = localStorage.getItem('bookmarkedEvents')
          if (storedBookmarks) {
            const bookmarks = new Set(JSON.parse(storedBookmarks))
            setIsBookmarked(bookmarks.has(eventId))
          }
          
          // Determine registration status from backend (authoritative) using current user email
          let derivedStatus: 'registered' | 'checked-in' | 'evaluated' | 'none' = 'none'
          try {
            const userEmail = await getAuthenticatedUserEmail()
            if (userEmail) {
              const regsUrl = `${api.registrations()}?event=${eventId}&email=${encodeURIComponent(userEmail)}`
              const regsRes = await apiCall.get(regsUrl)
              if (regsRes.ok) {
                const regsData = await regsRes.json()
                const regs = Array.isArray(regsData) ? regsData : (regsData.results || regsData.data || [])
                if (regs.length > 0) {
                  const reg = regs[0]
                  if (reg.has_evaluated) {
                    derivedStatus = 'evaluated'
                  } else if (reg.is_present) {
                    derivedStatus = 'checked-in'
                  } else {
                    derivedStatus = 'registered'
                  }
                }
              }
            }
          } catch (regErr) {
            console.warn('[Participant Event Detail] Could not fetch registration for status:', regErr)
          }

          // Fallback to local stored status if backend didn't give us anything
          if (derivedStatus === 'none') {
            derivedStatus = getRegistrationStatus(eventId)
          }

          setRegistrationStatus(derivedStatus)
          
          const normalizedStatus = (apiEvent.status || '').toLowerCase()
          if (derivedStatus === 'registered') {
            // Participant is registered; evaluation is allowed only after event is completed
            setButtonLabel(normalizedStatus === 'completed' ? 'Complete Evaluation' : 'Evaluation Pending')
          } else if (derivedStatus === 'checked-in') {
            // Checked-in by admin – evaluation still gated by event completion
            setButtonLabel(normalizedStatus === 'completed' ? 'Complete Evaluation' : 'Evaluation Pending')
          } else if (derivedStatus === 'evaluated') {
            setButtonLabel('View Certificate')
          } else {
            setButtonLabel(canAccess ? 'Register Now' : 'Restricted')
          }

          setLoading(false)
          return
        } else {
          console.warn('[Participant Event Detail] ❌ API request failed, status:', response.status)
        }
      } catch (apiErr) {
        console.error('[Participant Event Detail] ❌ API fetch error:', apiErr)
      }
      
      // Fallback to localStorage
      console.log('[Participant Event Detail] Falling back to localStorage search')
      const foundEvent = getEventById(eventId)
      setEvent(foundEvent)
      setEventStatus(foundEvent?.status || '')
      
      // Check access control for localStorage events too
      const userDept = await fetchUserDepartment()
      setUserDepartment(userDept)
      
      if (foundEvent) {
        const canAccess = (() => {
          const eventCategory = foundEvent.category || 'HCDC'
          const eventDept = foundEvent.department
          
          if (eventCategory === 'HCDC') return true
          if (!eventDept) return true
          if (!userDept) return false
          
          const userDeptAbbr = getDepartmentAbbr(userDept)
          const eventDeptAbbr = getDepartmentAbbr(eventDept)
          
          return userDeptAbbr !== null && eventDeptAbbr !== null && userDeptAbbr === eventDeptAbbr
        })()
        
        setHasAccess(canAccess)
      }
      
      // Load bookmark status from localStorage
      const storedBookmarks = localStorage.getItem('bookmarkedEvents')
      if (storedBookmarks) {
        const bookmarks = new Set(JSON.parse(storedBookmarks))
        setIsBookmarked(bookmarks.has(eventId))
      }
      
      const status = getRegistrationStatus(eventId)
      setRegistrationStatus(status)
      
      const normalizedStatus = (foundEvent?.status || '').toLowerCase()
      if (status === 'registered') {
        setButtonLabel(normalizedStatus === 'completed' ? 'Complete Evaluation' : 'Evaluation Pending')
      } else if (status === 'evaluated') {
        setButtonLabel('View Certificate')
      } else {
        setButtonLabel(hasAccess ? 'Register Now' : 'Restricted')
      }
      
      setLoading(false)
    }
    
    fetchEvent()
  }, [params.id])

  const handleRegister = async () => {
    const eventId = params.id as string
    console.log('[Registration] ========================================')
    console.log('[Registration] Starting registration process')
    console.log('[Registration] Event ID:', eventId, 'Type:', typeof eventId)
    
    // Check access before allowing registration
    if (!hasAccess) {
      console.warn('[Registration] ❌ Access denied - user does not have permission for this event')
      alert(`You don't have access to register for this event. This event is restricted to ${event?.department || 'a specific department'}.`)
      return
    }
    
    // Get authenticated user info from API session (not localStorage)
    const userEmail = await getAuthenticatedUserEmail()
    if (!userEmail) {
      console.warn('[Registration] ❌ User not authenticated')
      alert('Please sign in to register for events.')
      router.push('/auth/signin')
      return
    }
    
    // Fetch user profile data from API
    let firstName = 'Participant'
    let lastName = 'User'
    let affiliation = 'HCDC'
    
    try {
      const { authApi, apiRequest } = await import('@/lib/api-config')
      const profileResponse = await apiRequest(authApi.me(), { method: 'GET' })
      if (profileResponse.ok) {
        const profileData = await profileResponse.json()
        if (profileData.authenticated && profileData.user) {
          const user = profileData.user
          // Use name from user profile
          if (user.name) {
            const nameParts = user.name.split(' ')
            firstName = nameParts[0] || user.first_name || 'Participant'
            lastName = nameParts.slice(1).join(' ') || user.last_name || 'User'
          } else {
            firstName = user.first_name || 'Participant'
            lastName = user.last_name || 'User'
          }
          // Affiliation is program or department
          affiliation = user.program || user.department || 'HCDC'
        }
      }
    } catch (err) {
      console.warn('[Registration] Could not fetch user profile, using defaults:', err)
      // Fallback: parse name from email
    const emailParts = userEmail.split('@')[0].split('.')
      firstName = emailParts[0] || 'Participant'
      lastName = emailParts.slice(1).join(' ') || 'User'
    }
    
    console.log('[Registration] User email:', userEmail)
    console.log('[Registration] User name:', { firstName, lastName })
    console.log('[Registration] User affiliation:', affiliation)
    
    console.log('[Registration] Parsed name:', { firstName, lastName, affiliation })
    
    try {
      const registrationUrl = api.registrations()
      console.log('[Registration] Registration URL:', registrationUrl)
      
      const payload = {
        event: parseInt(eventId),
        email: userEmail,
        first_name: firstName,
        last_name: lastName,
        affiliation: affiliation,
      }
      
      console.log('[Registration] Request payload:', JSON.stringify(payload, null, 2))
      
      const response = await apiCall.post(registrationUrl, payload)
      console.log('[Registration] Response status:', response.status, response.statusText)
      console.log('[Registration] Response headers:', Object.fromEntries(response.headers.entries()))
      
      if (!response.ok) {
        let errorMessage = 'Failed to register for event'
        let errorData: any = null
        
        try {
          const responseText = await response.text()
          console.log('[Registration] Response text (raw):', responseText)
          
          errorData = JSON.parse(responseText)
          console.error('[Registration] ❌ Error response (parsed):', JSON.stringify(errorData, null, 2))
          
          // Check for unique constraint violation (already registered)
          const isDuplicateError = 
            response.status === 400 && (
              errorData.non_field_errors?.some((msg: string) => 
                msg.toLowerCase().includes('unique') || 
                msg.toLowerCase().includes('already')
              ) ||
              errorData.detail?.toLowerCase().includes('unique') ||
              errorData.detail?.toLowerCase().includes('already') ||
              errorData.error?.toLowerCase().includes('unique')
            )
          
          console.log('[Registration] Is duplicate error?', isDuplicateError)
          
          if (isDuplicateError) {
            console.log('[Registration] User already registered, fetching existing registration...')
            errorMessage = 'You are already registered for this event'
            
            // Fetch existing registration to show QR code
            // api.registrations() already ends with /, so we use ? not /?
            const baseUrl = api.registrations().endsWith('/') 
              ? api.registrations().slice(0, -1) 
              : api.registrations()
            const existingRegUrl = `${baseUrl}/?event=${eventId}&email=${encodeURIComponent(userEmail)}`
            console.log('[Registration] Fetching existing registration from:', existingRegUrl)
            
            const existingRes = await apiCall.get(existingRegUrl)
            console.log('[Registration] Existing registration response status:', existingRes.status)
            
            if (existingRes.ok) {
              const existingData = await existingRes.json()
              console.log('[Registration] Existing registration data:', existingData)
              
              // Handle paginated response
              const registrations = Array.isArray(existingData) 
                ? existingData 
                : (existingData.results || existingData.data || [])
              
              console.log('[Registration] Found registrations:', registrations.length)
              
              if (registrations.length > 0) {
                const reg = registrations[0]
                console.log('[Registration] ✅ Using existing registration:', {
                  id: reg.id,
                  qr_code_value: reg.qr_code_value,
                  has_qr_code: !!reg.qr_code,
                })
                
                // If no QR code value from backend, generate one based on registration ID
                let qrCodeValue = reg.qr_code_value
                if (!qrCodeValue && reg.id) {
                  // Try to get event code prefix from event object, or use default
                  const eventPrefix = (event as any)?.code_prefix || 'REG'
                  qrCodeValue = `${eventPrefix}-${String(reg.id).padStart(6, '0')}`
                  console.log('[Registration] Generated QR code value:', qrCodeValue)
                }
                
                setRegistrationData({
                  qr_code: reg.qr_code || null, // null if not available, will use frontend generation
                  qr_code_value: qrCodeValue,
                })
                updateRegistrationStatus(eventId, 'registered')
                setRegistrationStatus('registered')
                setButtonLabel('Check In')
                setShowSuccessModal(true)
                console.log('[Registration] ✅ Successfully loaded existing registration')
                return
              } else {
                console.warn('[Registration] ⚠️ No existing registration found despite duplicate error')
              }
            } else {
              console.error('[Registration] ❌ Failed to fetch existing registration')
            }
          } else {
            // Other error types
            errorMessage = errorData.detail || errorData.error || errorData.non_field_errors?.[0] || errorMessage
            console.error('[Registration] ❌ Registration failed:', errorMessage)
          }
        } catch (parseErr) {
          console.error('[Registration] ❌ Failed to parse error response:', parseErr)
          errorMessage = `Registration failed: ${response.status} ${response.statusText}`
        }
        
        alert(errorMessage)
        return
      }
      
      const registration = await response.json()
      console.log('[Registration] ✅ Successfully registered!')
      console.log('[Registration] Registration data:', {
        id: registration.id,
        qr_code_value: registration.qr_code_value,
        has_qr_code: !!registration.qr_code,
        email: registration.email,
      })
      
      // Store registration data with QR code (no barcode)
      setRegistrationData({
        qr_code: registration.qr_code,
        qr_code_value: registration.qr_code_value,
      })
      
      console.log('[Registration] Stored registration data in state')
      
      // Update local state
      updateRegistrationStatus(eventId, 'registered')
      setRegistrationStatus('registered')
      setButtonLabel('Check In')
      setShowSuccessModal(true)
      
      console.log('[Registration] ✅ Registration complete!')
      console.log('[Registration] ========================================')
      
    } catch (err: any) {
      console.error('[Registration] ❌ Exception during registration:', err)
      console.error('[Registration] Error stack:', err.stack)
      alert(err.message || 'Failed to register for event. Please try again.')
    }
  }

  const handleEvaluation = () => {
    // Only allow evaluation if event is completed
    if (eventStatus !== 'completed') {
      alert('This event has not been concluded yet. Evaluations will be available once the event organizer concludes the event.')
      return
    }
    router.push(`/participant/event/${params.id}/evaluation`)
  }

  const handleViewCertificate = () => {
    router.push(`/participant/certificates`)
  }

  const handleMainAction = () => {
    if (registrationStatus === 'none') {
      handleRegister()
    } else if (registrationStatus === 'registered' || registrationStatus === 'checked-in') {
      const normalizedStatus = (eventStatus || '').toLowerCase()
      if (normalizedStatus === 'completed') {
      handleEvaluation()
      } else {
        alert('This event has not been concluded yet. Evaluations will be available once the event organizer concludes the event.')
      }
    } else if (registrationStatus === 'evaluated') {
      handleViewCertificate()
    }
  }

    if (loading) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Loading event...</p>
      </div>
    )
  }

  if (!event) {
    console.error('[Participant Event Detail] Event not found!')
    console.error('[Participant Event Detail] Searched ID:', params.id)
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Event not found</p>
        <p className="text-sm text-muted-foreground mt-2">ID: {params.id}</p>
        <Button onClick={() => router.back()} className="mt-4">Back</Button>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      {/* Hero Section */}
      {(event.coverImage || event.cover_image) ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img 
          src={event.coverImage || event.cover_image || ''} 
          alt={event.name || event.title || 'Event cover'} 
          className="w-full aspect-video object-cover rounded-lg border border-border"
        />
      ) : (
        <div className="aspect-video bg-gradient-to-br from-secondary/20 to-primary/20 rounded-lg border border-border" />
      )}

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Title */}
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">{event.name || event.title || 'Untitled Event'}</h1>
            <p className="text-muted-foreground">{event.department || 'N/A'}</p>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="p-4 border border-border bg-card">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">Date & Time</span>
              </div>
              <p className="font-semibold text-foreground">{event.date || 'TBA'}</p>
              <p className="text-sm text-muted-foreground">
                {event.startTime || event.start_time || 'TBA'} - {event.endTime || event.end_time || 'TBA'}
              </p>
            </Card>

            <Card className="p-4 border border-border bg-card">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <MapPin className="w-4 h-4" />
                <span className="text-sm">Location</span>
              </div>
              <p className="font-semibold text-foreground text-sm">{event.venue || event.location || 'TBA'}</p>
            </Card>

            <Card className="p-4 border border-border bg-card">
              <p className="text-sm text-muted-foreground mb-2">Speaker</p>
              <p className="font-semibold text-foreground">{event.speakers}</p>
            </Card>

            <Card className="p-4 border border-border bg-card">
              <p className="text-sm text-muted-foreground mb-2">Status</p>
              <p className="font-semibold text-foreground capitalize">{registrationStatus === 'none' ? 'Not Registered' : registrationStatus}</p>
            </Card>
          </div>

          {/* Description */}
          <Card className="p-6 border border-border bg-card space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-2">About</h2>
              <p className="text-muted-foreground">{event.description}</p>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card className="p-6 border border-border bg-card sticky top-20 space-y-4">
            <Button
              className={`w-full font-semibold ${
                hasAccess && registrationStatus === 'none'
                  ? 'bg-secondary hover:bg-secondary/90 text-secondary-foreground'
                  : hasAccess
                  ? 'bg-secondary hover:bg-secondary/90 text-secondary-foreground'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
              size="lg"
              onClick={handleMainAction}
              disabled={!hasAccess && registrationStatus === 'none'}
            >
              {buttonLabel}
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={() => {
                const newBookmarked = !isBookmarked
                setIsBookmarked(newBookmarked)
                
                // Update localStorage
                const storedBookmarks = localStorage.getItem('bookmarkedEvents')
                const bookmarks = storedBookmarks ? new Set(JSON.parse(storedBookmarks)) : new Set<number | string>()
                
                if (newBookmarked) {
                  bookmarks.add(params.id as string)
                } else {
                  bookmarks.delete(params.id as string)
                }
                
                localStorage.setItem('bookmarkedEvents', JSON.stringify(Array.from(bookmarks)))
              }}
            >
              <Bookmark className={`w-5 h-5 ${isBookmarked ? 'fill-primary text-primary' : ''}`} />
              {isBookmarked ? 'Bookmarked' : 'Bookmark Event'}
            </Button>

            <div className="space-y-2 text-sm text-muted-foreground">
              <p>Status: <span className="font-semibold text-foreground capitalize">{registrationStatus === 'none' ? 'Not Registered' : registrationStatus}</span></p>
              {!hasAccess && (
                <p className="text-xs text-orange-600 mt-2">
                  ⚠️ Restricted to {event?.department || 'specific department'} members only
                </p>
              )}
              {userDepartment && (
                <p className="text-xs text-muted-foreground">
                  Your Department: {userDepartment}
                </p>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Success Modal - After Registration with QR Code */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="p-6 border border-border bg-card w-full max-w-2xl mx-4">
            <div className="space-y-4">
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-2">Successfully Registered!</h2>
                <p className="text-muted-foreground">
                  You have successfully registered for {event.name || event.title || 'this event'}.
                </p>
              </div>
              
              {registrationData ? (
                <div className="space-y-4">
                  <div className="bg-muted p-4 rounded-lg border border-border text-center">
                    <p className="text-sm text-muted-foreground mb-2">Your Registration QR Code</p>
                    <div className="flex justify-center bg-white rounded p-2">
                      {registrationData.qr_code ? (
                        // Use backend-generated QR code if available
                        <img
                          src={`data:image/png;base64,${registrationData.qr_code}`}
                          alt="QR Code"
                          className="w-48 h-48 object-contain"
                        />
                      ) : registrationData.qr_code_value ? (
                        // Generate QR code on frontend using qr_code_value
                        <QRCodeSVG
                          value={registrationData.qr_code_value}
                          size={192}
                          level="H"
                          includeMargin={true}
                        />
                      ) : (
                        // Fallback: generate QR code using registration ID
                        <QRCodeSVG
                          value={`REG-${params.id}-${registrationData.qr_code_value || 'pending'}`}
                          size={192}
                          level="H"
                          includeMargin={true}
                        />
                      )}
                    </div>
                    {registrationData.qr_code_value && (
                      <p className="text-xs text-muted-foreground mt-2 font-mono">
                        Code: {registrationData.qr_code_value}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-muted p-4 rounded-lg border border-border text-center">
                  <p className="text-sm text-muted-foreground">Loading QR code...</p>
                </div>
              )}
              
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowSuccessModal(false)
                  }}
                >
                  Close
                </Button>
                <Button
                  className="flex-1 bg-secondary hover:bg-secondary/90 text-secondary-foreground"
                  onClick={() => {
                    setShowSuccessModal(false)
                    router.push(`/participant/event/${params.id}/qrcode`)
                  }}
                >
                  View Full Details
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
