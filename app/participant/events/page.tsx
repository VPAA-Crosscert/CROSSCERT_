'use client'

import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, MapPin, Calendar, Bookmark, X } from 'lucide-react'
import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { getStoredEvents, getDepartmentFromUser } from '@/lib/event-context'
import { Event } from '@/lib/event-context'

const DEPARTMENT_ABBR = {
  'College of Criminal Justice Education': 'CCJE',
  'College of Engineering and Technology': 'CET',
  'College of Hospitality & Tourism Management': 'CHATME',
  'College of Arts & Sciences': 'HUSOCOM',
  'College of Maritime Education': 'COME',
  'School of Business & Management': 'SBME',
  'School of Teacher Education': 'STE',
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
    const dept = getDepartmentFromUser()
    setUserDepartment(dept)
    const storedEvents = getStoredEvents()
    setEvents(storedEvents)
  }, [])

  const filteredEvents = events.filter((event) => {
    const matchesSearch = event.name.toLowerCase().includes(searchTerm.toLowerCase())
    
    if (selectedCategory === 'ALL') {
      return matchesSearch
    }
    
    if (selectedCategory === 'HCDC') {
      return matchesSearch && event.category === 'HCDC'
    }
    
    return matchesSearch && event.category === selectedCategory
  })

  const canAccessEvent = (eventCategory: string, eventDept?: string): boolean => {
    if (eventCategory === 'HCDC') return true
    const userDept = Object.values(DEPARTMENT_ABBR).find(
      abbr => abbr === eventDept || 
      getDepartmentFromUser().includes(abbr)
    )
    return eventDept === userDept || eventCategory === userDept
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
              <div className="aspect-video bg-gradient-to-br from-secondary/20 to-primary/20" />

              <div className="p-4 space-y-3">
                <h3 className="font-semibold text-foreground line-clamp-2">{event.name}</h3>

                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {event.date} • {event.startTime}
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {event.venue}
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
