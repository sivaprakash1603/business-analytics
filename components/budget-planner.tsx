"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import {
  Target,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  DollarSign,
  BarChart3,
} from "lucide-react"

interface Budget {
  id: string
  category: string
  targetAmount: number
  period: string
  month: number | null
  quarter: number | null
  year: number
  alertThreshold: number
}

interface SpendingEntry {
  reason: string
  amount: number
  date: string
  category?: string
}

interface BudgetPlannerProps {
  userId: string
  spendingEntries: SpendingEntry[]
}

const BUDGET_CATEGORIES = [
  "Payroll", "Marketing", "Rent", "Utilities", "Insurance", "Subscriptions",
  "Travel", "Office Supplies", "Software", "Professional Services",
  "Equipment", "Meals & Entertainment", "Transportation", "Miscellaneous",
]

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

export default function BudgetPlanner({ userId, spendingEntries }: BudgetPlannerProps) {
  const { toast } = useToast()
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  // Form state
  const [formCategory, setFormCategory] = useState("")
  const [formTarget, setFormTarget] = useState("")
  const [formPeriod, setFormPeriod] = useState("monthly")
  const [formMonth, setFormMonth] = useState(String(new Date().getMonth() + 1))
  const [formQuarter, setFormQuarter] = useState(String(Math.ceil((new Date().getMonth() + 1) / 3)))
  const [formYear, setFormYear] = useState(String(new Date().getFullYear()))
  const [formThreshold, setFormThreshold] = useState("80")

  const loadBudgets = useCallback(async () => {
    try {
      const res = await fetch(`/api/budgets?userId=${userId}`)
      const data = await res.json()
      setBudgets(data.budgets || [])
    } catch (err) {
      console.error("Failed to load budgets:", err)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    if (userId) loadBudgets()
  }, [userId, loadBudgets])

  // Calculate actuals per category for current period
  const categoryActuals = useMemo(() => {
    const actuals: Record<string, number> = {}
    const now = new Date()

    spendingEntries.forEach((entry) => {
      const entryDate = new Date(entry.date)
      // Map spending reason to a category (simple keyword match)
      const cat = entry.category || mapReasonToCategory(entry.reason)
      if (!actuals[cat]) actuals[cat] = 0

      // Only count current month spending
      if (
        entryDate.getMonth() === now.getMonth() &&
        entryDate.getFullYear() === now.getFullYear()
      ) {
        actuals[cat] += entry.amount
      }
    })
    return actuals
  }, [spendingEntries])

  const createBudget = async () => {
    if (!formCategory || !formTarget) {
      toast({ title: "Error", description: "Category and target amount are required.", variant: "destructive" })
      return
    }

    try {
      const res = await fetch("/api/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          category: formCategory,
          targetAmount: parseFloat(formTarget),
          period: formPeriod,
          month: formPeriod === "monthly" ? Number(formMonth) : null,
          quarter: formPeriod === "quarterly" ? Number(formQuarter) : null,
          year: Number(formYear),
          alertThreshold: Number(formThreshold),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error("Failed")
      toast({
        title: "Success",
        description: data.updated ? "Budget updated!" : "Budget created!",
      })
      setFormCategory("")
      setFormTarget("")
      setShowForm(false)
      loadBudgets()
    } catch {
      toast({ title: "Error", description: "Failed to create budget.", variant: "destructive" })
    }
  }

  const deleteBudget = async (id: string) => {
    try {
      const res = await fetch("/api/budgets", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, userId }),
      })
      if (!res.ok) throw new Error("Failed")
      toast({ title: "Deleted", description: "Budget removed." })
      loadBudgets()
    } catch {
      toast({ title: "Error", description: "Failed to delete budget.", variant: "destructive" })
    }
  }

  // Get budget status with actual spending
  const getBudgetStatus = (budget: Budget) => {
    const actual = categoryActuals[budget.category] || 0
    const percentage = budget.targetAmount > 0 ? (actual / budget.targetAmount) * 100 : 0
    const remaining = budget.targetAmount - actual

    let status: "on-track" | "warning" | "over-budget" = "on-track"
    if (percentage >= 100) status = "over-budget"
    else if (percentage >= budget.alertThreshold) status = "warning"

    return { actual, percentage, remaining, status }
  }

  const totalBudget = budgets.reduce((sum, b) => sum + b.targetAmount, 0)
  const totalActual = budgets.reduce((sum, b) => sum + (categoryActuals[b.category] || 0), 0)
  const overallPercentage = totalBudget > 0 ? (totalActual / totalBudget) * 100 : 0
  const overBudgetCount = budgets.filter((b) => getBudgetStatus(b).status === "over-budget").length
  const warningCount = budgets.filter((b) => getBudgetStatus(b).status === "warning").length

  return (
    <Card className="glow-card backdrop-blur shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
              <Target className="h-5 w-5 text-emerald-500" />
              Budget Planner
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-300">
              Set budgets per category and track actuals vs. targets
            </CardDescription>
          </div>
          <Button size="sm" onClick={() => setShowForm(!showForm)}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
            <Plus className="h-4 w-4 mr-1" />
            Set Budget
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30">
            <div className="text-xs text-blue-600 dark:text-blue-400">Total Budget</div>
            <div className="text-xl font-bold text-blue-700 dark:text-blue-300">
              ${totalBudget.toLocaleString()}
            </div>
          </div>
          <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-950/30">
            <div className="text-xs text-purple-600 dark:text-purple-400">Actual Spending</div>
            <div className="text-xl font-bold text-purple-700 dark:text-purple-300">
              ${totalActual.toLocaleString()}
            </div>
          </div>
          <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30">
            <div className="text-xs text-emerald-600 dark:text-emerald-400">Budget Used</div>
            <div className="text-xl font-bold text-emerald-700 dark:text-emerald-300">
              {overallPercentage.toFixed(1)}%
            </div>
          </div>
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/30">
            <div className="text-xs text-red-600 dark:text-red-400">Alerts</div>
            <div className="text-xl font-bold text-red-700 dark:text-red-300">
              {overBudgetCount + warningCount}
            </div>
          </div>
        </div>

        {/* Alerts Banner */}
        {(overBudgetCount > 0 || warningCount > 0) && (
          <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800">
            <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200 text-sm">
              <AlertTriangle className="h-4 w-4" />
              <span>
                {overBudgetCount > 0 && `${overBudgetCount} categor${overBudgetCount === 1 ? "y" : "ies"} over budget. `}
                {warningCount > 0 && `${warningCount} categor${warningCount === 1 ? "y" : "ies"} approaching limit.`}
              </span>
            </div>
          </div>
        )}

        {/* Create Form */}
        {showForm && (
          <Card className="border-2 border-dashed border-emerald-300 dark:border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/20">
            <CardContent className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={formCategory} onValueChange={setFormCategory}>
                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>
                      {BUDGET_CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Target Amount ($)</Label>
                  <Input type="number" placeholder="0.00" value={formTarget} onChange={(e) => setFormTarget(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Alert Threshold (%)</Label>
                  <Input type="number" placeholder="80" value={formThreshold} onChange={(e) => setFormThreshold(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Period</Label>
                  <Select value={formPeriod} onValueChange={setFormPeriod}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {formPeriod === "monthly" ? (
                  <div className="space-y-2">
                    <Label>Month</Label>
                    <Select value={formMonth} onValueChange={setFormMonth}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {MONTHS.map((m, i) => (
                          <SelectItem key={m} value={String(i + 1)}>{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label>Quarter</Label>
                    <Select value={formQuarter} onValueChange={setFormQuarter}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Q1 (Jan-Mar)</SelectItem>
                        <SelectItem value="2">Q2 (Apr-Jun)</SelectItem>
                        <SelectItem value="3">Q3 (Jul-Sep)</SelectItem>
                        <SelectItem value="4">Q4 (Oct-Dec)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Year</Label>
                  <Input type="number" value={formYear} onChange={(e) => setFormYear(e.target.value)} />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button onClick={createBudget} className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
                  Save Budget
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Budget List */}
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading...</div>
        ) : budgets.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No budgets set yet. Create one to track your spending.
          </div>
        ) : (
          <div className="space-y-3">
            {budgets.map((budget) => {
              const { actual, percentage, remaining, status } = getBudgetStatus(budget)
              return (
                <div
                  key={budget.id}
                  className={`p-4 border rounded-lg transition-all ${
                    status === "over-budget"
                      ? "border-red-300 dark:border-red-700 bg-red-50/50 dark:bg-red-950/20"
                      : status === "warning"
                      ? "border-yellow-300 dark:border-yellow-700 bg-yellow-50/50 dark:bg-yellow-950/20"
                      : "border-gray-200 dark:border-gray-700"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-gray-400" />
                      <span className="font-medium text-gray-900 dark:text-white">{budget.category}</span>
                      <Badge variant="secondary" className="text-[10px]">
                        {budget.period === "monthly"
                          ? MONTHS[(budget.month || 1) - 1]
                          : `Q${budget.quarter}`}{" "}
                        {budget.year}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      {status === "over-budget" && (
                        <Badge className="bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Over Budget
                        </Badge>
                      )}
                      {status === "warning" && (
                        <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Warning
                        </Badge>
                      )}
                      {status === "on-track" && (
                        <Badge className="bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          On Track
                        </Badge>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => deleteBudget(budget.id)}>
                        <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-500" />
                      </Button>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-1">
                    <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          status === "over-budget"
                            ? "bg-red-500"
                            : status === "warning"
                            ? "bg-yellow-500"
                            : "bg-emerald-500"
                        }`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>
                      Spent: ${actual.toLocaleString()} / ${budget.targetAmount.toLocaleString()}
                    </span>
                    <span>
                      {percentage.toFixed(1)}% used
                      {remaining > 0 && ` • $${remaining.toLocaleString()} remaining`}
                      {remaining < 0 && ` • $${Math.abs(remaining).toLocaleString()} over`}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Helper: Map spending reason to budget category via keyword matching
function mapReasonToCategory(reason: string): string {
  const lower = (reason || "").toLowerCase()
  const mappings: [string[], string][] = [
    [["payroll", "salary", "wages", "employee"], "Payroll"],
    [["marketing", "ads", "advertising", "promotion"], "Marketing"],
    [["rent", "lease", "office space"], "Rent"],
    [["utility", "electric", "water", "gas", "internet", "phone"], "Utilities"],
    [["insurance"], "Insurance"],
    [["subscription", "saas", "software"], "Subscriptions"],
    [["travel", "flight", "hotel", "airfare"], "Travel"],
    [["office", "supplies", "stationery"], "Office Supplies"],
    [["software", "license", "tool"], "Software"],
    [["consult", "professional", "legal", "accounting"], "Professional Services"],
    [["equipment", "hardware", "machine"], "Equipment"],
    [["meal", "food", "dinner", "lunch", "entertainment"], "Meals & Entertainment"],
    [["transport", "uber", "taxi", "fuel", "gas"], "Transportation"],
  ]
  for (const [keywords, cat] of mappings) {
    if (keywords.some((k) => lower.includes(k))) return cat
  }
  return "Miscellaneous"
}
