'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Save } from 'lucide-react'

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

  useEffect(() => {
    const email = localStorage.getItem('userEmail') || ''
    const department = localStorage.getItem('userDepartment') || ''
    const program = localStorage.getItem('userProgram') || ''
    
    setFormData({
      name: localStorage.getItem('userName') || '',
      email,
      department,
      program,
      birthday: localStorage.getItem('userBirthday') || '',
    })
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSave = () => {
    setIsSaving(true)
    localStorage.setItem('userName', formData.name)
    localStorage.setItem('userBirthday', formData.birthday)
    
    setTimeout(() => {
      setIsSaving(false)
      alert('Settings saved successfully!')
    }, 800)
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
            value={formData.department}
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
            value={formData.program}
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
    </div>
  )
}
