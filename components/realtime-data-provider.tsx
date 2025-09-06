"use client"

import React from 'react'
import { useRealTimeData } from "@/hooks/use-realtime-data"

interface RealTimeDataOptions {
  enabled?: boolean
  interval?: number
  onDataUpdate?: (data: any) => void
  showNotifications?: boolean
}

export function RealTimeDataProvider({
  children,
  options
}: {
  children: React.ReactNode
  options?: RealTimeDataOptions
}) {
  const { isConnected, lastUpdate } = useRealTimeData(options)

  return (
    <div className="relative">
      {children}
      {options?.enabled && (
        <div className="fixed bottom-4 right-4 z-40">
          <div className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm ${
            isConnected
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
            }`} />
            <span>
              {isConnected ? 'Live' : 'Offline'}
            </span>
            {lastUpdate && (
              <span className="text-xs opacity-75">
                {lastUpdate.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
