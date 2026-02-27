"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  EXPENSE_CATEGORIES,
  computeCategoryBreakdown,
  type CategoryBreakdown,
} from "@/lib/expense-categories"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts"
import { Tags, BarChart3, ChevronDown, ChevronRight } from "lucide-react"

interface SpendingEntry {
  reason: string
  amount: number
  date: string
  category?: string
  tags?: string[]
}

interface ExpenseCategoriesViewProps {
  spendingEntries: SpendingEntry[]
}

export default function ExpenseCategoriesView({ spendingEntries }: ExpenseCategoriesViewProps) {
  const [timeRange, setTimeRange] = useState("all")
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)

  // Filter entries by time range
  const filteredEntries = useMemo(() => {
    if (timeRange === "all") return spendingEntries
    const now = new Date()
    const start = new Date()
    switch (timeRange) {
      case "month":
        start.setMonth(now.getMonth() - 1)
        break
      case "quarter":
        start.setMonth(now.getMonth() - 3)
        break
      case "year":
        start.setFullYear(now.getFullYear() - 1)
        break
    }
    return spendingEntries.filter((e) => new Date(e.date) >= start)
  }, [spendingEntries, timeRange])

  const breakdown = useMemo(() => computeCategoryBreakdown(filteredEntries), [filteredEntries])
  const totalSpending = breakdown.reduce((sum, b) => sum + b.total, 0)

  // Pie chart data
  const pieData = breakdown.map((b) => ({
    name: b.category.name,
    value: b.total,
    color: b.category.color,
  }))

  // Collect all tags
  const allTags = useMemo(() => {
    const tagSet = new Set<string>()
    filteredEntries.forEach((e) => e.tags?.forEach((t) => tagSet.add(t)))
    return Array.from(tagSet).sort()
  }, [filteredEntries])

  return (
    <Card className="glow-card backdrop-blur shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
              <Tags className="h-5 w-5 text-orange-500" />
              Expense Categories & Tags
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-300">
              Spending breakdown by category with auto-categorization
            </CardDescription>
          </div>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="month">Last Month</SelectItem>
              <SelectItem value="quarter">Last Quarter</SelectItem>
              <SelectItem value="year">Last Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Pie Chart */}
        {breakdown.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [`$${value.toLocaleString()}`, "Amount"]}
                    contentStyle={{
                      backgroundColor: "rgba(255,255,255,0.95)",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend
                    formatter={(value: string) => (
                      <span className="text-xs text-gray-600 dark:text-gray-300">{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Top Categories */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Top Categories</h4>
              {breakdown.slice(0, 6).map((b) => (
                <div key={b.category.id} className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: b.category.color }}
                  />
                  <span className="text-sm flex-1 text-gray-700 dark:text-gray-300">
                    {b.category.icon} {b.category.name}
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    ${b.total.toLocaleString()}
                  </span>
                  <span className="text-xs text-gray-500 w-12 text-right">
                    {b.percentage.toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No spending data to categorize
          </div>
        )}

        {/* Detailed Breakdown */}
        {breakdown.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Detailed Breakdown
            </h4>
            {breakdown.map((b) => (
              <div key={b.category.id} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <button
                  onClick={() =>
                    setExpandedCategory(expandedCategory === b.category.id ? null : b.category.id)
                  }
                  className="w-full flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {expandedCategory === b.category.id ? (
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    )}
                    <span className="text-sm">{b.category.icon}</span>
                    <span className="font-medium text-gray-900 dark:text-white text-sm">
                      {b.category.name}
                    </span>
                    <Badge variant="secondary" className="text-[10px]">
                      {b.count} transaction{b.count !== 1 ? "s" : ""}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    {/* Progress bar */}
                    <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${b.percentage}%`,
                          backgroundColor: b.category.color,
                        }}
                      />
                    </div>
                    <span className="font-semibold text-sm text-gray-900 dark:text-white w-24 text-right">
                      ${b.total.toLocaleString()}
                    </span>
                  </div>
                </button>

                {/* Expanded entries */}
                {expandedCategory === b.category.id && (
                  <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                    {b.entries.slice(0, 10).map((entry, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between px-8 py-2 text-sm border-b border-gray-100 dark:border-gray-700/50 last:border-0"
                      >
                        <div>
                          <span className="text-gray-700 dark:text-gray-300">{entry.reason}</span>
                          <span className="ml-2 text-xs text-gray-400">
                            {new Date(entry.date).toLocaleDateString()}
                          </span>
                          {entry.tags?.map((tag) => (
                            <Badge key={tag} variant="outline" className="ml-1 text-[9px]">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        <span className="text-red-600 dark:text-red-400 font-medium">
                          -${entry.amount.toLocaleString()}
                        </span>
                      </div>
                    ))}
                    {b.entries.length > 10 && (
                      <div className="px-8 py-2 text-xs text-gray-500 text-center">
                        + {b.entries.length - 10} more entries
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Tags Section */}
        {allTags.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Used Tags</h4>
            <div className="flex flex-wrap gap-1">
              {allTags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
