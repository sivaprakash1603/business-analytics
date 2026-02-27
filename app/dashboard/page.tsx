"use client"

import DashboardLayout from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/components/auth-provider"
import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { TrendingUp, TrendingDown, DollarSign, CreditCard, Plus, Filter, Trash2, CheckCircle, AlertTriangle, Activity, Download } from "lucide-react"
import { RealTimeDataProvider } from "@/components/realtime-data-provider"
import { MagazineCard } from "@/components/magazine-card"
import { DownloadReportDialog } from "@/components/download-report-dialog"
import { InteractiveChart } from "@/components/interactive-chart"
import { ComparativeAnalysis } from "@/components/comparative-analysis"
import { CustomDashboardBuilder } from "@/components/custom-dashboard-builder"
import { GoalTracking } from "@/components/goal-tracking"
import { ProfitLossStatement } from "@/components/profit-loss-statement"
import { CashFlowForecastView } from "@/components/cash-flow-forecast"
import { DashboardSharing } from "@/components/dashboard-sharing"
import { ScheduledReports } from "@/components/scheduled-reports"
import { exportIncomeCSV, exportSpendingCSV, exportLoansCSV } from "@/lib/csv-export"
import RecurringTransactions from "@/components/recurring-transactions"
import InvoiceManager from "@/components/invoice-manager"
import BudgetPlanner from "@/components/budget-planner"
import CurrencyConverter from "@/components/currency-converter"
import ExpenseCategoriesView from "@/components/expense-categories"
import ReceiptUpload from "@/components/receipt-upload"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"


// Load clients from localStorage for suggestions
async function fetchClientsFromDB(userId: string) {
  try {
    const res = await fetch(`/api/clients?userId=${encodeURIComponent(userId)}`)
    const data = await res.json()
    if (res.ok && data.clients) {
      // Normalize to avoid undefined name/company for encrypted records
      return data.clients.map((c: any) => ({
        ...c,
        name: typeof c?.name === 'string' ? c.name : 'Encrypted',
        company: typeof c?.company === 'string' ? c.company : 'Encrypted',
      }))
    }
    return []
  } catch {
    return []
  }
}
// FloatingElements removed on dashboard for performance
import { usePassphrase } from "@/components/passphrase-context"
import { runFullAnomalyDetection, type AnomalyAlert } from "@/lib/anomaly-detection"

interface IncomeEntry {
  id: string
  source: string
  amount: number
  date: string
}

interface SpendingEntry {
  id: string
  reason: string
  amount: number
  date: string
}

interface LoanEntry {
  id: string
  amount: number
  description: string
  isPaid: boolean
  date: string
}

export default function DashboardPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const { passphrase, encryptPayload, decryptPayload } = usePassphrase()
  const [companyName, setCompanyName] = useState("")

  // Main loading state for entire page
  const [isPageLoading, setIsPageLoading] = useState(true)

  // Add the news state and loading state at the top with other state declarations
  const [newsArticles, setNewsArticles] = useState<any[]>([])
  const [newsLoading, setNewsLoading] = useState(false)
  const [anomalyAlerts, setAnomalyAlerts] = useState<AnomalyAlert[]>([])

  // State for income
  const [incomeEntries, setIncomeEntries] = useState<IncomeEntry[]>([])
  const [incomeSource, setIncomeSource] = useState("")
  const [incomeAmount, setIncomeAmount] = useState("")
  const [clientSuggestions, setClientSuggestions] = useState<{ clientId: string; name: string; company: string }[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  // Update client suggestions when input changes
  useEffect(() => {
    let ignore = false
    async function updateSuggestions() {
      if (incomeSource.trim() === "" || !user?.uid) {
        setClientSuggestions([])
        return
      }
      let allClients = await fetchClientsFromDB(user.uid)
      if (ignore) return
      // Decrypt client names/companies for better suggestions if passphrase is set
      if (passphrase) {
        allClients = await Promise.all(
          allClients.map(async (client: any) => {
            if (client.__encrypted && client.encrypted) {
              try {
                const dec = await decryptPayload(client.encrypted)
                return { ...client, ...dec }
              } catch {
                // Keep masked values
                return client
              }
            }
            return client
          })
        )
      }
      const term = incomeSource.toLowerCase()
      const filtered = allClients.filter(
        (client: { clientId: string; name?: string; company?: string }) =>
          (client.name || '').toLowerCase().includes(term) ||
          (client.company || '').toLowerCase().includes(term)
      )
      setClientSuggestions(filtered)
    }
    updateSuggestions()
    return () => { ignore = true }
  }, [incomeSource, user?.uid, passphrase, decryptPayload])

  // State for spending
  const [spendingEntries, setSpendingEntries] = useState<SpendingEntry[]>([])
  const [spendingReason, setSpendingReason] = useState("")
  const [spendingAmount, setSpendingAmount] = useState("")

  // State for loans
  const [loanEntries, setLoanEntries] = useState<LoanEntry[]>([])
  const [loanAmount, setLoanAmount] = useState("")
  const [loanDescription, setLoanDescription] = useState("")

  // State for filters
  const [timeFilter, setTimeFilter] = useState("1month") // options: 1month, 6months, 1year, 5years, 10years, weekly
  const [timeUnit, setTimeUnit] = useState("month") // options: day, week, month
  const [sourceFilter, setSourceFilter] = useState("all")
  const [reasonFilter, setReasonFilter] = useState("all")

  // Real-time data updates are handled by RealTimeDataProvider

  // Comparative analysis data (mock data for demonstration)
  const comparativeData = [
    { period: "Jan", currentYear: 45000, previousYear: 42000, competitor1: 38000, competitor2: 41000, industry: 40000, target: 47000 },
    { period: "Feb", currentYear: 52000, previousYear: 48000, competitor1: 42000, competitor2: 45000, industry: 44000, target: 51000 },
    { period: "Mar", currentYear: 48000, previousYear: 46000, competitor1: 40000, competitor2: 43000, industry: 42000, target: 49000 },
    { period: "Apr", currentYear: 55000, previousYear: 50000, competitor1: 45000, competitor2: 47000, industry: 46000, target: 53000 },
    { period: "May", currentYear: 58000, previousYear: 53000, competitor1: 48000, competitor2: 50000, industry: 49000, target: 56000 },
    { period: "Jun", currentYear: 62000, previousYear: 57000, competitor1: 52000, competitor2: 54000, industry: 53000, target: 60000 }
  ]


  // Comprehensive data loading function
  const loadAllData = async () => {
    if (!user?.uid) return

    setIsPageLoading(true)


    try {
      // Step 1: Fetch company name (10%)
      const companyPromise = fetch("/api/users/getcompany?userId=" + user.uid)
        .then(res => res.json())
        .then(data => {
          if (data.companyName) setCompanyName(data.companyName)
        })

      // Step 2: Fetch income entries (30%)
      const incomePromise = fetch("/api/income?userId=" + user.uid)
        .then(res => res.json())
        .then(async data => {
          let entries = data.entries || []
          if (passphrase) {
            entries = await Promise.all(entries.map(async (e: any) => {
              if (e.__encrypted && e.encrypted) {
                try {
                  const dec = await decryptPayload(e.encrypted)
                  return { ...e, ...dec, amount: Number(dec.amount) || 0 }
                } catch {
                  return { ...e, source: "Encrypted", amount: 0 }
                }
              }
              return e
            }))
          } else {
            entries = entries.map((e: any) => e.__encrypted ? { ...e, source: "Encrypted", amount: 0 } : e)
          }
          setIncomeEntries(entries)
        })

      // Step 3: Fetch spending entries (50%)
      const spendingPromise = fetch("/api/spending?userId=" + user.uid)
        .then(res => res.json())
        .then(async data => {
          let entries = data.entries || []
          if (passphrase) {
            entries = await Promise.all(entries.map(async (e: any) => {
              if (e.__encrypted && e.encrypted) {
                try {
                  const dec = await decryptPayload(e.encrypted)
                  return { ...e, ...dec, amount: Number(dec.amount) || 0 }
                } catch {
                  return { ...e, reason: "Encrypted", amount: 0 }
                }
              }
              return e
            }))
          } else {
            entries = entries.map((e: any) => e.__encrypted ? { ...e, reason: "Encrypted", amount: 0 } : e)
          }
          setSpendingEntries(entries)
        })

      // Step 4: Fetch loan entries (70%)
      const loansPromise = fetch("/api/loans?userId=" + user.uid)
        .then(res => res.json())
        .then(async data => {
          let entries = data.entries?.map((loan: any) => ({ ...loan, id: loan._id })) || []
          if (passphrase) {
            entries = await Promise.all(entries.map(async (e: any) => {
              if (e.__encrypted && e.encrypted) {
                try {
                  const dec = await decryptPayload(e.encrypted)
                  return { ...e, ...dec, amount: Number(dec.amount) || 0 }
                } catch {
                  return { ...e, description: "Encrypted", amount: 0 }
                }
              }
              return e
            }))
          } else {
            entries = entries.map((e: any) => e.__encrypted ? { ...e, description: "Encrypted", amount: 0 } : e)
          }
          setLoanEntries(entries)
        })

      // Step 5: Fetch clients for suggestions (85%)
      const clientsPromise = fetchClientsFromDB(user.uid).then(() => { })

      // Wait for all data to load
      await Promise.all([companyPromise, incomePromise, spendingPromise, loansPromise, clientsPromise])

      // All data loaded
      setIsPageLoading(false)

    } catch (error) {
      console.error("Error loading dashboard data:", error)
      // Even if there's an error, show the page with empty data
      setIsPageLoading(false)
    }
  }

  // On mount, load all data
  useEffect(() => {
    if (user?.uid) {
      loadAllData()
    }
  }, [user?.uid])

  // Re-decrypt data when passphrase changes
  useEffect(() => {
    if (user?.uid) {
      loadAllData()
    }
  }, [passphrase])

  // Run anomaly detection when data changes
  useEffect(() => {
    if (incomeEntries.length > 0 || spendingEntries.length > 0) {
      try {
        const alerts = runFullAnomalyDetection(incomeEntries, spendingEntries)
        setAnomalyAlerts(alerts)
      } catch (e) {
        console.error('Anomaly detection error:', e)
      }
    }
  }, [incomeEntries, spendingEntries])

  // Add this function to fetch news
  const fetchNews = async () => {
    setNewsLoading(true)
    try {
      // Mock news data - replace with actual News API call
      // const response = await fetch(`https://newsapi.org/v2/everything?q=${user?.companyName}&apiKey=YOUR_API_KEY`)
      // const data = await response.json()

      // Mock data for demonstration
      const mockNews = [
        {
          title: "Business Analytics Market Shows Strong Growth in Q4",
          description:
            "The business analytics sector continues to expand with new AI-powered solutions driving innovation across industries.",
          url: "#",
          urlToImage: "/placeholder.svg?height=200&width=300",
          publishedAt: "2024-01-15T10:30:00Z",
          source: { name: "Business Today" },
        },
        {
          title: "Small Businesses Embrace Digital Transformation",
          description:
            "Recent studies show that 78% of small businesses are investing in digital analytics tools to improve decision-making.",
          url: "#",
          urlToImage: "/placeholder.svg?height=200&width=300",
          publishedAt: "2024-01-14T15:45:00Z",
          source: { name: "Tech News" },
        },
        {
          title: "AI-Powered Financial Insights Revolutionize SME Operations",
          description:
            "Artificial intelligence is helping small and medium enterprises make better financial decisions with real-time analytics.",
          url: "#",
          urlToImage: "/placeholder.svg?height=200&width=300",
          publishedAt: "2024-01-13T09:20:00Z",
          source: { name: "Finance Weekly" },
        },
      ]

      setNewsArticles(mockNews)
    } catch (error) {
      console.error("Error fetching news:", error)
      toast({
        title: "Error",
        description: "Failed to fetch news articles.",
        variant: "destructive",
      })
    } finally {
      setNewsLoading(false)
    }
  }

  // Add this useEffect to fetch news on component mount
  useEffect(() => {
    fetchNews()
  }, [])

  const addIncome = async () => {
    if (!incomeSource || !incomeAmount) {
      toast({
        title: "Error",
        description: "Please fill in all fields.",
        variant: "destructive",
      })
      return
    }
    // Find clientId if source matches a client
    let clientId = null
    const matchedClient = clientSuggestions.find(
      (client) => client.name.toLowerCase() === incomeSource.toLowerCase()
    )
    if (matchedClient) clientId = matchedClient.clientId

    try {
      let body: any
      if (passphrase) {
        const encrypted = await encryptPayload({
          source: incomeSource,
          amount: Number.parseFloat(incomeAmount),
          date: new Date().toISOString(),
          clientId,
        })
        body = {
          __encrypted: true,
          encrypted,
          userId: user?.uid,
        }
      } else {
        body = {
          source: incomeSource,
          amount: Number.parseFloat(incomeAmount),
          date: new Date().toISOString(),
          clientId,
          userId: user?.uid,
        }
      }
      const res = await fetch("/api/income", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) {
        toast({
          title: "Error",
          description: data.error || "Failed to store income entry.",
          variant: "destructive",
        })
        return
      }
      toast({
        title: "Success",
        description: "Income entry added successfully!",
      })
      setIncomeSource("")
      setIncomeAmount("")
      // Reload all data to get updated income entries
      loadAllData()
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to store income entry.",
        variant: "destructive",
      })
    }
  }

  const addSpending = async () => {
    if (!spendingReason || !spendingAmount) {
      toast({
        title: "Error",
        description: "Please fill in all fields.",
        variant: "destructive",
      })
      return
    }

    if (!user?.uid) {
      toast({
        title: "Error",
        description: "You must be logged in to add spending.",
        variant: "destructive",
      })
      return
    }
    // Store spending entry in DB
    try {
      let body: any
      if (passphrase) {
        const encrypted = await encryptPayload({
          reason: spendingReason,
          amount: Number.parseFloat(spendingAmount),
          date: new Date().toISOString(),
        })
        body = {
          __encrypted: true,
          encrypted,
          userId: user.uid,
        }
      } else {
        body = {
          reason: spendingReason,
          amount: Number.parseFloat(spendingAmount),
          date: new Date().toISOString(),
          userId: user.uid,
        }
      }
      const res = await fetch("/api/spending", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) {
        toast({
          title: "Error",
          description: data.error || "Failed to store spending entry.",
          variant: "destructive",
        })
        return
      }
      toast({
        title: "Success",
        description: "Spending entry added successfully!",
      })
      setSpendingReason("")
      setSpendingAmount("")
      loadAllData()
    } catch {
      toast({
        title: "Error",
        description: "Failed to store spending entry.",
        variant: "destructive",
      })
    }
  }

  const addLoan = async () => {
    if (!loanAmount || !loanDescription) {
      toast({
        title: "Error",
        description: "Please fill in all fields.",
        variant: "destructive",
      })
      return
    }
    try {
      let body: any
      if (passphrase) {
        const encrypted = await encryptPayload({
          description: loanDescription,
          amount: Number.parseFloat(loanAmount),
          date: new Date().toISOString(),
        })
        body = {
          __encrypted: true,
          encrypted,
          isPaid: false,
          userId: user?.uid,
        }
      } else {
        body = {
          amount: Number.parseFloat(loanAmount),
          description: loanDescription,
          isPaid: false,
          date: new Date().toISOString(),
          userId: user?.uid,
        }
      }
      const res = await fetch("/api/loans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) {
        toast({
          title: "Error",
          description: data.error || "Failed to store loan entry.",
          variant: "destructive",
        })
        return
      }
      toast({
        title: "Success",
        description: "Loan added successfully!",
      })
      setLoanAmount("")
      setLoanDescription("")
      // Reload all data to get updated loan entries
      loadAllData()
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to store loan entry.",
        variant: "destructive",
      })
    }
  }

  const markLoanAsPaid = async (id: string) => {
    try {
      const res = await fetch("/api/loans", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isPaid: true, userId: user?.uid }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast({
          title: "Error",
          description: data.error || "Failed to mark loan as paid.",
          variant: "destructive",
        })
        return
      }
      toast({
        title: "Success",
        description: "Loan marked as paid!",
      })
      loadAllData()
    } catch {
      toast({
        title: "Error",
        description: "Failed to mark loan as paid.",
        variant: "destructive",
      })
    }
  }

  const deleteLoan = async (id: string) => {
    try {
      const res = await fetch("/api/loans", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, userId: user?.uid }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast({
          title: "Error",
          description: data.error || "Failed to delete loan.",
          variant: "destructive",
        })
        return
      }
      toast({
        title: "Success",
        description: "Loan deleted successfully!",
      })
      loadAllData()
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete loan.",
        variant: "destructive",
      })
    }
  }

  // Calculate totals
  const totalIncome = incomeEntries.reduce((sum, entry) => sum + entry.amount, 0)
  const totalSpending = spendingEntries.reduce((sum, entry) => sum + entry.amount, 0)
  const totalProfit = totalIncome - totalSpending
  const totalLoans = loanEntries.filter((loan) => !loan.isPaid).reduce((sum, loan) => sum + loan.amount, 0)

  // Get unique sources and reasons for filters
  const uniqueSources = [...new Set(incomeEntries.map((entry) => entry.source))]
  const uniqueReasons = [...new Set(spendingEntries.map((entry) => entry.reason))]

  // Filter data based on time period
  const getFilteredData = () => {
    const now = new Date()
    const startDate = new Date()

    switch (timeFilter) {
      case "weekly":
        // Show last 4 weeks
        startDate.setDate(now.getDate() - 7 * 4)
        break
      case "1month":
        startDate.setMonth(now.getMonth() - 1)
        break
      case "6months":
        startDate.setMonth(now.getMonth() - 6)
        break
      case "1year":
        startDate.setFullYear(now.getFullYear() - 1)
        break
      case "5years":
        startDate.setFullYear(now.getFullYear() - 5)
        break
      case "10years":
        startDate.setFullYear(now.getFullYear() - 10)
        break
      default:
        startDate.setMonth(now.getMonth() - 1)
    }

    const filteredIncome = incomeEntries.filter(
      (entry) => new Date(entry.date) >= startDate && (sourceFilter === "all" || entry.source === sourceFilter),
    )

    const filteredSpending = spendingEntries.filter(
      (entry) => new Date(entry.date) >= startDate && (reasonFilter === "all" || entry.reason === reasonFilter),
    )

    return { filteredIncome, filteredSpending }
  }

  // Prepare chart data based on selected time unit
  const getChartData = () => {
    const { filteredIncome, filteredSpending } = getFilteredData()

    // Debug logs removed for performance

    if (timeUnit === "day") {
      // Group by day
      const dailyData: { [key: string]: { income: number; spending: number; date: Date } } = {}

      // Generate all days in the time period
      const now = new Date()
      const startDate = new Date()

      switch (timeFilter) {
        case "weekly":
          startDate.setDate(now.getDate() - 7 * 4)
          break
        case "1month":
          startDate.setMonth(now.getMonth() - 1)
          break
        default:
          startDate.setDate(now.getDate() - 30) // Default to 30 days for daily view
      }

      for (let d = new Date(startDate); d <= now; d.setDate(d.getDate() + 1)) {
        const dayLabel = d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
        dailyData[dayLabel] = { income: 0, spending: 0, date: new Date(d) }
      }

      // Add actual data
      filteredIncome.forEach((entry) => {
        const dayLabel = new Date(entry.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })
        if (dailyData[dayLabel]) {
          dailyData[dayLabel].income += entry.amount
        }
      })

      filteredSpending.forEach((entry) => {
        const dayLabel = new Date(entry.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })
        if (dailyData[dayLabel]) {
          dailyData[dayLabel].spending += entry.amount
        }
      })

      return Object.entries(dailyData)
        .map(([day, data]) => ({
          period: day,
          income: data.income,
          spending: data.spending,
          profit: data.income - data.spending,
        }))
        .sort((a, b) => dailyData[a.period].date.getTime() - dailyData[b.period].date.getTime())

    } else if (timeUnit === "week") {
      // Group by week
      const weekData: { [key: string]: { income: number; spending: number; weekStart: Date } } = {}

      // Generate weeks based on time filter
      const today = new Date()
      let weeksToShow = 4

      switch (timeFilter) {
        case "1month":
          weeksToShow = 4
          break
        case "6months":
          weeksToShow = 26
          break
        case "1year":
          weeksToShow = 52
          break
        default:
          weeksToShow = 4
      }

      for (let i = weeksToShow - 1; i >= 0; i--) {
        const weekStart = new Date(today)
        weekStart.setDate(today.getDate() - today.getDay() - (i * 7))
        const weekLabel = `Week ${weekStart.getMonth() + 1}/${weekStart.getDate()}`
        weekData[weekLabel] = {
          income: 0,
          spending: 0,
          weekStart: new Date(weekStart)
        }
      }

      // Add actual data
      filteredIncome.forEach((entry) => {
        const d = new Date(entry.date)
        const weekStart = new Date(d)
        weekStart.setDate(d.getDate() - d.getDay())
        const weekLabel = `Week ${weekStart.getMonth() + 1}/${weekStart.getDate()}`
        if (weekData[weekLabel]) {
          weekData[weekLabel].income += entry.amount
        }
      })

      filteredSpending.forEach((entry) => {
        const d = new Date(entry.date)
        const weekStart = new Date(d)
        weekStart.setDate(d.getDate() - d.getDay())
        const weekLabel = `Week ${weekStart.getMonth() + 1}/${weekStart.getDate()}`
        if (weekData[weekLabel]) {
          weekData[weekLabel].spending += entry.amount
        }
      })

      return Object.entries(weekData)
        .map(([week, data]) => ({
          period: week,
          income: data.income,
          spending: data.spending,
          profit: data.income - data.spending,
        }))
        .sort((a, b) => weekData[a.period].weekStart.getTime() - weekData[b.period].weekStart.getTime())

    } else {
      // Group by month (default)
      const monthlyData: { [key: string]: { income: number; spending: number } } = {}

      filteredIncome.forEach((entry) => {
        const month = new Date(entry.date).toLocaleDateString("en-US", { year: "numeric", month: "short" })
        if (!monthlyData[month]) monthlyData[month] = { income: 0, spending: 0 }
        monthlyData[month].income += entry.amount
      })

      filteredSpending.forEach((entry) => {
        const month = new Date(entry.date).toLocaleDateString("en-US", { year: "numeric", month: "short" })
        if (!monthlyData[month]) monthlyData[month] = { income: 0, spending: 0 }
        monthlyData[month].spending += entry.amount
      })

      return Object.entries(monthlyData)
        .map(([month, data]) => ({
          period: month,
          income: data.income,
          spending: data.spending,
          profit: data.income - data.spending,
        }))
        .sort((a, b) => new Date(a.period).getTime() - new Date(b.period).getTime())
    }
  }

  const chartData = getChartData()

  return (
    <RealTimeDataProvider options={{ enabled: true, interval: 120000, showNotifications: true }}>
      <DashboardLayout>
        <div className="relative min-h-screen">
          {/* Loading Screen (simplified) */}
          {isPageLoading && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-blue-900 via-purple-900 to-cyan-900">
              <div className="text-center space-y-4">
                <div className="w-12 h-12 mx-auto rounded-full border-4 border-white/30 border-t-white animate-spin" />
                <h2 className="text-2xl font-bold text-white">Loading Your Dashboard</h2>
                <p className="text-cyan-200">Preparing your business analytics...</p>
              </div>
            </div>
          )}

          {/* Main Content */}
          {!isPageLoading && (
            <div className="space-y-6">
              {/* Welcome Section */}
              <div>
                <MagazineCard
                  title={`Welcome back, ${companyName}!`}
                  description="Here's an overview of your business analytics dashboard."
                  icon={TrendingUp}
                  gradient="from-blue-600 to-purple-600"
                />
              </div>

              {/* Download Report Section */}
              <div>
                <Card className="glow-card backdrop-blur-sm shadow-2xl p-10 rounded-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Export Reports</h3>
                        <p className="text-gray-600 dark:text-gray-300">
                          Generate comprehensive PDF reports with your financial data, charts, and analytics.
                        </p>
                      </div>
                      <DownloadReportDialog
                        companyName={companyName || "Your Company"}
                        incomeEntries={incomeEntries}
                        spendingEntries={spendingEntries}
                        totalIncome={totalIncome}
                        totalSpending={totalSpending}
                        totalProfit={totalProfit}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div>
                  <MagazineCard
                    title="Total Income"
                    value={`$${totalIncome.toLocaleString()}`}
                    description="+12% from last month"
                    icon={TrendingUp}
                    gradient="from-green-500 to-emerald-500"
                    className="hover:scale-105 transition-all duration-300 group shadow-xl"
                  />
                </div>

                <div>
                  <MagazineCard
                    title="Total Spending"
                    value={`$${totalSpending.toLocaleString()}`}
                    description="-5% from last month"
                    icon={TrendingDown}
                    gradient="from-red-500 to-pink-500"
                    className="hover:scale-105 transition-all duration-300 group shadow-xl"
                  />
                </div>

                <div>
                  <MagazineCard
                    title="Net Profit"
                    value={`$${totalProfit.toLocaleString()}`}
                    description={totalProfit >= 0 ? "+18% from last month" : "-8% from last month"}
                    icon={DollarSign}
                    gradient="from-blue-500 to-cyan-500"
                    className="hover:scale-105 transition-all duration-300 group shadow-xl"
                  />
                </div>

                <div>
                  <MagazineCard
                    title="Outstanding Loans"
                    value={`$${totalLoans.toLocaleString()}`}
                    description={`${loanEntries.filter((l) => !l.isPaid).length} active loans`}
                    icon={CreditCard}
                    gradient="from-orange-500 to-red-500"
                    className="hover:scale-105 transition-all duration-300 group shadow-xl"
                  />
                </div>
              </div>

              {/* Anomaly Alerts Banner */}
              {anomalyAlerts.length > 0 && (
                <Card className="border-l-4 border-l-orange-500 shadow-lg">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Activity className="h-5 w-5 text-orange-500" />
                      <h3 className="font-semibold text-sm">
                        {anomalyAlerts.filter(a => a.severity === 'critical' || a.severity === 'high').length > 0
                          ? '⚠️ Anomalies Detected'
                          : '📊 Spending & Income Insights'}
                      </h3>
                      <Badge variant="secondary" className="text-xs">{anomalyAlerts.length} alert{anomalyAlerts.length !== 1 ? 's' : ''}</Badge>
                    </div>
                    <div className="space-y-2">
                      {anomalyAlerts
                        .sort((a, b) => {
                          const sev = { critical: 0, high: 1, medium: 2, low: 3 }
                          return (sev[a.severity] || 3) - (sev[b.severity] || 3)
                        })
                        .slice(0, 3)
                        .map((alert) => (
                          <div
                            key={alert.id}
                            className={`flex items-start gap-3 p-3 rounded-lg text-sm ${
                              alert.severity === 'critical' ? 'bg-red-50 dark:bg-red-950/30 text-red-800 dark:text-red-300' :
                              alert.severity === 'high' ? 'bg-orange-50 dark:bg-orange-950/30 text-orange-800 dark:text-orange-300' :
                              alert.severity === 'medium' ? 'bg-yellow-50 dark:bg-yellow-950/30 text-yellow-800 dark:text-yellow-300' :
                              'bg-blue-50 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300'
                            }`}
                          >
                            <AlertTriangle className={`h-4 w-4 mt-0.5 flex-shrink-0 ${
                              alert.severity === 'critical' ? 'text-red-600' :
                              alert.severity === 'high' ? 'text-orange-500' :
                              'text-yellow-500'
                            }`} />
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-xs">{alert.title}</div>
                              <div className="text-xs opacity-80 mt-0.5">{alert.description}</div>
                            </div>
                            <Badge variant={alert.severity === 'critical' || alert.severity === 'high' ? 'destructive' : 'secondary'} className="text-[10px] flex-shrink-0">
                              {alert.deviationPercent > 0 ? '+' : ''}{alert.deviationPercent.toFixed(0)}%
                            </Badge>
                          </div>
                        ))}
                      {anomalyAlerts.length > 3 && (
                        <a href="/ai-insights" className="block text-xs text-center text-blue-600 dark:text-blue-400 hover:underline mt-1">
                          View all {anomalyAlerts.length} alerts in AI Insights →
                        </a>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Main Content Tabs */}
              <div>
                <Card className="glow-card backdrop-blur-sm shadow-2xl p-10 rounded-lg">
                  <CardContent className="p-6">
                    <Tabs defaultValue="analytics" className="space-y-6">
                      {/* Update the TabsList to include the news tab */}
                      <TabsList className="grid w-full grid-cols-7 glow-card backdrop-blur shadow-lg">
                        <TabsTrigger value="analytics" className="data-[state=active]:bg-white data-[state=active]:text-gray-900 dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white">Analytics</TabsTrigger>
                        <TabsTrigger value="income" className="data-[state=active]:bg-white data-[state=active]:text-gray-900 dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white">Income</TabsTrigger>
                        <TabsTrigger value="spending" className="data-[state=active]:bg-white data-[state=active]:text-gray-900 dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white">Spending</TabsTrigger>
                        <TabsTrigger value="financials" className="data-[state=active]:bg-white data-[state=active]:text-gray-900 dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white">Financials</TabsTrigger>
                        <TabsTrigger value="tools" className="data-[state=active]:bg-white data-[state=active]:text-gray-900 dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white">Tools</TabsTrigger>
                        <TabsTrigger value="invoicing" className="data-[state=active]:bg-white data-[state=active]:text-gray-900 dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white">Invoicing</TabsTrigger>
                        <TabsTrigger value="enhanced" className="data-[state=active]:bg-white data-[state=active]:text-gray-900 dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white">Enhanced</TabsTrigger>
                      </TabsList>

                      <TabsContent value="analytics" className="space-y-6">
                        {/* Filters Card */}
                        <Card className="border-2 border-dashed border-gray-300 dark:border-gray-600 backdrop-blur glow-card shadow-lg">
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                              <Filter className="h-5 w-5" />
                              Filters & Controls
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="flex flex-wrap gap-4">
                            <div className="space-y-2">
                              <Label className="text-gray-700 dark:text-gray-300">Time Period</Label>
                              <Select value={timeFilter} onValueChange={setTimeFilter}>
                                <SelectTrigger className="w-40 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="weekly">Weekly</SelectItem>
                                  <SelectItem value="1month">Last Month</SelectItem>
                                  <SelectItem value="6months">Last 6 Months</SelectItem>
                                  <SelectItem value="1year">Last Year</SelectItem>
                                  <SelectItem value="5years">Last 5 Years</SelectItem>
                                  <SelectItem value="10years">Last 10 Years</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="ml-auto flex items-end gap-2" />

                            <div className="space-y-2">
                              <Label className="text-gray-700 dark:text-gray-300">View By</Label>
                              <Select value={timeUnit} onValueChange={setTimeUnit}>
                                <SelectTrigger className="w-40 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="day">Day by Day</SelectItem>
                                  <SelectItem value="week">Week by Week</SelectItem>
                                  <SelectItem value="month">Month by Month</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <Label className="text-gray-700 dark:text-gray-300">Income Source</Label>
                              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                                <SelectTrigger className="w-40 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="all">All Sources</SelectItem>
                                  {uniqueSources.map((source) => (
                                    <SelectItem key={source} value={source}>
                                      {source}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <Label className="text-gray-700 dark:text-gray-300">Spending Reason</Label>
                              <Select value={reasonFilter} onValueChange={setReasonFilter}>
                                <SelectTrigger className="w-40 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="all">All Reasons</SelectItem>
                                  {uniqueReasons.map((reason) => (
                                    <SelectItem key={reason} value={reason}>
                                      {reason}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Update the Chart Card section to include loading state */}
                        <Card className="glow-card backdrop-blur shadow-lg border-white/20 dark:border-gray-700/20">
                          <CardHeader>
                            <CardTitle className="text-gray-900 dark:text-white">Financial Overview</CardTitle>
                            <CardDescription className="text-gray-600 dark:text-gray-300">Track your income, spending, and profit over time</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div id="financial-overview-chart" className="h-80 relative">
                              {chartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                  <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
                                    <XAxis dataKey="period" stroke="#6b7280" fontSize={12} />
                                    <YAxis stroke="#6b7280" fontSize={12} tickFormatter={(value: number) => `$${value}`} />
                                    <Tooltip
                                      formatter={(value: number, name: string) => [`$${Number(value).toLocaleString()}`, name]}
                                      labelStyle={{ color: "#374151" }}
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
                                </ResponsiveContainer>
                              ) : (
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <div className="text-center">
                                    <div className="text-gray-500 dark:text-gray-400 mb-2">No data available</div>
                                    <p className="text-sm text-gray-400 dark:text-gray-500">
                                      Add some income and spending entries to see the chart
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>

                        {/* Loans Card */}
                        <Card className="glow-card backdrop-blur shadow-lg border-white/20 dark:border-gray-700/20 ">
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <div>
                                <CardTitle className="text-gray-900 dark:text-white">Loan Management</CardTitle>
                                <CardDescription className="text-gray-600 dark:text-gray-300">Track and manage your outstanding loans</CardDescription>
                              </div>
                              {loanEntries.length > 0 && (
                                <Button variant="outline" size="sm" onClick={() => exportLoansCSV(loanEntries)} className="text-xs">
                                  <Download className="h-3 w-3 mr-1" />
                                  Export CSV
                                </Button>
                              )}
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <Card className="border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-50/50 dark:bg-gray-800/50">
                              <CardContent className="p-4">
                                <div className="flex gap-4">
                                  <div className="flex-1">
                                    <Label htmlFor="loanAmount" className="text-gray-700 dark:text-gray-300">Loan Amount</Label>
                                    <Input
                                      id="loanAmount"
                                      type="number"
                                      placeholder="Enter loan amount"
                                      value={loanAmount}
                                      onChange={(e) => setLoanAmount(e.target.value)}
                                      className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                                    />
                                  </div>
                                  <div className="flex-1">
                                    <Label htmlFor="loanDescription" className="text-gray-700 dark:text-gray-300">Description</Label>
                                    <Input
                                      id="loanDescription"
                                      placeholder="Enter loan description"
                                      value={loanDescription}
                                      onChange={(e) => setLoanDescription(e.target.value)}
                                      className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                                    />
                                  </div>
                                  <div className="flex items-end">
                                    <Button onClick={addLoan} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold drop-shadow-lg">
                                      <Plus className="h-4 w-4 mr-2" />
                                      Add Loan
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>

                            <div className="space-y-2">
                              {loanEntries.map((loan) => (
                                <div
                                  key={loan.id}
                                  className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg glow-card backdrop-blur shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                >
                                  <div className="flex-1">
                                    <div className="font-medium text-gray-900 dark:text-white">{loan.description}</div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                      ${loan.amount.toLocaleString()} • {new Date(loan.date).toLocaleDateString()}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {loan.isPaid ? (
                                      <Badge
                                        variant="secondary"
                                        className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                      >
                                        Paid
                                      </Badge>
                                    ) : (
                                      <>
                                        <Button size="sm" variant="outline" onClick={() => markLoanAsPaid(loan.id)} className="border-gray-300 dark:border-gray-600">
                                          <CheckCircle className="h-4 w-4 mr-1" />
                                          Mark Paid
                                        </Button>
                                        <Button size="sm" variant="outline" onClick={() => deleteLoan(loan.id)} className="border-gray-300 dark:border-gray-600">
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </>
                                    )}
                                  </div>
                                </div>
                              ))}
                              {loanEntries.length === 0 && (
                                <div className="text-center py-8 text-gray-500 dark:text-gray-400">No loans added yet</div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </TabsContent>

                      <TabsContent value="income" className="space-y-6">
                        <Card className="glow-card backdrop-blur shadow-lg border-white/20 dark:border-gray-700/20">
                          <CardHeader>
                            <CardTitle className="text-gray-900 dark:text-white">Add Income</CardTitle>
                            <CardDescription className="text-gray-600 dark:text-gray-300">Record new income from clients or other sources</CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <Card className="border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-50/50 dark:bg-gray-800/50">
                              <CardContent className="p-4">
                                <div className="flex gap-4">
                                  <div className="flex-1">
                                    <Label htmlFor="incomeSource" className="text-gray-700 dark:text-gray-300">Source</Label>
                                    <div className="relative">
                                      <Input
                                        id="incomeSource"
                                        placeholder="Client name or income source"
                                        value={incomeSource}
                                        onChange={(e) => {
                                          setIncomeSource(e.target.value)
                                          setShowSuggestions(true)
                                        }}
                                        onFocus={() => setShowSuggestions(true)}
                                        onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                                        autoComplete="off"
                                        className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                                      />
                                      {showSuggestions && clientSuggestions.length > 0 && (
                                        <div className="absolute z-10 left-0 right-0 mt-1 bg-white border border-gray-300 rounded shadow-lg max-h-48 overflow-auto">
                                          {clientSuggestions.map((client) => (
                                            <div
                                              key={client.clientId}
                                              className="px-3 py-2 cursor-pointer hover:bg-gray-100 text-gray-900 suggestion-item"
                                              onMouseDown={() => {
                                                setIncomeSource(client.name)
                                                setShowSuggestions(false)
                                              }}
                                            >
                                              <span className="font-medium text-gray-900">{client.name}</span>
                                              <span className="ml-2 text-xs text-gray-500">{client.company}</span>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex-1">
                                    <Label htmlFor="incomeAmount" className="text-gray-700 dark:text-gray-300">Amount</Label>
                                    <Input
                                      id="incomeAmount"
                                      type="number"
                                      placeholder="Enter amount"
                                      value={incomeAmount}
                                      onChange={(e) => setIncomeAmount(e.target.value)}
                                      className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                                    />
                                  </div>
                                  <div className="flex items-end">
                                    <Button onClick={addIncome} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold drop-shadow-lg">
                                      <Plus className="h-4 w-4 mr-2" />
                                      Add Income
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>

                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <h3 className="font-medium text-gray-900 dark:text-white">Recent Income Entries</h3>
                                {incomeEntries.length > 0 && (
                                  <Button variant="outline" size="sm" onClick={() => exportIncomeCSV(incomeEntries)} className="text-xs">
                                    <Download className="h-3 w-3 mr-1" />
                                    Export CSV
                                  </Button>
                                )}
                              </div>
                              {incomeEntries
                                .slice(-5)
                                .reverse()
                                .map((entry) => (
                                  <div
                                    key={entry.id}
                                    className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg glow-card backdrop-blur shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                  >
                                    <div>
                                      <div className="font-medium text-gray-900 dark:text-white">{entry.source}</div>
                                      <div className="text-sm text-gray-500 dark:text-gray-400">
                                        {new Date(entry.date).toLocaleDateString()}
                                      </div>
                                    </div>
                                    <div className="text-lg font-semibold text-green-600 dark:text-green-400">
                                      +${entry.amount.toLocaleString()}
                                    </div>
                                  </div>
                                ))}
                              {incomeEntries.length === 0 && (
                                <div className="text-center py-8 text-gray-500 dark:text-gray-400">No income entries yet</div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </TabsContent>

                      <TabsContent value="spending" className="space-y-6">
                        <Card className="glow-card backdrop-blur shadow-lg border-white/20 dark:border-gray-700/20">
                          <CardHeader>
                            <CardTitle className="text-gray-900 dark:text-white">Add Spending</CardTitle>
                            <CardDescription className="text-gray-600 dark:text-gray-300">Record business expenses and spending</CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <Card className="border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-50/50 dark:bg-gray-800/50">
                              <CardContent className="p-4">
                                <div className="flex gap-4">
                                  <div className="flex-1">
                                    <Label htmlFor="spendingReason" className="text-gray-700 dark:text-gray-300">Reason</Label>
                                    <Input
                                      id="spendingReason"
                                      placeholder="Reason for spending"
                                      value={spendingReason}
                                      onChange={(e) => setSpendingReason(e.target.value)}
                                      className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                                    />
                                  </div>
                                  <div className="flex-1">
                                    <Label htmlFor="spendingAmount" className="text-gray-700 dark:text-gray-300">Amount</Label>
                                    <Input
                                      id="spendingAmount"
                                      type="number"
                                      placeholder="Enter amount"
                                      value={spendingAmount}
                                      onChange={(e) => setSpendingAmount(e.target.value)}
                                      className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                                    />
                                  </div>
                                  <div className="flex items-end">
                                    <Button onClick={addSpending} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold drop-shadow-lg">
                                      <Plus className="h-4 w-4 mr-2" />
                                      Add Spending
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>

                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <h3 className="font-medium text-gray-900 dark:text-white">Recent Spending Entries</h3>
                                {spendingEntries.length > 0 && (
                                  <Button variant="outline" size="sm" onClick={() => exportSpendingCSV(spendingEntries)} className="text-xs">
                                    <Download className="h-3 w-3 mr-1" />
                                    Export CSV
                                  </Button>
                                )}
                              </div>
                              {spendingEntries
                                .slice(-5)
                                .reverse()
                                .map((entry) => (
                                  <div
                                    key={entry.id}
                                    className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg glow-card backdrop-blur shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                  >
                                    <div>
                                      <div className="font-medium text-gray-900 dark:text-white">{entry.reason}</div>
                                      <div className="text-sm text-gray-500 dark:text-gray-400">
                                        {new Date(entry.date).toLocaleDateString()}
                                      </div>
                                    </div>
                                    <div className="text-lg font-semibold text-red-600 dark:text-red-400">
                                      -${entry.amount.toLocaleString()}
                                    </div>
                                  </div>
                                ))}
                              {spendingEntries.length === 0 && (
                                <div className="text-center py-8 text-gray-500 dark:text-gray-400">No spending entries yet</div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </TabsContent>

                      {/* Financials Tab — P&L, Cash Flow, Goal Tracking, Budget, Expenses */}
                      <TabsContent value="financials" className="space-y-6">
                        <ProfitLossStatement
                          incomeEntries={incomeEntries}
                          spendingEntries={spendingEntries}
                          loanEntries={loanEntries}
                        />

                        <CashFlowForecastView
                          incomeEntries={incomeEntries}
                          spendingEntries={spendingEntries}
                        />

                        {user?.uid && (
                          <BudgetPlanner
                            userId={user.uid}
                            spendingEntries={spendingEntries}
                          />
                        )}

                        <ExpenseCategoriesView
                          spendingEntries={spendingEntries}
                        />

                        {user?.uid && (
                          <GoalTracking
                            userId={user.uid}
                            totalIncome={totalIncome}
                            totalSpending={totalSpending}
                            totalProfit={totalProfit}
                            clientCount={0}
                          />
                        )}
                      </TabsContent>

                      {/* Tools Tab — Sharing, Scheduled Reports */}
                      <TabsContent value="tools" className="space-y-6">
                        {user?.uid && (
                          <>
                            <DashboardSharing userId={user.uid} />
                            <ScheduledReports userId={user.uid} userEmail={user.email || ""} />
                            <CurrencyConverter />
                            <ReceiptUpload userId={user.uid} />
                          </>
                        )}
                      </TabsContent>

                      {/* Invoicing Tab — Invoice Manager & Recurring Transactions */}
                      <TabsContent value="invoicing" className="space-y-6">
                        {user?.uid && (
                          <>
                            <InvoiceManager userId={user.uid} companyName={companyName || "Your Company"} />
                            <RecurringTransactions userId={user.uid} />
                          </>
                        )}
                      </TabsContent>

                      {/* Enhanced Data Visualization Tab */}
                      <TabsContent value="enhanced" className="space-y-6">
                        {/* Interactive Chart with Real-time Updates */}
                        <InteractiveChart
                          data={chartData}
                          title="Interactive Financial Overview"
                          description="Click on data points for detailed drill-down analysis"
                          type="line"
                          height={400}
                          enableRealTime={false}
                          onDrillDown={(data: any) => {
                            console.log('Drill-down data:', data)
                            // Handle drill-down logic here
                          }}
                          onExport={() => {
                            // Handle export logic here
                            console.log('Exporting chart data...')
                          }}
                        />

                        {/* Real-time Status Indicator */}
                        {/* Comparative Analysis */}
                        <ComparativeAnalysis
                          data={comparativeData}
                          title="Year-over-Year & Competitor Analysis"
                          description="Compare your performance against previous years and industry competitors"
                          metrics={{
                            currentYear: "2024",
                            previousYear: "2023",
                            competitors: ["TechCorp", "DataSys"],
                            industry: "Industry Average"
                          }}
                        />

                        {/* Custom Dashboard Builder */}
                        <CustomDashboardBuilder
                          initialWidgets={[
                            {
                              id: 'widget-1',
                              type: 'chart',
                              title: 'Revenue Chart',
                              position: { x: 0, y: 0, w: 6, h: 4 },
                              config: { chartType: 'line', enableRealTime: true },
                              data: chartData
                            },
                            {
                              id: 'widget-2',
                              type: 'metric',
                              title: 'Total Revenue',
                              position: { x: 6, y: 0, w: 3, h: 2 },
                              config: { value: totalIncome.toLocaleString(), change: '+12%' }
                            }
                          ]}
                          onSave={(widgets: any) => {
                            console.log('Dashboard saved:', widgets)
                            // Handle dashboard save logic here
                          }}
                          availableData={chartData}
                        />
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </RealTimeDataProvider>
  )
}
