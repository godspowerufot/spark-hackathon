'use client'

import '@rainbow-me/rainbowkit/styles.css'
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, type ReactNode } from 'react'
import { Toaster } from 'react-hot-toast'
import { WagmiProvider } from 'wagmi'
import { wagmiConfig } from '@/lib/wagmi'

const theme = darkTheme({
  accentColor: '#D4AF37',
  accentColorForeground: '#050505',
  borderRadius: 'large',
  fontStack: 'system',
  overlayBlur: 'small',
})

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 12_000, retry: 1, refetchOnWindowFocus: false },
        },
      }),
  )

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={theme} modalSize="compact">
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: '#0A0A0A',
                color: '#EDECE8',
                border: '1px solid rgba(212,175,55,0.25)',
              },
            }}
          />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
