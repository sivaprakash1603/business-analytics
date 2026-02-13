"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, DollarSign, CreditCard, Eye, Clock, Building2 } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

interface SharedData {
  label: string
  companyName: string
  createdAt: string
  expiresAt: string
  data: {
    income?: Array<{ source: string; amount: number; date: string }>
    spending?: Array<{ reason: string; amount: number; date: string }>
    loans?: Array<{ description: string; amount: number; isPaid: boolean; date: string }>
  }
}

export default function SharedDashboardPage() {
  const params = useParams()
  const token = params.token as string
  const [sharedData, setSharedData] = useState<SharedData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchShared() {
      try {
        const res = await fetch(`/api/share?token=${encodeURIComponent(token)}`)
        if (!res.ok) {
          const err = await res.json()
          setError(err.error || "Failed to load shared dashboard")
          return
        }
        const data = await res.json()
        setSharedData(data)
      } catch {
        setError("Failed to load shared dashboard")
      } finally {
        setLoading(false)
      }
    }
    if (token) fetchShared()
  }, [token])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <div className="text-4xl mb-4">🔗</div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              {error.includes("expired") ? "Link Expired" : "Link Not Found"}
            </h2>
            <p className="text-gray-500">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!sharedData) return null

  const { data, label, companyName, expiresAt } = sharedData
  const income = data.income || []
  const spending = data.spending || []
  const loans = data.loans || []

  const totalIncome = income.reduce((s, e) => s + e.amount, 0)
  const totalSpending = spending.reduce((s, e) => s + e.amount, 0)
  const totalProfit = totalIncome - totalSpending
  const totalLoans = loans.filter((l) => !l.isPaid).reduce((s, l) => s + l.amount, 0)

  // Build chart data (monthly)
  const monthlyData: Record<string, { income: number; spending: number }> = {}
  income.forEach((e) => {
    const m = new Date(e.date).toLocaleDateString("en-US", { month: "short", year: "2-digit" })
    if (!monthlyData[m]) monthlyData[m] = { income: 0, spending: 0 }
    monthlyData[m].income += e.amount
  })
  spending.forEach((e) => {
    const m = new Date(e.date).toLocaleDateString("en-US", { month: "short", year: "2-digit" })
    if (!monthlyData[m]) monthlyData[m] = { income: 0, spending: 0 }
    monthlyData[m].spending += e.amount
  })
  const chartData = Object.entries(monthlyData)
    .sort((a, b) => {
      // parse "Jan '24" style
      const da = new Date(a[0])
      const db = new Date(b[0])
      return da.getTime() - db.getTime()
    })
    .map(([period, vals]) => ({
      period,
      income: vals.income,
      spending: vals.spending,
      profit: vals.income - vals.spending,
    }))

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-6 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Building2 className="h-5 w-5" />
                <span className="text-sm opacity-80">{companyName || "Business Dashboard"}</span>
              </div>
              <h1 className="text-2xl font-bold">{label}</h1>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 text-sm opacity-80">
                <Eye className="h-4 w-4" />
                Read-only view
              </div>
              <div className="flex items-center gap-1 text-xs opacity-60 mt-1">
                <Clock className="h-3 w-3" />
                Expires {new Date(expiresAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span className="text-xs text-gray-500">Total Income</span>
              </div>
              <div className="text-2xl font-bold text-green-600 mt-1">${totalIncome.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-red-500" />
                <span className="text-xs text-gray-500">Total Spending</span>
              </div>
              <div className="text-2xl font-bold text-red-600 mt-1">${totalSpending.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-blue-500" />
                <span className="text-xs text-gray-500">Net Profit</span>
              </div>
              <div className={`text-2xl font-bold ${totalProfit >= 0 ? "text-blue-600" : "text-red-600"} mt-1`}>
                ${totalProfit.toLocaleString()}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-orange-500" />
                <span className="text-xs text-gray-500">Outstanding Loans</span>
              </div>
              <div className="text-2xl font-bold text-orange-600 mt-1">${totalLoans.toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>

        {/* Chart */}
        {chartData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Financial Overview</CardTitle>
              <CardDescription>Income, spending, and profit over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
                    <XAxis dataKey="period" stroke="#6b7280" fontSize={12} />
                    <YAxis stroke="#6b7280" fontSize={12} tickFormatter={(v: number) => `$${v}`} />
                    <Tooltip formatter={(v: number, n: string) => [`$${Number(v).toLocaleString()}`, n]} />
                    <Legend />
                    <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} name="Income" />
                    <Line type="monotone" dataKey="spending" stroke="#ef4444" strokeWidth={2} name="Spending" />
                    <Line type="monotone" dataKey="profit" stroke="#3b82f6" strokeWidth={2} name="Profit" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Transactions */}
        <div className="grid md:grid-cols-2 gap-6">
          {income.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Income Entries</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {income
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .slice(0, 20)
                    .map((e, i) => (
                      <div key={i} className="flex justify-between items-center py-1.5 border-b border-gray-100 dark:border-gray-800 last:border-0">
                        <div>
                          <div className="text-sm font-medium">{e.source}</div>
                          <div className="text-xs text-gray-500">{new Date(e.date).toLocaleDateString()}</div>
                        </div>
                        <span className="text-sm font-semibold text-green-600">+${e.amount.toLocaleString()}</span>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}

          {spending.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Spending Entries</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {spending
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .slice(0, 20)
                    .map((e, i) => (
                      <div key={i} className="flex justify-between items-center py-1.5 border-b border-gray-100 dark:border-gray-800 last:border-0">
                        <div>
                          <div className="text-sm font-medium">{e.reason}</div>
                          <div className="text-xs text-gray-500">{new Date(e.date).toLocaleDateString()}</div>
                        </div>
                        <span className="text-sm font-semibold text-red-600">-${e.amount.toLocaleString()}</span>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Footer */}
        <div className="text-center py-4 text-xs text-gray-400">
          Shared via Business Analytics Dashboard • Read-only view
        </div>
      </div>
    </div>
  )
}
