'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, X } from 'lucide-react'

interface SuccessModalProps {
  isOpen: boolean
  title: string
  message: string
  onClose: () => void
  actionLabel?: string
  onAction?: () => void
  showSound?: boolean
}

export function SuccessModal({
  isOpen,
  title,
  message,
  onClose,
  actionLabel = 'Continue',
  onAction,
  showSound = true,
}: SuccessModalProps) {
  useEffect(() => {
    if (isOpen && showSound) {
      // Play success sound
      const audio = new Audio('data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQIAAAAAAA==')
      audio.play().catch(() => {})
    }
  }, [isOpen, showSound])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="p-6 border border-border bg-card max-w-md w-full mx-4">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-green-500 flex-shrink-0" />
            <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-muted-foreground mb-6">{message}</p>

        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onClose}
          >
            Close
          </Button>
          {onAction && (
            <Button
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
              onClick={onAction}
            >
              {actionLabel}
            </Button>
          )}
        </div>
      </Card>
    </div>
  )
}
