'use client'

import * as React from 'react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'
import type { ThemeProviderProps } from 'next-themes'

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      {...props}
      // Prevents the inline <script> that next-themes injects for FOUC prevention
      // from triggering React's script-in-component warning in Next.js 16
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  )
}
