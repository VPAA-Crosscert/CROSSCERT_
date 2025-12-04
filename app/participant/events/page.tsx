'use client'

import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, MapPin, Calendar, Bookmark, X } from 'lucide-react'
import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { getStoredEvents, fetchUserDepartment } from '@/lib/event-context'
import { Event } from '@/lib/event-context'
import { api, apiCall } from '@/lib/api-config'

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

export default function ParticipantEvents() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('ALL')
  const [bookmarked, setBookmarked] = useState<Set<number | string>>(new Set())
  const [events, setEvents] = useState<Event[]>([])
  const [userDepartment, setUserDepartment] = useState('')
  const [deniedEventId, setDeniedEventId] = useState<string | number | null>(null)
  const [deniedDepartment, setDeniedDepartment] = useState('')

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        // Fetch user department from API
        const dept = await fetchUserDepartment()
        setUserDepartment(dept)
        
        // Fetch from API first (prioritize backend data)
        const eventsUrl = api.events().endsWith('/') ? api.events() : `${api.events()}/`
        console.log('[Participant Events] Fetching events from:', eventsUrl)
        const res = await apiCall.get(eventsUrl)
        
        console.log('[Participant Events] Response status:', res.status, res.statusText)
        
        let eventsList: Event[] = []
        
        if (!res.ok) {
          console.warn('[Participant Events] Unable to load events from API. Status:', res.status, res.statusText)
          // Fallback to localStorage if API fails
          const storedEvents = getStoredEvents()
          eventsList = storedEvents
          console.log('[Participant Events] Using localStorage fallback, events count:', eventsList.length)
        } else {
          let data: unknown = []
          try {
            data = await res.json()
            console.log('[Participant Events] Raw API response:', data)
          } catch {
            console.error('[Participant Events] Events API did not return JSON.')
            const storedEvents = getStoredEvents()
            eventsList = storedEvents
          }
          
          // Handle paginated response from Django REST Framework
          if (Array.isArray(data)) {
            eventsList = data as Event[]
            console.log('[Participant Events] Direct array response, events count:', eventsList.length)
          } else if (data && typeof data === 'object' && 'results' in data && Array.isArray(data.results)) {
            eventsList = data.results as Event[]
            console.log('[Participant Events] Paginated response (results), events count:', eventsList.length)
          } else if (data && typeof data === 'object' && 'data' in data && Array.isArray(data.data)) {
            eventsList = data.data as Event[]
            console.log('[Participant Events] Paginated response (data), events count:', eventsList.length)
          } else {
            console.warn('[Participant Events] Unknown response format, falling back to localStorage')
            const storedEvents = getStoredEvents()
            eventsList = storedEvents
          }
        }
        
        // Filter for public events
        const publicEvents = eventsList.filter(event => event.isPublic !== false)
        console.log('[Participant Events] Public events count:', publicEvents.length)
        setEvents(publicEvents)
        
        // Load bookmarked events from localStorage
        const storedBookmarks = localStorage.getItem('bookmarkedEvents')
        if (storedBookmarks) {
          setBookmarked(new Set(JSON.parse(storedBookmarks)))
        }
      } catch (err) {
        console.error('[Participant Events] Error fetching events:', err)
        // Fallback to localStorage on error
        const storedEvents = getStoredEvents()
        setEvents(storedEvents)
        
        // Load bookmarked events from localStorage
        const storedBookmarks = localStorage.getItem('bookmarkedEvents')
        if (storedBookmarks) {
          setBookmarked(new Set(JSON.parse(storedBookmarks)))
        }
      }
    }
    
    fetchEvents()
  }, [])

  const filteredEvents = events.filter((event) => {
    // Safety check: handle both 'name' (frontend) and 'title' (backend) properties
    const eventName = (event.name || event.title || '').toString()
    const matchesSearch = eventName.toLowerCase().includes(searchTerm.toLowerCase())
    
    if (selectedCategory === 'ALL') {
      return matchesSearch
    }
    
    if (selectedCategory === 'HCDC') {
      return matchesSearch && event.category === 'HCDC'
    }
    
    return matchesSearch && event.category === selectedCategory
  })

  const canAccessEvent = (eventCategory: string, eventDept?: string): boolean => {
    // HCDC events are accessible to everyone
    if (eventCategory === 'HCDC') return true
    
    // If no department restriction, allow access
    if (!eventDept) return true
    
    // Use the userDepartment state which is fetched from API
    const userDeptFull = userDepartment
    if (!userDeptFull) {
      console.log('[Access Check] User department not set')
      return false // User has no department set, can't access department events
    }
    
    // Convert both to abbreviations for comparison
    const userDeptAbbr = getDepartmentAbbr(userDeptFull)
    const eventDeptAbbr = getDepartmentAbbr(eventDept)
    
    console.log('[Access Check]', {
      eventCategory,
      eventDept,
      eventDeptAbbr,
      userDeptFull,
      userDeptAbbr,
      match: userDeptAbbr === eventDeptAbbr
    })
    
    // Match if abbreviations match
    return userDeptAbbr !== null && eventDeptAbbr !== null && userDeptAbbr === eventDeptAbbr
  }

  const handleRegister = (event: Event) => {
    if (!canAccessEvent(event.category || 'HCDC', event.department)) {
      setDeniedEventId(event.id)
      setDeniedDepartment(event.department || 'this department')
      return
    }
    router.push(`/participant/event/${event.id}`)
  }

  const toggleBookmark = (id: string | number) => {
    const newBookmarked = new Set(bookmarked)
    if (newBookmarked.has(id)) {
      newBookmarked.delete(id)
    } else {
      newBookmarked.add(id)
    }
    setBookmarked(newBookmarked)
    // Persist to localStorage
    localStorage.setItem('bookmarkedEvents', JSON.stringify(Array.from(newBookmarked)))
  }

  const categories = ['ALL', 'HCDC', 'CET', 'STE', 'SBME', 'HUSOCOM', 'CHATME', 'COME', 'CCJE']

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <h1 className="text-3xl font-bold text-foreground">Discover Events</h1>
        <p className="text-muted-foreground mt-1">Find and register for upcoming events</p>
        <p className="text-sm text-muted-foreground mt-2">Your Department: <span className="font-semibold text-foreground">{userDepartment || 'Not Set'}</span></p>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <Input
          placeholder="Search events..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-background border-border"
        />
        <div className="flex gap-2 flex-wrap">
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(cat)}
              className={selectedCategory === cat ? 'bg-secondary text-secondary-foreground' : 'border-border text-foreground'}
            >
              {cat === 'HCDC' ? 'HCDC EVENTS' : cat}
            </Button>
          ))}
        </div>
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEvents.map((event) => {
          const hasAccess = canAccessEvent(event.category || 'HCDC', event.department)
          return (
            <Card
              key={event.id}
              className="overflow-hidden border border-border bg-card hover:shadow-lg transition-shadow"
            >
              {(event.coverImage || event.cover_image) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img 
                  src={event.coverImage || event.cover_image || ''} 
                  alt={event.name || event.title || 'Event cover'} 
                  className="w-full aspect-video object-cover"
                />
              ) : (
                <div className="aspect-video bg-gradient-to-br from-secondary/20 to-primary/20" />
              )}

              <div className="p-4 space-y-3">
                <h3 className="font-semibold text-foreground line-clamp-2">{event.name || event.title || 'Untitled Event'}</h3>

                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {event.date} • {event.startTime || event.start_time || 'TBA'}
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {event.venue || event.location || 'TBA'}
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    className={`flex-1 ${hasAccess ? 'bg-secondary hover:bg-secondary/90 text-secondary-foreground' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                    onClick={() => handleRegister(event)}
                    disabled={!hasAccess}
                  >
                    {hasAccess ? 'View Details' : 'Restricted'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleBookmark(event.id)}
                  >
                    <Bookmark
                      className={`w-5 h-5 ${bookmarked.has(event.id) ? 'fill-primary text-primary' : ''}`}
                    />
                  </Button>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Access Denied Modal */}
      {deniedEventId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="p-6 border border-border bg-card max-w-md w-full mx-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                  <X className="w-5 h-5 text-red-600" />
                </div>
                <h2 className="text-lg font-semibold text-foreground">Can't Access Event</h2>
              </div>
              <button onClick={() => setDeniedEventId(null)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-muted-foreground">Only members of <span className="font-semibold text-foreground">{deniedDepartment}</span> can participate in this event.</p>
            <Button
              className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground"
              onClick={() => setDeniedEventId(null)}
            >
              Close
            </Button>
          </Card>
        </div>
      )}
    </div>
  )
}
