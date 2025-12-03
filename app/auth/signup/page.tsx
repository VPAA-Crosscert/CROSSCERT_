'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { ArrowLeft, Mail, Lock, User, ChevronDown } from 'lucide-react'
import { api } from '@/lib/api-config'

const DEPARTMENTS = {
  'College of Criminal Justice Education': ['Bachelor of Science in Criminology'],
  'College of Engineering and Technology': [
    'Bachelor of Science in Computer Engineering (BSCpE)',
    'Bachelor of Science in Electronics Engineering (BSECE)',
    'Bachelor of Science in Information Technology (BSIT)',
    'Bachelor of Library and Information Science (BLIS)',
  ],
  'College of Hospitality & Tourism Management': [
    'Bachelor of Science in Hospitality Management (BSHM)',
    'Bachelor of Science in Tourism Management (BSTM)',
  ],
  'College of Arts & Sciences': [
    'Bachelor of Arts in Political Science (AB PolSci)',
    'Bachelor of Arts in Economics (AB Econ)',
    'Bachelor of Arts in History (AB History)',
    'Bachelor of Arts in Philosophy (AB Philosophy)',
    'BA Communication — Journalism & Broadcasting',
    'BA Communication — New Media Studies',
    'BA Communication — Social Communications',
    'Bachelor of Arts in English Language Studies (BA ELS)',
    'Bachelor of Science in Psychology (BS Psych)',
    'Bachelor of Science in Social Work (BSSW)',
  ],
  'College of Maritime Education': ['Bachelor of Science in Marine Transportation (BSMT)'],
  'School of Business & Management': [
    'Bachelor of Science in Accountancy (BSA)',
    'Bachelor of Science in Business Administration major in Financial Management (BSBA-FM)',
    'Bachelor of Science in Business Administration major in Human Resource Management (BSBA-HRM)',
    'Bachelor of Science in Business Administration major in Marketing Management (BSBA-MM)',
    'Bachelor of Science in Customs Administration (BSCA)',
    'Bachelor of Science in Management Accounting (BSMA)',
    'Bachelor of Science in Real Estate Management (BSREM)',
  ],
  'School of Teacher Education': [
    'Bachelor of Early Childhood Education (BECEd)',
    'Bachelor of Elementary Education (BEEd)',
    'Bachelor of Physical Education (BPEd)',
    'Bachelor of Secondary Education major in English',
    'Bachelor of Secondary Education major in Filipino',
    'Bachelor of Secondary Education major in Mathematics',
    'Bachelor of Secondary Education major in Science',
    'Bachelor of Secondary Education major in Social Studies',
    'Bachelor of Secondary Education major in Values Education with Catetics',
    'Bachelor of Special Needs Education – Generalist',
  ],
}

export default function SignUp() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    department: '',
    program: '',
  })
  const [showDepartmentDropdown, setShowDepartmentDropdown] = useState(false)
  const [showProgramDropdown, setShowProgramDropdown] = useState(false)
  const [error, setError] = useState('')

  const departmentList = Object.keys(DEPARTMENTS)
  const programs = formData.department ? DEPARTMENTS[formData.department as keyof typeof DEPARTMENTS] : []

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.department || !formData.program) {
      setError('Please select both department and program')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setIsLoading(true)
    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
      }

      const res = await fetch(`${api.participants?.() ?? ''}/register/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.detail || 'Unable to create account.')
        setIsLoading(false)
        return
      }

      localStorage.setItem('userRole', 'participant')
      localStorage.setItem('userEmail', formData.email)
      localStorage.setItem('userDepartment', formData.department)
      localStorage.setItem('userProgram', formData.program)
      router.push('/participant/dashboard')
    } catch (err) {
      setError('Network error while creating account.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <h1 className="text-3xl font-bold text-foreground">Create account</h1>
          <p className="text-muted-foreground">Join CROSSCERT and start managing events</p>
        </div>

        {/* Form */}
        <Card className="p-6 border border-border bg-card">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive text-destructive rounded-md text-sm">
                {error}
              </div>
            )}

            {/* Name Field */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-foreground">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={handleChange}
                  className="pl-10 bg-background border-border text-foreground placeholder:text-muted-foreground"
                  required
                />
              </div>
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@hcdc.edu.ph"
                  value={formData.email}
                  onChange={handleChange}
                  className="pl-10 bg-background border-border text-foreground placeholder:text-muted-foreground"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  className="pl-10 bg-background border-border text-foreground placeholder:text-muted-foreground"
                  required
                />
              </div>
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-foreground">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="pl-10 bg-background border-border text-foreground placeholder:text-muted-foreground"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-foreground">Department</Label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowDepartmentDropdown(!showDepartmentDropdown)}
                  className="w-full flex items-center justify-between px-3 py-2 bg-background border border-border rounded-md text-foreground hover:bg-muted transition-colors"
                >
                  <span className={formData.department ? 'text-foreground' : 'text-muted-foreground'}>
                    {formData.department || 'Select a department...'}
                  </span>
                  <ChevronDown className="w-4 h-4" />
                </button>
                
                {showDepartmentDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
                    {departmentList.map((dept) => (
                      <button
                        key={dept}
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, department: dept, program: '' }))
                          setShowDepartmentDropdown(false)
                        }}
                        className={`w-full text-left px-3 py-2 hover:bg-muted transition-colors text-sm ${
                          formData.department === dept ? 'bg-primary/10 text-primary font-semibold' : 'text-foreground'
                        }`}
                      >
                        {dept}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label className={`text-foreground ${!formData.department ? 'opacity-50' : ''}`}>Program</Label>
              <div className="relative">
                <button
                  type="button"
                  disabled={!formData.department}
                  onClick={() => setShowProgramDropdown(!showProgramDropdown)}
                  className={`w-full flex items-center justify-between px-3 py-2 bg-background border border-border rounded-md ${
                    formData.department 
                      ? 'text-foreground hover:bg-muted cursor-pointer' 
                      : 'text-muted-foreground cursor-not-allowed opacity-50'
                  } transition-colors`}
                >
                  <span className="text-sm">
                    {formData.program || (formData.department ? 'Select a program...' : 'Select department first')}
                  </span>
                  <ChevronDown className="w-4 h-4" />
                </button>
                
                {showProgramDropdown && formData.department && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
                    {programs.map((program) => (
                      <button
                        key={program}
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, program }))
                          setShowProgramDropdown(false)
                        }}
                        className={`w-full text-left px-3 py-2 hover:bg-muted transition-colors text-sm ${
                          formData.program === program ? 'bg-primary/10 text-primary font-semibold' : 'text-foreground'
                        }`}
                      >
                        {program}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading || !formData.department || !formData.program}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>
        </Card>

        {/* Sign In Link */}
        <div className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <button
            onClick={() => router.push('/auth/signin')}
            className="text-primary hover:underline font-semibold"
          >
            Sign in
          </button>
        </div>
      </div>
    </div>
  )
}
