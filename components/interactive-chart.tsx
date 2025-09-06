"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, ComposedChart } from "recharts"
import { motion } from "framer-motion"
import { TrendingUp, TrendingDown, BarChart3, PieChart as PieChartIcon, Activity, Settings, RefreshCw, Download, Maximize2, Minimize2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface InteractiveChartProps {
  data: any[]
  title: string
  description?: string
  type?: 'line' | 'bar' | 'pie' | 'area' | 'composed'
  height?: number
  onDrillDown?: (data: any) => void
  enableRealTime?: boolean
  onExport?: () => void
}

const COLORS = ['#10b981', '#ef4444', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16']

export function InteractiveChart({
  data,
  title,
  description,
  type = 'line',
  height = 300,
  onDrillDown,
  enableRealTime = false,
  onExport
}: InteractiveChartProps) {
  const [selectedData, setSelectedData] = useState<any>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [chartType, setChartType] = useState(type)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const { toast } = useToast()

  // Real-time data updates
  useEffect(() => {
    if (!enableRealTime) return

    const interval = setInterval(() => {
      setIsRefreshing(true)
      // Simulate real-time data update
      setTimeout(() => {
        setIsRefreshing(false)
        toast({
          title: "Data Updated",
          description: "Chart data has been refreshed with latest information.",
        })
      }, 1000)
    }, 30000) // Update every 30 seconds

    return () => clearInterval(interval)
  }, [enableRealTime, toast])

  const handleDataClick = useCallback((data: any) => {
    if (data && data.activePayload && data.activePayload[0]) {
      const clickedData = data.activePayload[0].payload
      setSelectedData(clickedData)

      if (onDrillDown) {
        onDrillDown(clickedData)
      }

      toast({
        title: "Data Selected",
        description: `Selected: ${clickedData.period || clickedData.name} - ${JSON.stringify(clickedData)}`,
      })
    }
  }, [onDrillDown, toast])

  const renderChart = () => {
    const commonProps = {
      data,
      margin: { top: 5, right: 30, left: 20, bottom: 5 },
      onClick: handleDataClick
    }

    switch (chartType) {
      case 'bar':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
            <XAxis dataKey="period" stroke="#6b7280" fontSize={12} />
            <YAxis stroke="#6b7280" fontSize={12} tickFormatter={(value) => `$${value}`} />
            <Tooltip
              formatter={(value, name) => [`$${Number(value).toLocaleString()}`, name]}
              contentStyle={{
                backgroundColor: "rgba(255, 255, 255, 0.95)",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
              }}
            />
            <Legend />
            <Bar dataKey="income" fill="#10b981" name="Income" />
            <Bar dataKey="spending" fill="#ef4444" name="Spending" />
            <Bar dataKey="profit" fill="#3b82f6" name="Profit" />
          </BarChart>
        )

      case 'pie':
        const pieData = data.map((item, index) => ({
          name: item.period,
          value: item.income || item.amount || 0,
          fill: COLORS[index % COLORS.length]
        }))

        return (
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${percent !== undefined ? (percent * 100).toFixed(0) : '0'}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              onClick={handleDataClick}
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        )

      case 'area':
        return (
          <AreaChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
            <XAxis dataKey="period" stroke="#6b7280" fontSize={12} />
            <YAxis stroke="#6b7280" fontSize={12} tickFormatter={(value) => `$${value}`} />
            <Tooltip
              formatter={(value, name) => [`$${Number(value).toLocaleString()}`, name]}
              contentStyle={{
                backgroundColor: "rgba(255, 255, 255, 0.95)",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
              }}
            />
            <Legend />
            <Area type="monotone" dataKey="income" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.6} name="Income" />
            <Area type="monotone" dataKey="spending" stackId="1" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} name="Spending" />
          </AreaChart>
        )

      case 'composed':
        return (
          <ComposedChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
            <XAxis dataKey="period" stroke="#6b7280" fontSize={12} />
            <YAxis stroke="#6b7280" fontSize={12} tickFormatter={(value) => `$${value}`} />
            <Tooltip
              formatter={(value, name) => [`$${Number(value).toLocaleString()}`, name]}
              contentStyle={{
                backgroundColor: "rgba(255, 255, 255, 0.95)",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
              }}
            />
            <Legend />
            <Bar dataKey="income" fill="#10b981" name="Income" />
            <Bar dataKey="spending" fill="#ef4444" name="Spending" />
            <Line type="monotone" dataKey="profit" stroke="#3b82f6" strokeWidth={3} name="Profit" />
          </ComposedChart>
        )

      default:
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
            <XAxis dataKey="period" stroke="#6b7280" fontSize={12} />
            <YAxis stroke="#6b7280" fontSize={12} tickFormatter={(value) => `$${value}`} />
            <Tooltip
              formatter={(value, name) => [`$${Number(value).toLocaleString()}`, name]}
              contentStyle={{
                backgroundColor: "rgba(255, 255, 255, 0.95)",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="income"
              stroke="#10b981"
              strokeWidth={3}
              name="Income"
              dot={{ fill: "#10b981", strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: "#10b981", strokeWidth: 2 }}
            />
            <Line
              type="monotone"
              dataKey="spending"
              stroke="#ef4444"
              strokeWidth={3}
              name="Spending"
              dot={{ fill: "#ef4444", strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: "#ef4444", strokeWidth: 2 }}
            />
            <Line
              type="monotone"
              dataKey="profit"
              stroke="#3b82f6"
              strokeWidth={3}
              name="Profit"
              dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: "#3b82f6", strokeWidth: 2 }}
            />
          </LineChart>
        )
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`relative ${isFullscreen ? 'fixed inset-0 z-50 bg-white dark:bg-gray-900 p-6' : ''}`}
    >
      <Card className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-white/20 dark:border-gray-700/20 shadow-xl">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-gray-900 dark:text-white flex items-center gap-2">
              {title}
              {isRefreshing && <RefreshCw className="h-4 w-4 animate-spin" />}
            </CardTitle>
            {description && (
              <CardDescription className="text-gray-600 dark:text-gray-300">
                {description}
              </CardDescription>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Select value={chartType} onValueChange={(value: any) => setChartType(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="line">Line</SelectItem>
                <SelectItem value="bar">Bar</SelectItem>
                <SelectItem value="area">Area</SelectItem>
                <SelectItem value="pie">Pie</SelectItem>
                <SelectItem value="composed">Composed</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>

            {onExport && (
              <Button variant="outline" size="sm" onClick={onExport}>
                <Download className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent>
          <div className={`${isFullscreen ? 'h-[calc(100vh-200px)]' : ''}`} style={{ height: isFullscreen ? undefined : height }}>
            <ResponsiveContainer width="100%" height="100%">
              {renderChart()}
            </ResponsiveContainer>
          </div>

          {selectedData && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
            >
              <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                Selected Data Point
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-blue-700 dark:text-blue-300">Period:</span>
                  <span className="ml-2 font-medium">{selectedData.period}</span>
                </div>
                {selectedData.income && (
                  <div>
                    <span className="text-green-700 dark:text-green-300">Income:</span>
                    <span className="ml-2 font-medium">${selectedData.income.toLocaleString()}</span>
                  </div>
                )}
                {selectedData.spending && (
                  <div>
                    <span className="text-red-700 dark:text-red-300">Spending:</span>
                    <span className="ml-2 font-medium">${selectedData.spending.toLocaleString()}</span>
                  </div>
                )}
                {selectedData.profit && (
                  <div>
                    <span className="text-blue-700 dark:text-blue-300">Profit:</span>
                    <span className="ml-2 font-medium">${selectedData.profit.toLocaleString()}</span>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          <div className="mt-4 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>Click on data points for drill-down details</span>
            {enableRealTime && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Activity className="h-3 w-3" />
                Live Updates
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
