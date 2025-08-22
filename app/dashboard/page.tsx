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
// Load clients from localStorage for suggestions
async function fetchClientsFromDB(userId: string) {
  try {
    const res = await fetch(`/api/clients?userId=${encodeURIComponent(userId)}`)
    const data = await res.json()
    if (res.ok && data.clients) return data.clients
    return []
  } catch {
    return []
  }
}
import { useToast } from "@/hooks/use-toast"
import { TrendingUp, TrendingDown, DollarSign, CreditCard, Plus, Filter, Trash2, CheckCircle } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { motion } from "framer-motion"
import { DownloadReportDialog } from "@/components/download-report-dialog"

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

  // Add the news state and loading state at the top with other state declarations
  const [newsArticles, setNewsArticles] = useState<any[]>([])
  const [newsLoading, setNewsLoading] = useState(false)
  const [chartLoading, setChartLoading] = useState(true)

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
      const allClients = await fetchClientsFromDB(user.uid)
      if (ignore) return
      const filtered = allClients.filter(
        (client: { clientId: string; name: string; company: string }) =>
          client.name.toLowerCase().includes(incomeSource.toLowerCase()) ||
          client.company.toLowerCase().includes(incomeSource.toLowerCase())
      )
      setClientSuggestions(filtered)
    }
    updateSuggestions()
    return () => { ignore = true }
  }, [incomeSource, user?.uid])

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


  // Fetch income entries from DB
  async function fetchIncomeEntriesFromDB() {
    try {
    const res = await fetch("/api/income?userId=" + user?.uid)
    const data = await res.json()
    if (res.ok && data.entries) setIncomeEntries(data.entries)
    else setIncomeEntries([])
    } catch {
      setIncomeEntries([])
    }
  }

  // On mount, fetch income entries from DB
  useEffect(() => {
    if (user?.uid) fetchIncomeEntriesFromDB()
  }, [user?.uid])

  // Fetch spending entries from DB
  async function fetchSpendingEntriesFromDB() {
    try {
      const res = await fetch("/api/spending?userId=" + user?.uid)
      const data = await res.json()
      if (res.ok && data.entries) setSpendingEntries(data.entries)
      else setSpendingEntries([])
    } catch {
      setSpendingEntries([])
    }
  }

  // On mount, fetch spending entries from DB
  useEffect(() => {
    if (user?.uid) fetchSpendingEntriesFromDB()
  }, [user?.uid])

  // Fetch loans from DB
  async function fetchLoanEntriesFromDB() {
    try {
      const res = await fetch("/api/loans?userId=" + user?.uid)
      const data = await res.json()
      if (res.ok && data.entries) {
        // Map _id to id for frontend use
        setLoanEntries(data.entries.map((loan: any) => ({ ...loan, id: loan._id })));
      } else setLoanEntries([])
    } catch {
      setLoanEntries([])
    }
  }

  // On mount, fetch loan entries from DB
  useEffect(() => {
    if (user?.uid) fetchLoanEntriesFromDB()
  }, [user?.uid])

  // Add this useEffect after the other useEffects to simulate chart loading
  useEffect(() => {
    // Simulate chart loading time
    const timer = setTimeout(() => {
      setChartLoading(false)
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

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
      const res = await fetch("/api/income", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: incomeSource,
          amount: Number.parseFloat(incomeAmount),
          date: new Date().toISOString(),
          clientId,
          userId: user?.uid,
        }),
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
      // Fetch updated income entries from DB
      fetchIncomeEntriesFromDB()
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to store income entry.",
        variant: "destructive",
      })
    }
  }

  const addSpending = () => {
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
    fetch("/api/spending", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reason: spendingReason,
        amount: Number.parseFloat(spendingAmount),
        date: new Date().toISOString(),
        userId: user.uid,
      }),
    })
      .then(async (res) => {
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
        fetchSpendingEntriesFromDB()
      })
      .catch(() => {
        toast({
          title: "Error",
          description: "Failed to store spending entry.",
          variant: "destructive",
        })
      })
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
      const res = await fetch("/api/loans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number.parseFloat(loanAmount),
          description: loanDescription,
          isPaid: false,
          date: new Date().toISOString(),
          userId: user?.uid,
        }),
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
      // Fetch updated loan entries from DB
      fetchLoanEntriesFromDB()
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
      fetchLoanEntriesFromDB()
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
      fetchLoanEntriesFromDB()
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
    
    console.log(`Grouping data by: ${timeUnit}`)
    console.log("Filtered income entries:", filteredIncome.length)
    console.log("Filtered spending entries:", filteredSpending.length)

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
  
  // Debug logging for chart data
  console.log(`Chart data for ${timeUnit} view:`, chartData)

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
      },
    },
  }

  return (
    <DashboardLayout>
      <motion.div className="space-y-6" variants={containerVariants} initial="hidden" animate="visible">
        {/* Welcome Section */}
        <motion.div variants={itemVariants}>
          <Card className="gradient-bg text-white border-0 overflow-hidden">
            <CardContent className="p-8">
              <motion.h1
                className="text-3xl font-bold mb-2"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                Welcome back, {user?.companyName}!
              </motion.h1>
              <motion.p
                className="text-white/90 text-lg"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                Here's an overview of your business analytics dashboard.
              </motion.p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Download Report Section */}
        <motion.div variants={itemVariants}>
          <Card className="glow-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Export Reports</h3>
                  <p className="text-muted-foreground">
                    Generate comprehensive PDF reports with your financial data, charts, and analytics.
                  </p>
                </div>
                <DownloadReportDialog
                  companyName={user?.companyName || "Your Company"}
                  incomeEntries={incomeEntries}
                  spendingEntries={spendingEntries}
                  totalIncome={totalIncome}
                  totalSpending={totalSpending}
                  totalProfit={totalProfit}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats Cards */}
        <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" variants={containerVariants}>
          <motion.div variants={itemVariants}>
            <Card className="glow-card hover:scale-105 transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Income</CardTitle>
                <div className="p-2 rounded-full bg-green-100 dark:bg-green-900">
                  <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  ${totalIncome.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-1">+12% from last month</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="glow-card hover:scale-105 transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Spending</CardTitle>
                <div className="p-2 rounded-full bg-red-100 dark:bg-red-900">
                  <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  ${totalSpending.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-1">-5% from last month</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="glow-card hover:scale-105 transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
                <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900">
                  <DollarSign className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div
                  className={`text-2xl font-bold ${totalProfit >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
                >
                  ${totalProfit.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {totalProfit >= 0 ? "+18% from last month" : "-8% from last month"}
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="glow-card hover:scale-105 transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Outstanding Loans</CardTitle>
                <div className="p-2 rounded-full bg-orange-100 dark:bg-orange-900">
                  <CreditCard className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  ${totalLoans.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {loanEntries.filter((l) => !l.isPaid).length} active loans
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Main Content Tabs */}
        <motion.div variants={itemVariants}>
          <Card className="glow-card">
            <CardContent className="p-6">
              <Tabs defaultValue="analytics" className="space-y-6">
                {/* Update the TabsList to include the news tab */}
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="analytics">Analytics</TabsTrigger>
                  <TabsTrigger value="income">Income</TabsTrigger>
                  <TabsTrigger value="spending">Spending</TabsTrigger>
                  <TabsTrigger value="news">Current Affairs</TabsTrigger>
                </TabsList>

                <TabsContent value="analytics" className="space-y-6">
                  {/* Filters Card */}
                  <Card className="border-2 border-dashed border-muted-foreground/20">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Filter className="h-5 w-5" />
                        Filters & Controls
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-4">
                      <div className="space-y-2">
                        <Label>Time Period</Label>
                        <Select value={timeFilter} onValueChange={setTimeFilter}>
                          <SelectTrigger className="w-40">
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

                      <div className="space-y-2">
                        <Label>View By</Label>
                        <Select value={timeUnit} onValueChange={setTimeUnit}>
                          <SelectTrigger className="w-40">
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
                        <Label>Income Source</Label>
                        <Select value={sourceFilter} onValueChange={setSourceFilter}>
                          <SelectTrigger className="w-40">
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
                        <Label>Spending Reason</Label>
                        <Select value={reasonFilter} onValueChange={setReasonFilter}>
                          <SelectTrigger className="w-40">
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
                  <Card className="glow-card">
                    <CardHeader>
                      <CardTitle>Financial Overview</CardTitle>
                      <CardDescription>Track your income, spending, and profit over time</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-80 relative">
                        {chartLoading ? (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="loading-dots">
                              <div className="dot"></div>
                              <div className="dot"></div>
                              <div className="dot"></div>
                            </div>
                          </div>
                        ) : chartData.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
                              <XAxis dataKey="period" stroke="#6b7280" fontSize={12} />
                              <YAxis stroke="#6b7280" fontSize={12} tickFormatter={(value) => `$${value}`} />
                              <Tooltip
                                formatter={(value, name) => [`$${Number(value).toLocaleString()}`, name]}
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
                              <div className="text-muted-foreground mb-2">No data available</div>
                              <p className="text-sm text-muted-foreground">
                                Add some income and spending entries to see the chart
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Loans Card */}
                  <Card className="glow-card">
                    <CardHeader>
                      <CardTitle>Loan Management</CardTitle>
                      <CardDescription>Track and manage your outstanding loans</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Card className="border-2 border-dashed border-muted-foreground/20 bg-muted/20">
                        <CardContent className="p-4">
                          <div className="flex gap-4">
                            <div className="flex-1">
                              <Label htmlFor="loanAmount">Loan Amount</Label>
                              <Input
                                id="loanAmount"
                                type="number"
                                placeholder="Enter loan amount"
                                value={loanAmount}
                                onChange={(e) => setLoanAmount(e.target.value)}
                              />
                            </div>
                            <div className="flex-1">
                              <Label htmlFor="loanDescription">Description</Label>
                              <Input
                                id="loanDescription"
                                placeholder="Enter loan description"
                                value={loanDescription}
                                onChange={(e) => setLoanDescription(e.target.value)}
                              />
                            </div>
                            <div className="flex items-end">
                              <Button onClick={addLoan} className="gradient-bg text-white">
                                <Plus className="h-4 w-4 mr-2" />
                                Add Loan
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <div className="space-y-2">
                        {loanEntries.map((loan) => (
                          <motion.div
                            key={loan.id}
                            className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-muted/50 transition-colors"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3 }}
                          >
                            <div className="flex-1">
                              <div className="font-medium">{loan.description}</div>
                              <div className="text-sm text-muted-foreground">
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
                                  <Button size="sm" variant="outline" onClick={() => markLoanAsPaid(loan.id)}>
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Mark Paid
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={() => deleteLoan(loan.id)}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </motion.div>
                        ))}
                        {loanEntries.length === 0 && (
                          <div className="text-center py-8 text-muted-foreground">No loans added yet</div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="income" className="space-y-6">
                  <Card className="glow-card">
                    <CardHeader>
                      <CardTitle>Add Income</CardTitle>
                      <CardDescription>Record new income from clients or other sources</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Card className="border-2 border-dashed border-muted-foreground/20 bg-muted/20">
                        <CardContent className="p-4">
                          <div className="flex gap-4">
                            <div className="flex-1">
                              <Label htmlFor="incomeSource">Source</Label>
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
                              <Label htmlFor="incomeAmount">Amount</Label>
                              <Input
                                id="incomeAmount"
                                type="number"
                                placeholder="Enter amount"
                                value={incomeAmount}
                                onChange={(e) => setIncomeAmount(e.target.value)}
                              />
                            </div>
                            <div className="flex items-end">
                              <Button onClick={addIncome} className="gradient-bg text-white">
                                <Plus className="h-4 w-4 mr-2" />
                                Add Income
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <div className="space-y-2">
                        <h3 className="font-medium">Recent Income Entries</h3>
                        {incomeEntries
                          .slice(-5)
                          .reverse()
                          .map((entry) => (
                            <motion.div
                              key={entry.id}
                              className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-muted/50 transition-colors"
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.3 }}
                            >
                              <div>
                                <div className="font-medium">{entry.source}</div>
                                <div className="text-sm text-muted-foreground">
                                  {new Date(entry.date).toLocaleDateString()}
                                </div>
                              </div>
                              <div className="text-lg font-semibold text-green-600 dark:text-green-400">
                                +${entry.amount.toLocaleString()}
                              </div>
                            </motion.div>
                          ))}
                        {incomeEntries.length === 0 && (
                          <div className="text-center py-8 text-muted-foreground">No income entries yet</div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="spending" className="space-y-6">
                  <Card className="glow-card">
                    <CardHeader>
                      <CardTitle>Add Spending</CardTitle>
                      <CardDescription>Record business expenses and spending</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Card className="border-2 border-dashed border-muted-foreground/20 bg-muted/20">
                        <CardContent className="p-4">
                          <div className="flex gap-4">
                            <div className="flex-1">
                              <Label htmlFor="spendingReason">Reason</Label>
                              <Input
                                id="spendingReason"
                                placeholder="Reason for spending"
                                value={spendingReason}
                                onChange={(e) => setSpendingReason(e.target.value)}
                              />
                            </div>
                            <div className="flex-1">
                              <Label htmlFor="spendingAmount">Amount</Label>
                              <Input
                                id="spendingAmount"
                                type="number"
                                placeholder="Enter amount"
                                value={spendingAmount}
                                onChange={(e) => setSpendingAmount(e.target.value)}
                              />
                            </div>
                            <div className="flex items-end">
                              <Button onClick={addSpending} className="gradient-bg text-white">
                                <Plus className="h-4 w-4 mr-2" />
                                Add Spending
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <div className="space-y-2">
                        <h3 className="font-medium">Recent Spending Entries</h3>
                        {spendingEntries
                          .slice(-5)
                          .reverse()
                          .map((entry) => (
                            <motion.div
                              key={entry.id}
                              className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-muted/50 transition-colors"
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.3 }}
                            >
                              <div>
                                <div className="font-medium">{entry.reason}</div>
                                <div className="text-sm text-muted-foreground">
                                  {new Date(entry.date).toLocaleDateString()}
                                </div>
                              </div>
                              <div className="text-lg font-semibold text-red-600 dark:text-red-400">
                                -${entry.amount.toLocaleString()}
                              </div>
                            </motion.div>
                          ))}
                        {spendingEntries.length === 0 && (
                          <div className="text-center py-8 text-muted-foreground">No spending entries yet</div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Add the new Current Affairs tab content after the spending tab */}
                <TabsContent value="news" className="space-y-6">
                  <Card className="glow-card">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>Current Affairs & Industry News</span>
                        <Button onClick={fetchNews} disabled={newsLoading} variant="outline" size="sm">
                          {newsLoading ? (
                            <div className="loading-dots-small">
                              <div className="dot-small"></div>
                              <div className="dot-small"></div>
                              <div className="dot-small"></div>
                            </div>
                          ) : (
                            "Refresh"
                          )}
                        </Button>
                      </CardTitle>
                      <CardDescription>Stay updated with the latest business and industry news</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {newsLoading ? (
                        <div className="flex items-center justify-center py-12">
                          <div className="loading-dots">
                            <div className="dot"></div>
                            <div className="dot"></div>
                            <div className="dot"></div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {newsArticles.map((article, index) => (
                            <motion.div
                              key={index}
                              className="border rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.3, delay: index * 0.1 }}
                              onClick={() => window.open(article.url, "_blank")}
                            >
                              <div className="flex gap-4">
                                <img
                                  src={article.urlToImage || "/placeholder.svg"}
                                  alt={article.title}
                                  className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
                                />
                                <div className="flex-1">
                                  <h3 className="font-semibold text-lg mb-2 line-clamp-2">{article.title}</h3>
                                  <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                                    {article.description}
                                  </p>
                                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                                    <span className="font-medium">{article.source.name}</span>
                                    <span>{new Date(article.publishedAt).toLocaleDateString()}</span>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                          {newsArticles.length === 0 && (
                            <div className="text-center py-8 text-muted-foreground">
                              No news articles available at the moment
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </DashboardLayout>
  )
}
