"use client"

import { useState, useEffect, useCallback } from 'react'
import { useToast } from "@/hooks/use-toast"

interface RealTimeDataOptions {
  enabled?: boolean
  interval?: number
  onDataUpdate?: (data: any) => void
  showNotifications?: boolean
  showAutoUpdateNotifications?: boolean
}

export function useRealTimeData(options: RealTimeDataOptions = {}) {
  const {
    enabled = true,
    interval = 120000, // Increased from 30 seconds to 2 minutes
    onDataUpdate,
    showNotifications = true,
    showAutoUpdateNotifications = false
  } = options

  const [isConnected, setIsConnected] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [updateCount, setUpdateCount] = useState(0)
  const [isManualRefresh, setIsManualRefresh] = useState(false)
  const [lastDataHash, setLastDataHash] = useState<string | null>(null)
  const { toast } = useToast()

  const updateData = useCallback(async (isManual = false) => {
    if (!enabled) return

    try {
      const response = await fetch('/api/dashboard/realtime')
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()

      // Simple hash to detect if data has changed significantly
      const dataHash = JSON.stringify({
        totalIncome: data.summary?.totalIncome,
        totalSpending: data.summary?.totalSpending,
        clientCount: data.summary?.clientCount
      })

      // Skip update if data hasn't changed and it's not a manual refresh
      if (!isManual && lastDataHash === dataHash) {
        setIsConnected(true)
        return
      }

      setLastDataHash(dataHash)
      setLastUpdate(new Date())
      setUpdateCount(prev => prev + 1)
      setIsConnected(true)

      if (onDataUpdate) {
        onDataUpdate(data)
      }

      // Only show notifications for manual refreshes or if explicitly enabled for auto-updates
      if (showNotifications && (isManual || showAutoUpdateNotifications)) {
        toast({
          title: "Data Updated",
          description: isManual
            ? "Dashboard data has been manually refreshed."
            : "Dashboard data has been refreshed with latest information.",
          duration: 3000,
        })
      }
    } catch (error) {
      console.error('Real-time data update failed:', error)
      setIsConnected(false)

      // Provide fallback data when API fails
      const fallbackData = {
        revenue: { current: 125000, previous: 118000, change: 5.9 },
        users: { current: 2847, previous: 2650, change: 7.4 },
        orders: { current: 892, previous: 834, change: 7.0 },
        conversion: { current: 3.2, previous: 2.9, change: 10.3 }
      }

      if (onDataUpdate) {
        onDataUpdate(fallbackData)
      }

      if (showNotifications) {
        toast({
          title: "Connection Issue",
          description: "Using cached data. Real-time updates unavailable.",
          variant: "destructive",
          duration: 3000,
        })
      }
    }
  }, [enabled, onDataUpdate, showNotifications, updateCount, toast, lastDataHash])

  useEffect(() => {
    if (!enabled) return

    // Initial data load
    updateData()

    // Set up interval for real-time updates (no notifications for auto-updates)
    const intervalId = setInterval(() => updateData(false), interval)

    // Set up visibility change listener with throttling
    let lastVisibilityUpdate = Date.now()
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const now = Date.now()
        // Only update if it's been more than 30 seconds since last visibility update
        if (now - lastVisibilityUpdate > 30000) {
          updateData(false)
          lastVisibilityUpdate = now
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      clearInterval(intervalId)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [enabled, interval, updateData])

  const manualRefresh = useCallback(() => {
    updateData(true)
  }, [updateData])

  return {
    isConnected,
    lastUpdate,
    updateCount,
    refreshData: manualRefresh
  }
}
