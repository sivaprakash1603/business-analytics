"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileText, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Download } from "lucide-react"
import { generatePLStatement, type PLStatement, type PLLineItem } from "@/lib/profit-loss"

interface ProfitLossProps {
  incomeEntries: Array<{ source: string; amount: number; date: string }>
  spendingEntries: Array<{ reason: string; amount: number; date: string }>
  loanEntries: Array<{ amount: number; description: string; isPaid: boolean; date: string }>
}

function formatCurrency(amount: number): string {
  const abs = Math.abs(amount)
  const formatted = abs.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })
  if (amount < 0) return `($${formatted})`
  return `$${formatted}`
}

function PLRow({ item, isNegativeColor }: { item: PLLineItem; isNegativeColor?: boolean }) {
  const isNeg = item.amount < 0
  return (
    <div
      className={`flex justify-between items-center py-1.5 px-2 ${
        item.isTotal
          ? "border-t-2 border-b-2 border-gray-800 dark:border-gray-200 font-bold text-base"
          : item.isSubtotal
          ? "border-t border-gray-300 dark:border-gray-600 font-semibold text-sm"
          : "text-sm"
      }`}
      style={{ paddingLeft: item.indent ? `${item.indent * 1.5}rem` : undefined }}
    >
      <span className={`${item.isTotal ? "text-gray-900 dark:text-white" : "text-gray-700 dark:text-gray-300"}`}>
        {item.label}
      </span>
      <span
        className={`font-mono ${
          item.isTotal
            ? item.amount >= 0
              ? "text-green-700 dark:text-green-400"
              : "text-red-700 dark:text-red-400"
            : isNeg || isNegativeColor
            ? "text-red-600 dark:text-red-400"
            : "text-gray-900 dark:text-gray-200"
        }`}
      >
        {formatCurrency(item.amount)}
      </span>
    </div>
  )
}

export function ProfitLossStatement({ incomeEntries, spendingEntries, loanEntries }: ProfitLossProps) {
  const [period, setPeriod] = useState<"month" | "quarter" | "year">("month")
  const [statement, setStatement] = useState<PLStatement | null>(null)

  useEffect(() => {
    const pl = generatePLStatement(incomeEntries, spendingEntries, loanEntries, period)
    setStatement(pl)
  }, [incomeEntries, spendingEntries, loanEntries, period])

  if (!statement) return null

  const { sections, totals, previousPeriod } = statement

  const revenueChange = previousPeriod
    ? previousPeriod.totalRevenue > 0
      ? ((totals.totalRevenue - previousPeriod.totalRevenue) / previousPeriod.totalRevenue) * 100
      : 0
    : null

  const netIncomeChange = previousPeriod
    ? previousPeriod.netIncome !== 0
      ? ((totals.netIncome - previousPeriod.netIncome) / Math.abs(previousPeriod.netIncome)) * 100
      : 0
    : null

  const downloadCSV = () => {
    const rows: string[] = [
      `"${statement.title}"`,
      `"Period: ${statement.period}"`,
      "",
      '"Category","Amount"',
      "",
      '"REVENUE"',
    ]
    sections.revenue.forEach((item) => rows.push(`"${item.label}","${item.amount}"`))
    rows.push("", '"COST OF GOODS SOLD"')
    sections.costOfGoodsSold.forEach((item) => rows.push(`"${item.label}","${item.amount}"`))
    rows.push("", `"${sections.grossProfit.label}","${sections.grossProfit.amount}"`)
    rows.push("", '"OPERATING EXPENSES"')
    sections.operatingExpenses.forEach((item) => rows.push(`"${item.label}","${item.amount}"`))
    rows.push("", `"${sections.operatingIncome.label}","${sections.operatingIncome.amount}"`)
    if (sections.otherExpenses.length > 0) {
      rows.push("", '"OTHER EXPENSES"')
      sections.otherExpenses.forEach((item) => rows.push(`"${item.label}","${item.amount}"`))
    }
    rows.push("", `"${sections.netIncome.label}","${sections.netIncome.amount}"`)
    rows.push("", "", '"MARGINS"')
    rows.push(`"Gross Margin","${totals.grossMargin.toFixed(1)}%"`)
    rows.push(`"Operating Margin","${totals.operatingMargin.toFixed(1)}%"`)
    rows.push(`"Net Margin","${totals.netMargin.toFixed(1)}%"`)

    const blob = new Blob([rows.join("\n")], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `PL_Statement_${statement.period.replace(/\s+/g, "_")}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Card className="glow-card backdrop-blur shadow-lg border-white/20 dark:border-gray-700/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
              <FileText className="h-5 w-5 text-indigo-500" />
              Profit & Loss Statement
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-300">
              {statement.period}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value={period} onValueChange={(v) => setPeriod(v as "month" | "quarter" | "year")}>
              <SelectTrigger className="w-32 bg-white dark:bg-gray-700 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">Monthly</SelectItem>
                <SelectItem value="quarter">Quarterly</SelectItem>
                <SelectItem value="year">Yearly</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={downloadCSV}>
              <Download className="h-4 w-4 mr-1" />
              CSV
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Key Metrics Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/20">
            <div className="text-xs text-gray-500 dark:text-gray-400">Revenue</div>
            <div className="text-lg font-bold text-green-700 dark:text-green-400">
              ${totals.totalRevenue.toLocaleString()}
            </div>
            {revenueChange !== null && (
              <div className={`flex items-center gap-0.5 text-[10px] ${revenueChange >= 0 ? "text-green-600" : "text-red-600"}`}>
                {revenueChange >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {Math.abs(revenueChange).toFixed(1)}% vs prior
              </div>
            )}
          </div>
          <div className={`p-3 rounded-lg ${totals.netIncome >= 0 ? "bg-blue-50 dark:bg-blue-950/20" : "bg-red-50 dark:bg-red-950/20"}`}>
            <div className="text-xs text-gray-500 dark:text-gray-400">Net Income</div>
            <div className={`text-lg font-bold ${totals.netIncome >= 0 ? "text-blue-700 dark:text-blue-400" : "text-red-700 dark:text-red-400"}`}>
              {formatCurrency(totals.netIncome)}
            </div>
            {netIncomeChange !== null && (
              <div className={`flex items-center gap-0.5 text-[10px] ${netIncomeChange >= 0 ? "text-green-600" : "text-red-600"}`}>
                {netIncomeChange >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {Math.abs(netIncomeChange).toFixed(1)}% vs prior
              </div>
            )}
          </div>
          <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-950/20">
            <div className="text-xs text-gray-500 dark:text-gray-400">Gross Margin</div>
            <div className="text-lg font-bold text-purple-700 dark:text-purple-400">
              {totals.grossMargin.toFixed(1)}%
            </div>
          </div>
          <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20">
            <div className="text-xs text-gray-500 dark:text-gray-400">Net Margin</div>
            <div className={`text-lg font-bold ${totals.netMargin >= 0 ? "text-amber-700 dark:text-amber-400" : "text-red-700 dark:text-red-400"}`}>
              {totals.netMargin.toFixed(1)}%
            </div>
          </div>
        </div>

        {/* P&L Table */}
        <div className="border rounded-lg overflow-hidden dark:border-gray-700">
          {/* Revenue */}
          <div className="bg-green-50/50 dark:bg-green-950/10 px-3 py-2 font-semibold text-sm text-green-800 dark:text-green-300 border-b dark:border-gray-700">
            REVENUE
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {sections.revenue.map((item, i) => (
              <PLRow key={`rev-${i}`} item={item} />
            ))}
          </div>

          {/* COGS */}
          {sections.costOfGoodsSold.length > 0 && (
            <>
              <div className="bg-orange-50/50 dark:bg-orange-950/10 px-3 py-2 font-semibold text-sm text-orange-800 dark:text-orange-300 border-b border-t dark:border-gray-700">
                COST OF GOODS SOLD
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {sections.costOfGoodsSold.map((item, i) => (
                  <PLRow key={`cogs-${i}`} item={item} isNegativeColor />
                ))}
              </div>
            </>
          )}

          {/* Gross Profit */}
          <div className="bg-gray-50 dark:bg-gray-800/50">
            <PLRow item={sections.grossProfit} />
          </div>

          {/* Operating Expenses */}
          <div className="bg-red-50/50 dark:bg-red-950/10 px-3 py-2 font-semibold text-sm text-red-800 dark:text-red-300 border-b border-t dark:border-gray-700">
            OPERATING EXPENSES
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {sections.operatingExpenses.map((item, i) => (
              <PLRow key={`opex-${i}`} item={item} isNegativeColor />
            ))}
          </div>

          {/* Operating Income */}
          <div className="bg-gray-50 dark:bg-gray-800/50">
            <PLRow item={sections.operatingIncome} />
          </div>

          {/* Other Expenses */}
          {sections.otherExpenses.length > 0 && (
            <>
              <div className="bg-gray-100/50 dark:bg-gray-900/30 px-3 py-2 font-semibold text-sm text-gray-700 dark:text-gray-300 border-b border-t dark:border-gray-700">
                OTHER EXPENSES
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {sections.otherExpenses.map((item, i) => (
                  <PLRow key={`other-${i}`} item={item} isNegativeColor />
                ))}
              </div>
            </>
          )}

          {/* Net Income */}
          <div className={`${totals.netIncome >= 0 ? "bg-green-50 dark:bg-green-950/20" : "bg-red-50 dark:bg-red-950/20"}`}>
            <PLRow item={sections.netIncome} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
