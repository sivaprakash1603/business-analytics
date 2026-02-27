"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import {
  RefreshCw,
  Plus,
  Trash2,
  Calendar,
  DollarSign,
  ArrowUpCircle,
  ArrowDownCircle,
  Play,
  Pause,
  Clock,
} from "lucide-react"

interface RecurringTransaction {
  id: string
  type: "income" | "spending"
  name: string
  amount: number
  frequency: string
  startDate: string
  endDate: string | null
  category: string | null
  currency: string
  isActive: boolean
  lastProcessed: string | null
  nextDue: string
  createdAt: string
}

interface RecurringTransactionsProps {
  userId: string
}

const FREQUENCY_OPTIONS = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Bi-weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "yearly", label: "Yearly" },
]

const CATEGORY_OPTIONS = [
  "Rent", "Subscriptions", "Retainers", "Payroll", "Insurance",
  "Utilities", "Marketing", "Loan Payment", "Revenue", "Consulting", "Other"
]

export default function RecurringTransactions({ userId }: RecurringTransactionsProps) {
  const { toast } = useToast()
  const [transactions, setTransactions] = useState<RecurringTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [processing, setProcessing] = useState(false)

  // Form state
  const [formType, setFormType] = useState<"income" | "spending">("spending")
  const [formName, setFormName] = useState("")
  const [formAmount, setFormAmount] = useState("")
  const [formFrequency, setFormFrequency] = useState("monthly")
  const [formCategory, setFormCategory] = useState("")
  const [formStartDate, setFormStartDate] = useState(new Date().toISOString().split("T")[0])
  const [formEndDate, setFormEndDate] = useState("")

  const loadTransactions = useCallback(async () => {
    try {
      const res = await fetch(`/api/recurring-transactions?userId=${userId}`)
      const data = await res.json()
      setTransactions(data.entries || [])
    } catch (err) {
      console.error("Failed to load recurring transactions:", err)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    if (userId) loadTransactions()
  }, [userId, loadTransactions])

  const createTransaction = async () => {
    if (!formName || !formAmount) {
      toast({ title: "Error", description: "Name and amount are required.", variant: "destructive" })
      return
    }

    try {
      const res = await fetch("/api/recurring-transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          type: formType,
          name: formName,
          amount: parseFloat(formAmount),
          frequency: formFrequency,
          category: formCategory || null,
          startDate: new Date(formStartDate).toISOString(),
          endDate: formEndDate ? new Date(formEndDate).toISOString() : null,
        }),
      })
      if (!res.ok) throw new Error("Failed to create")
      toast({ title: "Success", description: "Recurring transaction created!" })
      setFormName("")
      setFormAmount("")
      setFormCategory("")
      setFormEndDate("")
      setShowForm(false)
      loadTransactions()
    } catch {
      toast({ title: "Error", description: "Failed to create recurring transaction.", variant: "destructive" })
    }
  }

  const toggleActive = async (txn: RecurringTransaction) => {
    try {
      const res = await fetch("/api/recurring-transactions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: txn.id, userId, isActive: !txn.isActive }),
      })
      if (!res.ok) throw new Error("Failed to update")
      loadTransactions()
    } catch {
      toast({ title: "Error", description: "Failed to update.", variant: "destructive" })
    }
  }

  const deleteTransaction = async (id: string) => {
    try {
      const res = await fetch("/api/recurring-transactions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, userId }),
      })
      if (!res.ok) throw new Error("Failed to delete")
      toast({ title: "Success", description: "Recurring transaction deleted." })
      loadTransactions()
    } catch {
      toast({ title: "Error", description: "Failed to delete.", variant: "destructive" })
    }
  }

  const processNow = async () => {
    setProcessing(true)
    try {
      const res = await fetch("/api/cron/process-recurring", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })
      const data = await res.json()
      if (!res.ok) throw new Error("Failed")
      toast({
        title: "Processed",
        description: `${data.processed} of ${data.total} due transactions processed.`,
      })
      loadTransactions()
    } catch {
      toast({ title: "Error", description: "Failed to process recurring transactions.", variant: "destructive" })
    } finally {
      setProcessing(false)
    }
  }

  const getFrequencyLabel = (freq: string) =>
    FREQUENCY_OPTIONS.find((f) => f.value === freq)?.label || freq

  const activeCount = transactions.filter((t) => t.isActive).length
  const monthlyTotal = transactions
    .filter((t) => t.isActive)
    .reduce((sum, t) => {
      const multiplier =
        t.frequency === "daily" ? 30 :
        t.frequency === "weekly" ? 4.33 :
        t.frequency === "biweekly" ? 2.17 :
        t.frequency === "monthly" ? 1 :
        t.frequency === "quarterly" ? 1 / 3 :
        t.frequency === "yearly" ? 1 / 12 : 1
      return sum + t.amount * multiplier
    }, 0)

  const monthlyIncome = transactions
    .filter((t) => t.isActive && t.type === "income")
    .reduce((sum, t) => {
      const multiplier = t.frequency === "daily" ? 30 : t.frequency === "weekly" ? 4.33 : t.frequency === "biweekly" ? 2.17 : t.frequency === "monthly" ? 1 : t.frequency === "quarterly" ? 1/3 : t.frequency === "yearly" ? 1/12 : 1
      return sum + t.amount * multiplier
    }, 0)

  const monthlySpending = transactions
    .filter((t) => t.isActive && t.type === "spending")
    .reduce((sum, t) => {
      const multiplier = t.frequency === "daily" ? 30 : t.frequency === "weekly" ? 4.33 : t.frequency === "biweekly" ? 2.17 : t.frequency === "monthly" ? 1 : t.frequency === "quarterly" ? 1/3 : t.frequency === "yearly" ? 1/12 : 1
      return sum + t.amount * multiplier
    }, 0)

  return (
    <Card className="glow-card backdrop-blur shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
              <RefreshCw className="h-5 w-5 text-purple-500" />
              Recurring Transactions
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-300">
              Auto-create income/spending entries on a schedule
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={processNow} disabled={processing}>
              <Play className="h-4 w-4 mr-1" />
              {processing ? "Processing..." : "Process Due"}
            </Button>
            <Button size="sm" onClick={() => setShowForm(!showForm)}
              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
              <Plus className="h-4 w-4 mr-1" />
              Add Rule
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30">
            <div className="text-xs text-blue-600 dark:text-blue-400">Active Rules</div>
            <div className="text-xl font-bold text-blue-700 dark:text-blue-300">{activeCount}</div>
          </div>
          <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/30">
            <div className="text-xs text-green-600 dark:text-green-400">Monthly Recurring Income</div>
            <div className="text-xl font-bold text-green-700 dark:text-green-300">
              ${monthlyIncome.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </div>
          </div>
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/30">
            <div className="text-xs text-red-600 dark:text-red-400">Monthly Recurring Spending</div>
            <div className="text-xl font-bold text-red-700 dark:text-red-300">
              ${monthlySpending.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </div>
          </div>
        </div>

        {/* Create Form */}
        {showForm && (
          <Card className="border-2 border-dashed border-purple-300 dark:border-purple-600 bg-purple-50/50 dark:bg-purple-950/20">
            <CardContent className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={formType} onValueChange={(v: "income" | "spending") => setFormType(v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="income">Income</SelectItem>
                      <SelectItem value="spending">Spending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input placeholder="e.g. Monthly rent" value={formName} onChange={(e) => setFormName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Amount ($)</Label>
                  <Input type="number" placeholder="0.00" value={formAmount} onChange={(e) => setFormAmount(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Frequency</Label>
                  <Select value={formFrequency} onValueChange={setFormFrequency}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {FREQUENCY_OPTIONS.map((f) => (
                        <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={formCategory} onValueChange={setFormCategory}>
                    <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                    <SelectContent>
                      {CATEGORY_OPTIONS.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input type="date" value={formStartDate} onChange={(e) => setFormStartDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>End Date (Optional)</Label>
                  <Input type="date" value={formEndDate} onChange={(e) => setFormEndDate(e.target.value)} />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button onClick={createTransaction} className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                  Create Rule
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Transaction List */}
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading...</div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No recurring transactions yet. Add one to automate your entries.
          </div>
        ) : (
          <div className="space-y-2">
            {transactions.map((txn) => (
              <div
                key={txn.id}
                className={`flex items-center justify-between p-4 border rounded-lg transition-all ${
                  txn.isActive
                    ? "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                    : "border-gray-100 dark:border-gray-800 opacity-60"
                }`}
              >
                <div className="flex items-center gap-3">
                  {txn.type === "income" ? (
                    <ArrowUpCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <ArrowDownCircle className="h-5 w-5 text-red-500" />
                  )}
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">{txn.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                      <Clock className="h-3 w-3" />
                      {getFrequencyLabel(txn.frequency)}
                      {txn.category && (
                        <Badge variant="secondary" className="text-[10px]">{txn.category}</Badge>
                      )}
                      {txn.nextDue && (
                        <span>Next: {new Date(txn.nextDue).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`font-semibold ${txn.type === "income" ? "text-green-600" : "text-red-600"}`}>
                    {txn.type === "income" ? "+" : "-"}${txn.amount.toLocaleString()}
                  </span>
                  <Switch checked={txn.isActive} onCheckedChange={() => toggleActive(txn)} />
                  <Button variant="ghost" size="sm" onClick={() => deleteTransaction(txn.id)}>
                    <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-500" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
