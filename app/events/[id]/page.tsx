'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { ArrowLeft, Download, Share2, MoreVertical } from 'lucide-react'

const chartData = [
  { name: 'Mon', registrations: 20 },
  { name: 'Tue', registrations: 35 },
  { name: 'Wed', registrations: 28 },
  { name: 'Thu', registrations: 42 },
  { name: 'Fri', registrations: 48 },
]

const participantData = [
  { id: 1, name: 'John Doe', email: 'john@hcdc.edu.ph', status: 'checked-in', evaluation: 'completed' },
  { id: 2, name: 'Jane Smith', email: 'jane@hcdc.edu.ph', status: 'checked-in', evaluation: 'pending' },
  { id: 3, name: 'Bob Johnson', email: 'bob@hcdc.edu.ph', status: 'registered', evaluation: 'pending' },
  { id: 4, name: 'Alice Brown', email: 'alice@hcdc.edu.ph', status: 'checked-in', evaluation: 'completed' },
  { id: 5, name: 'Charlie Davis', email: 'charlie@hcdc.edu.ph', status: 'checked-in', evaluation: 'completed' },
]

export default function EventDetailAdminPage() {
  const router = useRouter()
  const params = useParams()
  const [activeTab, setActiveTab] = useState('overview')

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-accent hover:text-primary transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <h1 className="text-3xl font-bold text-foreground">Advanced Python Workshop</h1>
          <p className="text-muted-foreground mt-1">Event Management & Overview</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" gap-2 className="gap-2">
            <Share2 className="w-4 h-4" />
            Share
          </Button>
          <Button size="icon" variant="ghost">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6 mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="participants">Participants</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="evaluation">Evaluation</TabsTrigger>
          <TabsTrigger value="certificates">Certificates</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            {[
              { label: 'Registered', value: '48' },
              { label: 'Checked In', value: '45' },
              { label: 'Evaluations', value: '38' },
              { label: 'Certificates', value: '38' },
            ].map(stat => (
              <Card key={stat.label} className="p-4 border border-border bg-card">
                <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              </Card>
            ))}
          </div>

          <Card className="p-6 border border-border bg-card">
            <h3 className="font-semibold text-foreground mb-4">Registration Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" stroke="var(--muted-foreground)" />
                <YAxis stroke="var(--muted-foreground)" />
                <Tooltip contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }} />
                <Bar dataKey="registrations" fill="var(--primary)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </TabsContent>

        {/* Participants Tab */}
        <TabsContent value="participants" className="space-y-4">
          <Card className="border border-border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Name</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Email</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Evaluation</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {participantData.map(participant => (
                    <tr key={participant.id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4 text-sm text-foreground">{participant.name}</td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{participant.email}</td>
                      <td className="px-6 py-4 text-sm">
                        <div className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                          participant.status === 'checked-in'
                            ? 'bg-primary/10 text-primary'
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          {participant.status === 'checked-in' ? 'Checked In' : 'Registered'}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                          participant.evaluation === 'completed'
                            ? 'bg-accent/10 text-accent'
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          {participant.evaluation === 'completed' ? 'Completed' : 'Pending'}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <Button size="sm" variant="ghost">View</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* Attendance Tab */}
        <TabsContent value="attendance">
          <Card className="p-6 border border-border bg-card text-center">
            <p className="text-muted-foreground mb-4">QR/Barcode scanner interface</p>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
              Start Check-In Scanner
            </Button>
          </Card>
        </TabsContent>

        {/* Evaluation Tab */}
        <TabsContent value="evaluation">
          <Card className="p-6 border border-border bg-card">
            <h3 className="font-semibold text-foreground mb-4">Evaluation Summary</h3>
            <p className="text-muted-foreground">38 of 45 participants completed evaluation</p>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Completion Rate</span>
                <span className="font-semibold text-foreground">84%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-primary h-2 rounded-full" style={{ width: '84%' }}></div>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Certificates Tab */}
        <TabsContent value="certificates">
          <Card className="p-6 border border-border bg-card space-y-4">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2" fullWidth>
              <Download className="w-4 h-4" />
              Generate All Certificates
            </Button>
            <Button variant="outline" className="w-full gap-2">
              <Share2 className="w-4 h-4" />
              Send Email Notifications
            </Button>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings">
          <Card className="p-6 border border-border bg-card">
            <p className="text-muted-foreground">Event settings and configuration</p>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
