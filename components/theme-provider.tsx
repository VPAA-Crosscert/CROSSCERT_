'use client'

import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { ReactNode } from 'react'

interface ThemeProviderProps {
  children: ReactNode
  attribute?: string
  defaultTheme?: string
  enableSystem?: boolean
}

export function ThemeProvider({ 
  children, 
  attribute = 'class',
  defaultTheme = 'light',
  enableSystem = true 
}: ThemeProviderProps) {
  return (
    <NextThemesProvider 
      attribute={attribute} 
      defaultTheme={defaultTheme} 
      enableSystem={enableSystem}
      storageKey="crosscert-theme"
    >
      {children}
    </NextThemesProvider>
  )
}
