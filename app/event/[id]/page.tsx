'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Navigation } from '@/components/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MapPin, Calendar, Clock, Users, Share2, Heart, ArrowLeft } from 'lucide-react'

export default function EventDetailPage() {
  const router = useRouter()
  const params = useParams()
  const [isLiked, setIsLiked] = useState(false)

  // Mock event data
  const event = {
    id: params.id,
    title: 'Advanced Python Workshop',
    category: 'cet',
    description: 'Learn advanced Python programming concepts including decorators, context managers, and meta programming. Perfect for developers looking to master Python.',
    fullDescription: `This comprehensive workshop covers advanced Python programming concepts that will elevate your development skills. Whether you're a beginner looking to dive deeper or an intermediate developer aiming for mastery, this course has something for everyone.

Topics covered:
- Decorators and meta programming
- Context managers and resource handling
- Advanced OOP patterns
- Performance optimization
- Best practices and design patterns
- Real-world project implementation

Duration: 3 hours
Level: Intermediate to Advanced
Max capacity: 50 participants`,
    date: 'November 20, 2025',
    time: '2:00 PM - 5:00 PM',
    location: 'Tech Hub, Building A Room 201',
    speakers: ['Dr. John Smith', 'Ms. Jane Doe'],
    organizer: 'CET Events',
    attendees: 45,
    capacity: 50,
    image: '/python-advanced-workshop.jpg',
    tags: ['Python', 'Programming', 'Workshop'],
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-accent hover:text-primary transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to events
          </button>

          {/* Hero Image */}
          <div className="relative h-80 rounded-2xl overflow-hidden mb-8 bg-gradient-to-br from-primary/10 to-accent/10 border border-border">
            <img
              src={event.image || "/placeholder.svg"}
              alt={event.title}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Title & Meta */}
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <h1 className="text-4xl font-bold text-foreground">{event.title}</h1>
                    <div className="flex items-center gap-2 flex-wrap">
                      {event.tags.map(tag => (
                        <Badge key={tag} variant="outline">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => setIsLiked(!isLiked)}
                    className={`p-2 rounded-lg transition-colors ${
                      isLiked
                        ? 'bg-primary/20 text-primary'
                        : 'bg-muted text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    <Heart className={`w-6 h-6 ${isLiked ? 'fill-current' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Event Details */}
              <Card className="p-6 border border-border bg-card/50 backdrop-blur">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 text-foreground">
                      <Calendar className="w-5 h-5 text-accent" />
                      <span>{event.date}</span>
                    </div>
                    <div className="flex items-center gap-3 text-foreground">
                      <Clock className="w-5 h-5 text-accent" />
                      <span>{event.time}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 text-foreground">
                      <MapPin className="w-5 h-5 text-accent" />
                      <span>{event.location}</span>
                    </div>
                    <div className="flex items-center gap-3 text-foreground">
                      <Users className="w-5 h-5 text-accent" />
                      <span>{event.attendees} of {event.capacity} attending</span>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Description */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-foreground">About this event</h2>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{event.fullDescription}</p>
              </div>

              {/* Speakers */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-foreground">Speakers</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {event.speakers.map((speaker, idx) => (
                    <Card key={idx} className="p-4 border border-border bg-card/50">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full flex items-center justify-center">
                          <span className="font-bold text-foreground">{speaker.charAt(0)}</span>
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{speaker}</p>
                          <p className="text-sm text-muted-foreground">Speaker</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* Organizer Card */}
              <Card className="p-6 border border-border bg-card space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Organized by</p>
                  <p className="font-semibold text-foreground">{event.organizer}</p>
                </div>
                <Button
                  size="lg"
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                  onClick={() => router.push(`/event/${event.id}/register`)}
                >
                  Register Now
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full gap-2"
                >
                  <Share2 className="w-4 h-4" />
                  Share Event
                </Button>
              </Card>

              {/* Add to Calendar */}
              <Card className="p-4 border border-border bg-card text-center">
                <Button
                  variant="outline"
                  className="w-full"
                >
                  Add to Calendar
                </Button>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
