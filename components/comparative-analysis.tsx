"use client"

import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, ComposedChart, Area, AreaChart } from "recharts"
import { motion } from "framer-motion"
import { TrendingUp, TrendingDown, Calendar, BarChart3, Target, Users, Building, ArrowUpRight, ArrowDownRight } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ComparativeData {
  period: string
  currentYear: number
  previousYear: number
  competitor1?: number
  competitor2?: number
  industry?: number
  target?: number
}

interface ComparativeAnalysisProps {
  data: ComparativeData[]
  title?: string
  description?: string
  metrics?: {
    currentYear: string
    previousYear: string
    competitors?: string[]
    industry?: string
  }
}

export function ComparativeAnalysis({
  data,
  title = "Comparative Analysis",
  description = "Compare performance across different time periods and competitors",
  metrics = {
    currentYear: "2024",
    previousYear: "2023",
    competitors: ["Competitor A", "Competitor B"],
    industry: "Industry Average"
  }
}: ComparativeAnalysisProps) {
  const [selectedView, setSelectedView] = useState<'year-over-year' | 'competitor' | 'industry'>('year-over-year')
  const [selectedMetric, setSelectedMetric] = useState<'revenue' | 'growth' | 'market-share'>('revenue')
  const { toast } = useToast()

  const processedData = useMemo(() => {
    return data.map(item => ({
      ...item,
      growth: item.previousYear ? ((item.currentYear - item.previousYear) / item.previousYear) * 100 : 0,
      competitorAvg: item.competitor1 && item.competitor2 ? (item.competitor1 + item.competitor2) / 2 : 0,
      vsIndustry: item.industry ? ((item.currentYear - item.industry) / item.industry) * 100 : 0,
      vsTarget: item.target ? ((item.currentYear - item.target) / item.target) * 100 : 0
    }))
  }, [data])

  const summaryStats = useMemo(() => {
    const latest = processedData[processedData.length - 1]
    const previous = processedData[processedData.length - 2]

    return {
      currentValue: latest?.currentYear || 0,
      previousValue: previous?.currentYear || 0,
      growth: latest?.growth || 0,
      vsCompetitor: latest?.competitorAvg ? ((latest.currentYear - latest.competitorAvg) / latest.competitorAvg) * 100 : 0,
      vsIndustry: latest?.vsIndustry || 0,
      vsTarget: latest?.vsTarget || 0
    }
  }, [processedData])

  const renderChart = () => {
    const chartData = processedData.map(item => ({
      period: item.period,
      [metrics.currentYear]: item.currentYear,
      [metrics.previousYear]: item.previousYear,
      ...(metrics.competitors && {
        [metrics.competitors[0]]: item.competitor1,
        [metrics.competitors[1]]: item.competitor2
      }),
      [metrics.industry || 'Industry']: item.industry,
      Target: item.target
    }))

    switch (selectedView) {
      case 'year-over-year':
        return (
          <ComposedChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
            <XAxis dataKey="period" stroke="#6b7280" fontSize={12} />
            <YAxis stroke="#6b7280" fontSize={12} tickFormatter={(value) => `$${value.toLocaleString()}`} />
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
            <Bar dataKey={metrics.previousYear} fill="#e5e7eb" name={metrics.previousYear} />
            <Bar dataKey={metrics.currentYear} fill="#3b82f6" name={metrics.currentYear} />
            <Line type="monotone" dataKey="Target" stroke="#ef4444" strokeWidth={3} name="Target" />
          </ComposedChart>
        )

      case 'competitor':
        return (
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
            <XAxis dataKey="period" stroke="#6b7280" fontSize={12} />
            <YAxis stroke="#6b7280" fontSize={12} tickFormatter={(value) => `$${value.toLocaleString()}`} />
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
            <Line type="monotone" dataKey={metrics.currentYear} stroke="#3b82f6" strokeWidth={3} name="Your Performance" />
            {metrics.competitors?.map((competitor, index) => (
              <Line
                key={competitor}
                type="monotone"
                dataKey={competitor}
                stroke={index === 0 ? "#10b981" : "#f59e0b"}
                strokeWidth={2}
                name={competitor}
                strokeDasharray="5 5"
              />
            ))}
          </LineChart>
        )

      case 'industry':
        return (
          <AreaChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
            <XAxis dataKey="period" stroke="#6b7280" fontSize={12} />
            <YAxis stroke="#6b7280" fontSize={12} tickFormatter={(value) => `$${value.toLocaleString()}`} />
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
            <Area type="monotone" dataKey={metrics.currentYear} stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} name="Your Performance" />
            <Area type="monotone" dataKey={metrics.industry || 'Industry'} stackId="1" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.4} name={metrics.industry || 'Industry'} />
          </AreaChart>
        )

      default:
        return (
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
            <XAxis dataKey="period" stroke="#6b7280" fontSize={12} />
            <YAxis stroke="#6b7280" fontSize={12} tickFormatter={(value) => `$${value.toLocaleString()}`} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey={metrics.currentYear} stroke="#3b82f6" strokeWidth={3} />
          </LineChart>
        )
    }
  }

  const exportData = () => {
    const csvContent = [
      Object.keys(processedData[0] || {}).join(','),
      ...processedData.map(row => Object.values(row).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'comparative-analysis.csv'
    a.click()
    window.URL.revokeObjectURL(url)

    toast({
      title: "Data Exported",
      description: "Comparative analysis data has been exported to CSV.",
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <Card className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-white/20 dark:border-gray-700/20 shadow-xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-gray-900 dark:text-white flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                {title}
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-300">
                {description}
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              <Select value={selectedView} onValueChange={(value: any) => setSelectedView(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="year-over-year">Year-over-Year</SelectItem>
                  <SelectItem value="competitor">vs Competitors</SelectItem>
                  <SelectItem value="industry">vs Industry</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" onClick={exportData}>
                Export Data
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 dark:text-blue-400">Current Value</p>
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                    ${summaryStats.currentValue.toLocaleString()}
                  </p>
                </div>
                <Target className="h-8 w-8 text-blue-500" />
              </div>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 dark:text-green-400">YoY Growth</p>
                  <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                    {summaryStats.growth >= 0 ? '+' : ''}{summaryStats.growth.toFixed(1)}%
                  </p>
                </div>
                {summaryStats.growth >= 0 ? (
                  <ArrowUpRight className="h-8 w-8 text-green-500" />
                ) : (
                  <ArrowDownRight className="h-8 w-8 text-red-500" />
                )}
              </div>
            </div>

            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-600 dark:text-purple-400">vs Industry</p>
                  <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                    {summaryStats.vsIndustry >= 0 ? '+' : ''}{summaryStats.vsIndustry.toFixed(1)}%
                  </p>
                </div>
                <Building className="h-8 w-8 text-purple-500" />
              </div>
            </div>

            <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-600 dark:text-orange-400">vs Target</p>
                  <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                    {summaryStats.vsTarget >= 0 ? '+' : ''}{summaryStats.vsTarget.toFixed(1)}%
                  </p>
                </div>
                <Target className="h-8 w-8 text-orange-500" />
              </div>
            </div>
          </div>

          {/* Chart */}
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              {renderChart()}
            </ResponsiveContainer>
          </div>

          {/* Insights */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-l-4 border-l-green-500">
              <CardContent className="p-4">
                <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">Strengths</h4>
                <ul className="text-sm text-green-800 dark:text-green-200 space-y-1">
                  {summaryStats.growth > 10 && (
                    <li>• Strong year-over-year growth</li>
                  )}
                  {summaryStats.vsIndustry > 5 && (
                    <li>• Outperforming industry average</li>
                  )}
                  {summaryStats.vsTarget > 0 && (
                    <li>• Meeting or exceeding targets</li>
                  )}
                </ul>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-orange-500">
              <CardContent className="p-4">
                <h4 className="font-semibold text-orange-900 dark:text-orange-100 mb-2">Opportunities</h4>
                <ul className="text-sm text-orange-800 dark:text-orange-200 space-y-1">
                  {summaryStats.growth < 5 && (
                    <li>• Consider growth strategies</li>
                  )}
                  {summaryStats.vsIndustry < 0 && (
                    <li>• Benchmark against top performers</li>
                  )}
                  {summaryStats.vsTarget < 0 && (
                    <li>• Adjust targets or strategies</li>
                  )}
                </ul>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
