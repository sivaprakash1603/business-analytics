"use client"

import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface DashboardCardProps {
  title: string
  value: string | number
  description?: string
  icon?: LucideIcon
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
  gradient?: string
  delay?: number
  className?: string
  children?: React.ReactNode
}

export function DashboardCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  trendValue,
  gradient = "from-blue-500 to-cyan-500",
  delay = 0,
  className = "",
  children
}: DashboardCardProps) {
  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-500" />
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-500" />
      default:
        return <Minus className="w-4 h-4 text-gray-500" />
    }
  }

  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'text-green-600 dark:text-green-400'
      case 'down':
        return 'text-red-600 dark:text-red-400'
      default:
        return 'text-gray-600 dark:text-gray-400'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.5,
        delay: delay,
        ease: "easeOut"
      }}
      whileHover={{
        scale: 1.02,
        transition: { duration: 0.2 }
      }}
      className={className}
    >
      <Card className="relative overflow-hidden bg-gradient-to-br from-white/90 to-white/60 dark:from-gray-900/90 dark:to-gray-900/60 backdrop-blur-lg border-0 shadow-xl hover:shadow-2xl transition-all duration-500 group">
        {/* Animated background gradient */}
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />

        {/* Floating particles effect */}
        <div className="absolute top-4 right-4 w-16 h-16 opacity-10">
          <div className="absolute w-1 h-1 bg-current rounded-full animate-ping delay-0" />
          <div className="absolute w-1 h-1 bg-current rounded-full animate-ping delay-500 top-3 left-4" />
          <div className="absolute w-1 h-1 bg-current rounded-full animate-ping delay-1000 top-2 right-3" />
        </div>

        <CardHeader className="relative z-10 pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {Icon && (
                <motion.div
                  whileHover={{ rotate: 360, scale: 1.1 }}
                  transition={{ duration: 0.5 }}
                  className={`p-2 rounded-lg bg-gradient-to-br ${gradient} text-white shadow-lg`}
                >
                  <Icon className="h-5 w-5" />
                </motion.div>
              )}
              <div>
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  {title}
                </CardTitle>
                <div className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent mt-1">
                  {typeof value === 'number' ? value.toLocaleString() : value}
                </div>
              </div>
            </div>

            {trend && trendValue && (
              <div className={`flex items-center space-x-1 ${getTrendColor()}`}>
                {getTrendIcon()}
                <span className="text-sm font-medium">{trendValue}</span>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="relative z-10 pt-0">
          {description && (
            <p className="text-sm text-muted-foreground mb-3">{description}</p>
          )}
          {children}
        </CardContent>

        {/* Hover effect overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform -skew-x-12 group-hover:animate-pulse" />
      </Card>
    </motion.div>
  )
}

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  color: string
  delay?: number
}

export function StatCard({ title, value, subtitle, icon: Icon, color, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ scale: 1.05 }}
      className="text-center"
    >
      <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${color} text-white mb-4 shadow-lg`}>
        <Icon className="w-8 h-8" />
      </div>
      <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
      <div className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-1">
        {title}
      </div>
      {subtitle && (
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {subtitle}
        </div>
      )}
    </motion.div>
  )
}
