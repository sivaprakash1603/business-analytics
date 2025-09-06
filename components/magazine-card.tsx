"use client"

import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LucideIcon } from 'lucide-react'

interface MagazineCardProps {
  title: string
  description: string
  value?: string | number
  icon?: LucideIcon
  badge?: string
  gradient?: string
  delay?: number
  children?: React.ReactNode
  className?: string
}

export function MagazineCard({
  title,
  description,
  value,
  icon: Icon,
  badge,
  gradient = "from-blue-500 to-cyan-500",
  delay = 0,
  children,
  className = ""
}: MagazineCardProps) {
  // Parse gradient for hover effect
  const hoverClasses = gradient.split(' ').map(cls => `group-hover:${cls}`).join(' ')
  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.6,
        delay: delay,
        ease: "easeOut"
      }}
      viewport={{ once: true }}
      whileHover={{
        scale: 1.05,
        transition: { duration: 0.2 }
      }}
      className={`group ${className}`}
    >
      <Card className="glow-card p-2 rounded-lg relative overflow-hidden bg-gradient-to-br from-white/90 to-white/50 dark:from-gray-900/90 dark:to-gray-900/50 backdrop-blur border-0 shadow-2xl hover:shadow-3xl transition-all duration-500">
        {/* Animated background gradient */}
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-30 transition-opacity duration-500 -z-10`} />

        {/* Floating particles effect */}
        <div className="absolute top-4 right-4 w-20 h-20 opacity-20">
          <div className="absolute w-2 h-2 bg-current rounded-full animate-ping" />
          <div className="absolute w-1 h-1 bg-current rounded-full animate-ping top-2.5 left-3.5 delay-500" />
          <div className="absolute w-1.5 h-1.5 bg-current rounded-full animate-ping top-1.5 right-2.5 delay-1000" />
        </div>

        <CardHeader className="relative z-10 pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              {Icon && (
                <motion.div
                  whileHover={{ rotate: 360, scale: 1.1 }}
                  transition={{ duration: 0.5 }}
                  className={`p-3 rounded-xl bg-gradient-to-br ${gradient} text-white shadow-lg`}
                >
                  <Icon className="h-6 w-6" />
                </motion.div>
              )}
              <div>
                <CardTitle className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                  {title}
                </CardTitle>
                {badge && (
                  <Badge variant="secondary" className="mt-2 bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800 dark:from-blue-900 dark:to-cyan-900 dark:text-blue-200">
                    {badge}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="relative z-10">
          {value !== undefined && value !== null && (
            <div className={`text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent mb-2 ${hoverClasses}`}>
              {value}
            </div>
          )}
          <CardDescription className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
            {description}
          </CardDescription>
          {children}
        </CardContent>

        {/* Hover effect overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform -skew-x-12 group-hover:animate-pulse" />
      </Card>
    </motion.div>
  )
}
