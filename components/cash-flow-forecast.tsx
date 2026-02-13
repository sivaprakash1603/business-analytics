"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TrendingUp, TrendingDown, AlertTriangle, Wallet } from "lucide-react"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from "recharts"
import { generateCashFlowForecast, type CashFlowForecast } from "@/lib/cash-flow-forecast"

interface CashFlowForecastProps {
  incomeEntries: Array<{ source: string; amount: number; date: string }>
  spendingEntries: Array<{ reason: string; amount: number; date: string }>
}

export function CashFlowForecastView({ incomeEntries, spendingEntries }: CashFlowForecastProps) {
  const [forecastMonths, setForecastMonths] = useState(6)
  const [forecast, setForecast] = useState<CashFlowForecast | null>(null)

  useEffect(() => {
    if (incomeEntries.length > 0 || spendingEntries.length > 0) {
      const result = generateCashFlowForecast(incomeEntries, spendingEntries, forecastMonths)
      setForecast(result)
    }
  }, [incomeEntries, spendingEntries, forecastMonths])

  if (!forecast) {
    return (
      <Card className="glow-card backdrop-blur shadow-lg">
        <CardContent className="p-6 text-center text-gray-500">
          Add income and spending data to see cash flow projections.
        </CardContent>
      </Card>
    )
  }

  const { historical, projected, summary, warnings, recurringIncome, recurringExpenses } = forecast

  // Combine historical + projected for chart
  const chartData = [
    ...historical.map((d) => ({
      period: d.date,
      income: d.income,
      spending: d.spending,
      balance: d.cumulativeBalance,
      type: "actual" as const,
    })),
    ...projected.map((d) => ({
      period: d.date,
      income: d.income,
      spending: d.spending,
      balance: d.cumulativeBalance,
      type: "forecast" as const,
    })),
  ]

  const minBalance = Math.min(...chartData.map((d) => d.balance))
  const maxBalance = Math.max(...chartData.map((d) => d.balance))

  return (
    <Card className="glow-card backdrop-blur shadow-lg border-white/20 dark:border-gray-700/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
              <Wallet className="h-5 w-5 text-cyan-500" />
              Cash Flow Forecast
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-300">
              Projected cash position based on recurring transactions and trends
            </CardDescription>
          </div>
          <Select value={String(forecastMonths)} onValueChange={(v) => setForecastMonths(Number(v))}>
            <SelectTrigger className="w-36 bg-white dark:bg-gray-700 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3">3 Months</SelectItem>
              <SelectItem value="6">6 Months</SelectItem>
              <SelectItem value="12">12 Months</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Key metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 rounded-lg bg-cyan-50 dark:bg-cyan-950/20">
            <div className="text-xs text-gray-500">Avg Monthly Cash Flow</div>
            <div className={`text-lg font-bold ${(summary.avgMonthlyInflow - summary.avgMonthlyOutflow) >= 0 ? "text-green-600" : "text-red-600"}`}>
              ${Math.abs(summary.avgMonthlyInflow - summary.avgMonthlyOutflow).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              <span className="text-xs ml-1">{(summary.avgMonthlyInflow - summary.avgMonthlyOutflow) >= 0 ? "in" : "out"}</span>
            </div>
          </div>
          <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-950/20">
            <div className="text-xs text-gray-500">Monthly Burn Rate</div>
            <div className="text-lg font-bold text-purple-700 dark:text-purple-400">
              ${summary.burnRate.toLocaleString(undefined, { maximumFractionDigits: 0 })}/mo
            </div>
          </div>
          <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20">
            <div className="text-xs text-gray-500">Cash Runway</div>
            <div className="text-lg font-bold text-amber-700 dark:text-amber-400">
              {summary.runway === null ? "∞" : `${summary.runway.toFixed(1)} mo`}
            </div>
          </div>
          <div className={`p-3 rounded-lg ${summary.projectedBalance6Mo >= 0 ? "bg-green-50 dark:bg-green-950/20" : "bg-red-50 dark:bg-red-950/20"}`}>
            <div className="text-xs text-gray-500">Projected Balance</div>
            <div className={`text-lg font-bold ${summary.projectedBalance6Mo >= 0 ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"}`}>
              ${Math.abs(summary.projectedBalance6Mo).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
          </div>
        </div>

        {/* Warnings */}
        {warnings.length > 0 && (
          <div className="space-y-1">
            {warnings.map((w, i) => (
              <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-orange-50 dark:bg-orange-950/20 text-orange-800 dark:text-orange-300 text-xs">
                <AlertTriangle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                {w}
              </div>
            ))}
          </div>
        )}

        {/* Chart */}
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="colorSpending" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
              <XAxis dataKey="period" stroke="#6b7280" fontSize={11} />
              <YAxis stroke="#6b7280" fontSize={11} tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                formatter={(value: number, name: string) => [`$${Number(value).toLocaleString()}`, name]}
                contentStyle={{ backgroundColor: "rgba(255,255,255,0.95)", borderRadius: "8px", border: "1px solid #e5e7eb" }}
              />
              <Legend />
              {minBalance < 0 && <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="5 5" label="$0" />}
              <Area type="monotone" dataKey="income" stroke="#10b981" fill="url(#colorIncome)" strokeWidth={2} name="Income" />
              <Area type="monotone" dataKey="spending" stroke="#ef4444" fill="url(#colorSpending)" strokeWidth={2} name="Spending" />
              <Area type="monotone" dataKey="balance" stroke="#3b82f6" fill="none" strokeWidth={2} strokeDasharray={undefined} name="Balance" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Recurring items */}
        {(recurringIncome.length > 0 || recurringExpenses.length > 0) && (
          <div className="grid md:grid-cols-2 gap-3 pt-2 border-t border-gray-200 dark:border-gray-700">
            {recurringIncome.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-green-500" /> Recurring Income
                </h4>
                <div className="space-y-1">
                  {recurringIncome.slice(0, 5).map((r, i) => (
                    <div key={i} className="flex justify-between text-xs">
                      <span className="text-gray-700 dark:text-gray-300 truncate">{r.category}</span>
                      <span className="text-green-600 font-medium">${r.amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}/mo</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {recurringExpenses.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-1">
                  <TrendingDown className="h-3 w-3 text-red-500" /> Recurring Expenses
                </h4>
                <div className="space-y-1">
                  {recurringExpenses.slice(0, 5).map((r, i) => (
                    <div key={i} className="flex justify-between text-xs">
                      <span className="text-gray-700 dark:text-gray-300 truncate">{r.category}</span>
                      <span className="text-red-600 font-medium">${r.amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}/mo</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
