"use client"

import DashboardLayout from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/auth-provider"
import { usePassphrase } from "@/components/passphrase-context"
import { Brain, Send, TrendingUp, AlertTriangle, Lightbulb, BarChart3, Users, Target, Shield, Sparkles, Zap, MessageSquare, Search, Activity, TrendingDown, ArrowUpRight, ArrowDownRight, DollarSign } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  analyzeClients,
  calculateBusinessTrends,
  assessRisks,
  generateInsightReport,
  type ClientAnalysis,
  type BusinessTrends,
  type RiskAnalysis
} from "@/lib/advanced-analytics"
import { runFullAnomalyDetection, type AnomalyAlert } from "@/lib/anomaly-detection"
import { generateExpenseSuggestions, analyzeSpendingCategories, type ExpenseSuggestion, type CategoryBreakdown } from "@/lib/expense-suggestions"
import { parseNaturalLanguageQuery, executeLocalQuery, formatNLQueryResponse, processClientInactivityQuery, type NLQueryResult } from "@/lib/natural-language-query"
import { generateRevenueForecast, type RevenueForecast } from "@/lib/predictive-revenue"
import { motion, AnimatePresence } from "framer-motion"
import { MagazineCard } from "@/components/magazine-card"
import { FloatingElements } from "@/components/floating-elements"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from "recharts"

interface ChatMessage {
  id: string
  type: "user" | "ai"
  content: string
  timestamp: string
}

interface BusinessData {
  totalIncome: number
  totalSpending: number
  totalProfit: number
  totalLoans: number
  clientCount: number
  avgRevenuePerClient: number
  profitMargin: number
  expenseRatio: number
  incomeEntries: any[]
  spendingEntries: any[]
  loanEntries: any[]
  clients: any[]
}

export default function AIInsightsPage() {
  const { user } = useAuth()
  const { passphrase, decryptPayload } = usePassphrase()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isDataLoading, setIsDataLoading] = useState(true)
  const [businessData, setBusinessData] = useState<BusinessData | null>(null)
  const [clientAnalysis, setClientAnalysis] = useState<ClientAnalysis[]>([])
  const [businessTrends, setBusinessTrends] = useState<BusinessTrends | null>(null)
  const [riskAnalysis, setRiskAnalysis] = useState<RiskAnalysis | null>(null)
  const [anomalyAlerts, setAnomalyAlerts] = useState<AnomalyAlert[]>([])
  const [expenseSuggestions, setExpenseSuggestions] = useState<ExpenseSuggestion[]>([])
  const [categoryBreakdown, setCategoryBreakdown] = useState<CategoryBreakdown[]>([])
  const [revenueForecast, setRevenueForecast] = useState<RevenueForecast | null>(null)
  const [nlqInput, setNlqInput] = useState("")
  const [nlqResult, setNlqResult] = useState<NLQueryResult | null>(null)
  const [nlqLoading, setNlqLoading] = useState(false)
  const [activeInsightTab, setActiveInsightTab] = useState("anomalies")
  const { toast } = useToast()

  // Load business data from database
  useEffect(() => {
    const fetchBusinessData = async () => {
      if (!user?.uid) {
        console.log('No user found, skipping data fetch')
        setIsDataLoading(false)
        return
      }

      console.log('Fetching business data for user:', user.uid)
      setIsDataLoading(true)

      try {
        const [incomeRes, spendingRes, loansRes, clientsRes] = await Promise.all([
          fetch(`/api/income?userId=${user.uid}`),
          fetch(`/api/spending?userId=${user.uid}`),
          fetch(`/api/loans?userId=${user.uid}`),
          fetch(`/api/clients?userId=${user.uid}`)
        ])

        // Check if all requests were successful
        if (!incomeRes.ok || !spendingRes.ok || !loansRes.ok || !clientsRes.ok) {
          const errors = [];
          if (!incomeRes.ok) errors.push(`Income API: ${incomeRes.status}`);
          if (!spendingRes.ok) errors.push(`Spending API: ${spendingRes.status}`);
          if (!loansRes.ok) errors.push(`Loans API: ${loansRes.status}`);
          if (!clientsRes.ok) errors.push(`Clients API: ${clientsRes.status}`);
          throw new Error(`API errors: ${errors.join(', ')}`);
        }

        const [incomeData, spendingData, loansData, clientsData] = await Promise.all([
          incomeRes.json(),
          spendingRes.json(),
          loansRes.json(),
          clientsRes.json()
        ])

        let incomeEntries = incomeData.entries || []
        let spendingEntries = spendingData.entries || []
        let loanEntries = loansData.entries || []
        let clients = clientsData.clients || []

        // Decrypt encrypted payloads if passphrase is available; otherwise mask descriptive fields
        async function decryptList(list: any[], fieldFallbacks: Record<string, any>) {
          if (!list || list.length === 0) return list
          if (!passphrase) {
            return list.map(e => e.__encrypted ? { ...e, ...fieldFallbacks } : e)
          }
          return Promise.all(list.map(async (e) => {
            if (e.__encrypted && e.encrypted) {
              try {
                const dec = await decryptPayload(e.encrypted)
                return { ...e, ...dec }
              } catch {
                return { ...e, ...fieldFallbacks }
              }
            }
            return e
          }))
        }

        incomeEntries = await decryptList(incomeEntries, { source: 'Encrypted', amount: 0 })
        spendingEntries = await decryptList(spendingEntries, { reason: 'Encrypted', amount: 0 })
        loanEntries = await decryptList(loanEntries, { description: 'Encrypted', amount: 0 })
        clients = await decryptList(clients, { name: 'Encrypted', company: 'Encrypted', description: 'Encrypted' })

        console.log('Fetched data:', {
          incomeEntries: incomeEntries.length,
          spendingEntries: spendingEntries.length,
          loanEntries: loanEntries.length,
          clients: clients.length
        })

        const totalIncome = incomeEntries.reduce((sum: number, entry: any) => sum + entry.amount, 0)
        const totalSpending = spendingEntries.reduce((sum: number, entry: any) => sum + entry.amount, 0)
        const totalLoans = loanEntries
          .filter((loan: any) => !loan.isPaid)
          .reduce((sum: number, loan: any) => sum + loan.amount, 0)

        console.log('Calculated totals:', {
          totalIncome,
          totalSpending,
          totalLoans,
          clientCount: clients.length
        })

        const totalProfit = totalIncome - totalSpending
        const profitMargin = totalIncome > 0 ? (totalProfit / totalIncome) * 100 : 0
        const expenseRatio = totalIncome > 0 ? (totalSpending / totalIncome) * 100 : 0
        const avgRevenuePerClient = clients.length > 0 ? totalIncome / clients.length : 0

        setBusinessData({
          totalIncome,
          totalSpending,
          totalProfit,
          totalLoans,
          clientCount: clients.length,
          avgRevenuePerClient,
          profitMargin,
          expenseRatio,
          incomeEntries,
          spendingEntries,
          loanEntries,
          clients,
        })

        // Perform advanced analytics
        const clientAnalysisResults = analyzeClients(incomeEntries, clients)
        const businessTrendsResults = calculateBusinessTrends(incomeEntries)
        const riskAnalysisResults = assessRisks(clientAnalysisResults, totalIncome)

        setClientAnalysis(clientAnalysisResults)
        setBusinessTrends(businessTrendsResults)
        setRiskAnalysis(riskAnalysisResults)

        // Run new analytics features
        try {
          const alerts = runFullAnomalyDetection(incomeEntries, spendingEntries)
          setAnomalyAlerts(alerts)
        } catch (e) { console.error('Anomaly detection error:', e) }

        try {
          const suggestions = generateExpenseSuggestions(spendingEntries, incomeEntries)
          setExpenseSuggestions(suggestions)
          const categories = analyzeSpendingCategories(spendingEntries)
          setCategoryBreakdown(categories)
        } catch (e) { console.error('Expense suggestions error:', e) }

        try {
          const forecast = generateRevenueForecast(incomeEntries, 6)
          setRevenueForecast(forecast)
        } catch (e) { console.error('Revenue forecast error:', e) }

        // Add welcome message - always create fresh with current data
        const savedMessages = localStorage.getItem("aiMessages")

        let welcomeContent: string
        if (totalIncome === 0 && totalSpending === 0 && clients.length === 0) {
          welcomeContent = `Welcome to AI Business Insights! 🚀 

I'm ready to help you make informed business decisions, but I notice you don't have any data yet.

🎯 **Get Started:**
• Add some income entries in the Dashboard
• Record your spending and expenses  
• Add client information
• Track any business loans

Once you have data, I can provide:
📊 Profit margin analysis
💰 Cash flow insights  
👥 Client performance metrics
📈 Growth recommendations
💡 Cost optimization strategies

Head to the Dashboard to start adding your business data, then come back for personalized AI insights!`
        } else {
          welcomeContent = `Welcome to AI Business Insights! 🚀 I've analyzed your business data and I'm ready to help you make informed decisions.

📊 **Your Business Overview:**
• Total Income: $${totalIncome.toLocaleString()}
• Total Spending: $${totalSpending.toLocaleString()}
• Net Profit: $${totalProfit.toLocaleString()}
• Profit Margin: ${profitMargin.toFixed(1)}%
• Active Clients: ${clients.length}
• Outstanding Loans: $${totalLoans.toLocaleString()}

I can help you with financial analysis, growth strategies, cost optimization, and more! What would you like to explore first?`
        }

        const welcomeMessage: ChatMessage = {
          id: Date.now().toString(),
          type: "ai",
          content: welcomeContent,
          timestamp: new Date().toISOString(),
        }

        if (savedMessages) {
          const parsedMessages = JSON.parse(savedMessages)
          // Replace the first message if it's a welcome message, otherwise prepend
          if (parsedMessages.length > 0 && parsedMessages[0].type === 'ai' && parsedMessages[0].content.includes('Welcome to AI Business Insights')) {
            parsedMessages[0] = welcomeMessage
            setMessages(parsedMessages)
          } else {
            setMessages([welcomeMessage, ...parsedMessages])
          }
        } else {
          setMessages([welcomeMessage])
        }
      } catch (error) {
        console.error('Error fetching business data:', error)
        toast({
          title: "Data Loading Error",
          description: "Failed to load business data. Some features may be limited.",
          variant: "destructive",
        })
      } finally {
        setIsDataLoading(false)
      }
    }

    fetchBusinessData()
  }, [user, toast, passphrase])

  // Save messages to localStorage
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem("aiMessages", JSON.stringify(messages))
    }
  }, [messages])

  const generateAIResponse = (userMessage: string): string => {
    const message = userMessage.toLowerCase()

    if (!businessData) return "I'm still loading your business data. Please try again in a moment."

    // Advanced client analysis
    if (message.includes("client") && (message.includes("risk") || message.includes("churn") || message.includes("stop"))) {
      const atRiskClients = clientAnalysis.filter(c => c.isAtRisk);
      if (atRiskClients.length === 0) {
        return `✅ **Great News!** All your clients are currently active and healthy.

No clients are showing signs of churn risk. Your client relationships appear strong!

**Proactive Recommendations:**
• Continue regular check-ins with top clients
• Monitor for any changes in transaction patterns
• Consider loyalty programs to maintain engagement
• Ask for feedback to stay ahead of potential issues`;
      }

      let response = `⚠️ **CLIENT RISK ANALYSIS**\n\n`;
      response += `${atRiskClients.length} of your ${clientAnalysis.length} clients need attention:\n\n`;

      atRiskClients.slice(0, 5).forEach(client => {
        response += `🔴 **${client.name}** (${client.company})\n`;
        response += `• Last transaction: ${client.daysSinceLastTransaction === Infinity ? 'Never' : `${client.daysSinceLastTransaction} days ago`}\n`;
        response += `• Revenue at risk: $${client.totalRevenue.toLocaleString()}\n`;
        response += `• Status: ${client.riskLevel} risk\n\n`;
      });

      response += `💡 **IMMEDIATE ACTIONS:**\n`;
      response += `• Contact clients with 90+ days inactivity\n`;
      response += `• Send personalized check-in emails\n`;
      response += `• Offer special promotions or discounts\n`;
      response += `• Schedule face-to-face meetings with high-value at-risk clients\n`;
      response += `• Review service quality and client satisfaction`;

      return response;
    }

    // Client performance analysis
    if (message.includes("top client") || message.includes("best client") || message.includes("client performance")) {
      const topClients = clientAnalysis.slice(0, 5).filter(c => c.totalRevenue > 0);
      if (topClients.length === 0) {
        return "No client revenue data found yet. Start adding income entries linked to specific clients!";
      }

      let response = `🏆 **TOP CLIENT PERFORMANCE**\n\n`;
      topClients.forEach((client, index) => {
        const trendEmoji = client.trend === 'growing' ? '📈' :
          client.trend === 'declining' ? '📉' : '➖';
        response += `${index + 1}. **${client.name}** (${client.company})\n`;
        response += `• Total Revenue: $${client.totalRevenue.toLocaleString()}\n`;
        response += `• Transactions: ${client.totalTransactions}\n`;
        response += `• Average Value: $${client.avgTransactionValue.toFixed(0)}\n`;
        response += `• Trend: ${trendEmoji} ${client.trend}\n`;
        response += `• Last Transaction: ${client.daysSinceLastTransaction} days ago\n\n`;
      });

      response += `💰 **KEY INSIGHTS:**\n`;
      response += `• Top client generates ${((topClients[0].totalRevenue / businessData.totalIncome) * 100).toFixed(1)}% of total revenue\n`;
      response += `• Average client value: $${businessData.avgRevenuePerClient.toFixed(0)}\n`;
      if (riskAnalysis) {
        response += `• Client concentration risk: ${riskAnalysis.clientConcentrationRisk.toFixed(1)}%\n`;
      }

      return response;
    }

    // Business risk analysis
    if (message.includes("risk") || message.includes("concentration") || message.includes("dependency")) {
      if (!riskAnalysis) return "Risk analysis data is not available yet.";

      let response = `🎯 **BUSINESS RISK ASSESSMENT**\n\n`;

      response += `📊 **KEY RISK METRICS:**\n`;
      response += `• Client Concentration Risk: ${riskAnalysis.clientConcentrationRisk.toFixed(1)}%\n`;
      response += `• Top Client Dependency: ${riskAnalysis.topClientDependency.toFixed(1)}%\n`;
      response += `• Clients at Churn Risk: ${riskAnalysis.churnRisk.length}\n\n`;

      if (riskAnalysis.topClientDependency > 30) {
        response += `🚨 **HIGH DEPENDENCY RISK**\n`;
        response += `Your top client represents ${riskAnalysis.topClientDependency.toFixed(1)}% of revenue. This is risky!\n\n`;
        response += `**Mitigation Strategies:**\n`;
        response += `• Diversify client base immediately\n`;
        response += `• Develop multiple revenue streams\n`;
        response += `• Target different market segments\n`;
        response += `• Build stronger relationships with mid-tier clients\n\n`;
      }

      if (riskAnalysis.clientConcentrationRisk > 50) {
        response += `⚠️ **CONCENTRATION RISK**\n`;
        response += `Top 3 clients control ${riskAnalysis.clientConcentrationRisk.toFixed(1)}% of revenue.\n\n`;
      }

      return response;
    }

    // Trend analysis
    if (message.includes("trend") || message.includes("growth") || message.includes("pattern")) {
      if (!businessTrends || businessTrends.seasonalPatterns.length === 0) {
        return "Not enough historical data for trend analysis. Keep adding transactions to see patterns!";
      }

      let response = `📈 **BUSINESS TREND ANALYSIS**\n\n`;
      response += `• Revenue Growth Rate: ${businessTrends.revenueGrowthRate.toFixed(1)}% per month\n`;
      response += `• Transaction Value Trend: ${businessTrends.averageTransactionTrend.toFixed(1)}%\n\n`;

      const bestMonth = businessTrends.seasonalPatterns.reduce((max, month) =>
        month.revenue > max.revenue ? month : max
      );
      response += `🏆 **Best Month:** ${bestMonth.month}\n`;
      response += `• Revenue: $${bestMonth.revenue.toLocaleString()}\n`;
      response += `• Transactions: ${bestMonth.transactions}\n\n`;

      if (businessTrends.revenueGrowthRate > 0) {
        response += `✅ **Positive Growth!** Keep up the momentum!\n`;
      } else if (businessTrends.revenueGrowthRate < -5) {
        response += `📉 **Declining Revenue** - Immediate action needed!\n`;
      }

      return response;
    }

    // Profit analysis
    if (message.includes("profit") || message.includes("profitability")) {
      const profitMargin =
        businessData.totalIncome > 0 ? (businessData.totalProfit / businessData.totalIncome) * 100 : 0
      return `Your current profit margin is ${profitMargin.toFixed(1)}%. ${profitMargin > 20
        ? "Excellent! You have a healthy profit margin."
        : profitMargin > 10
          ? "Good profit margin, but there's room for improvement."
          : profitMargin > 0
            ? "Your profit margin is low. Consider reducing expenses or increasing revenue."
            : "You're operating at a loss. Immediate action needed to reduce costs or increase income."
        }

Suggestions:
• Review your highest spending categories and identify areas to cut costs
• Focus on your most profitable clients and services
• Consider raising prices if you haven't done so recently
• Look for opportunities to upsell existing clients`
    }

    // Cash flow analysis
    if (message.includes("cash flow") || message.includes("cash")) {
      return `Based on your data:
• Monthly average income: $${(businessData.totalIncome / Math.max(1, businessData.incomeEntries.length)).toFixed(0)}
• Monthly average spending: $${(businessData.totalSpending / Math.max(1, businessData.spendingEntries.length)).toFixed(0)}
• Outstanding loans: $${businessData.totalLoans.toLocaleString()}

Recommendations:
• Maintain 3-6 months of expenses as emergency fund
• Consider setting up automatic savings for tax obligations
• Monitor seasonal trends in your income and plan accordingly
• If cash flow is tight, consider invoice factoring or business credit line`
    }

    // Client analysis
    if (message.includes("client") || message.includes("customer")) {
      const avgRevenuePerClient = businessData.clientCount > 0 ? businessData.totalIncome / businessData.clientCount : 0
      return `Client Analysis:
• Total clients: ${businessData.clientCount}
• Average revenue per client: $${avgRevenuePerClient.toFixed(0)}

Suggestions:
• Focus on client retention - it's 5x cheaper than acquiring new clients
• Identify your top 20% clients who generate 80% of revenue
• Consider implementing a client feedback system
• Develop upselling strategies for existing clients
• Create referral programs to leverage satisfied clients`
    }

    // Expense analysis
    if (message.includes("expense") || message.includes("spending") || message.includes("cost")) {
      const expenseRatio =
        businessData.totalIncome > 0 ? (businessData.totalSpending / businessData.totalIncome) * 100 : 0
      return `Expense Analysis:
• Total spending: $${businessData.totalSpending.toLocaleString()}
• Expense ratio: ${expenseRatio.toFixed(1)}% of income

${expenseRatio > 80
          ? "Your expenses are very high relative to income. Immediate cost reduction needed."
          : expenseRatio > 60
            ? "Your expense ratio is concerning. Look for cost-cutting opportunities."
            : expenseRatio > 40
              ? "Moderate expense ratio. Some optimization possible."
              : "Good expense management!"
        }

Cost reduction strategies:
• Review recurring subscriptions and cancel unused services
• Negotiate better rates with suppliers
• Consider remote work to reduce office costs
• Automate processes to reduce labor costs
• Bulk purchasing for frequently used items`
    }

    // Growth suggestions
    if (message.includes("grow") || message.includes("expansion") || message.includes("scale")) {
      return `Growth Strategies for Your Business:

Revenue Growth:
• Diversify your service offerings
• Enter new market segments
• Implement value-based pricing
• Create passive income streams
• Develop strategic partnerships

Operational Efficiency:
• Automate repetitive tasks
• Implement better project management systems
• Outsource non-core activities
• Invest in employee training
• Use data analytics for decision making

Financial Management:
• Improve cash flow forecasting
• Set up proper accounting systems
• Regular financial health checkups
• Consider business insurance
• Plan for tax optimization`
    }

    // General business advice
    if (message.includes("advice") || message.includes("suggestion") || message.includes("recommend")) {
      return `Based on your current business metrics, here are my top recommendations:

Immediate Actions (Next 30 days):
• Set up a monthly financial review process
• Create a cash flow forecast for the next 6 months
• Identify your top 3 expense categories and find 10% savings
• Reach out to your top 5 clients for feedback

Medium-term Goals (Next 3 months):
• Develop a client retention strategy
• Implement better invoicing and payment collection processes
• Create standard operating procedures for key business processes
• Build an emergency fund equal to 3 months of expenses

Long-term Strategy (Next 12 months):
• Diversify your revenue streams
• Invest in marketing and business development
• Consider strategic partnerships or acquisitions
• Plan for business growth and scaling`
    }

    // Default response
    return `🤖 **AI Business Assistant - Advanced Analytics**

I can help you with comprehensive business analysis:

📊 **Financial Analysis**
• "How are my profit margins?"
• "Analyze my cash flow"
• "What's my expense ratio?"

👥 **Client Intelligence**
• "Which clients are at risk of churning?"
• "Show me my top performing clients"
• "Who should I focus on for retention?"

⚠️ **Risk Assessment**
• "What are my business risks?"
• "How dependent am I on my top client?"
• "Analyze my client concentration risk"

📈 **Growth & Trends**
• "What trends do you see in my business?"
• "How is my revenue growing?"
• "What are my seasonal patterns?"

💡 **Strategic Insights**
• "Generate an advanced analytics report"
• "What should I do about declining clients?"
• "How can I diversify my client base?"

**New Features:**
🎯 Client churn prediction and risk scoring
📊 Advanced business trend analysis  
⚖️ Revenue concentration risk assessment
🏆 Client performance ranking and insights

Ask me anything about your business - I have access to advanced analytics including client behavior patterns, risk assessments, and predictive insights!`
  }

  // Natural Language Query handler
  const handleNLQuery = () => {
    if (!nlqInput.trim() || !businessData) return
    setNlqLoading(true)

    try {
      const parsed = parseNaturalLanguageQuery(nlqInput)
      if (!parsed) {
        setNlqResult({
          query: { intent: 'unknown', collection: 'all', filters: [], description: nlqInput },
          results: [],
          summary: 'Could not understand the query. Try rephrasing or use one of the example queries.',
          visualization: 'list'
        })
        setNlqLoading(false)
        return
      }

      // Handle special client inactivity queries
      if ((parsed as any)._inactiveDays) {
        const result = processClientInactivityQuery(
          parsed,
          businessData.clients,
          businessData.incomeEntries,
          (parsed as any)._inactiveDays
        )
        setNlqResult(result)

        // Also inject result into chat
        const chatResponse = formatNLQueryResponse(result)
        const aiMsg: ChatMessage = {
          id: Date.now().toString(),
          type: 'ai',
          content: chatResponse,
          timestamp: new Date().toISOString()
        }
        setMessages(prev => [...prev, aiMsg])
      } else {
        const result = executeLocalQuery(parsed, {
          incomeEntries: businessData.incomeEntries,
          spendingEntries: businessData.spendingEntries,
          loanEntries: businessData.loanEntries || [],
          clients: businessData.clients,
          todos: []
        })
        setNlqResult(result)

        // Also inject into chat
        const chatResponse = formatNLQueryResponse(result)
        const aiMsg: ChatMessage = {
          id: Date.now().toString(),
          type: 'ai',
          content: chatResponse,
          timestamp: new Date().toISOString()
        }
        setMessages(prev => [...prev, aiMsg])
      }
    } catch (e) {
      console.error('NLQ error:', e)
      toast({ title: 'Query Error', description: 'Failed to parse query. Try rephrasing.', variant: 'destructive' })
    } finally {
      setNlqLoading(false)
    }
  }

  const sendMessage = async () => {
    if (!inputMessage.trim()) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: "user",
      content: inputMessage,
      timestamp: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMessage])
    const currentInput = inputMessage
    setInputMessage("")
    setIsLoading(true)

    try {
      // Build enhanced business data
      const enhancedBusinessData = {
        ...businessData,
        clientAnalysis: clientAnalysis,
        businessTrends: businessTrends,
        riskAnalysis: riskAnalysis,
        atRiskClientsCount: clientAnalysis.filter(c => c.isAtRisk).length,
        topClientRevenue: clientAnalysis[0]?.totalRevenue || 0,
        topClientName: clientAnalysis[0]?.name || 'N/A'
      }

      // Pseudonymize client and company names before sending to AI
      const { sanitizedMessage, sanitizedContext, sanitizedData, tokenToName } = sanitizeForAI(
        currentInput,
        messages.slice(-6),
        enhancedBusinessData
      )

      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: sanitizedMessage,
          businessData: sanitizedData,
          context: sanitizedContext
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get AI response')
      }

      // De-tokenize AI response back to real names on the client
      const detokenized = detokenizeResponse(String(data.response || ''), tokenToName)

      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: "ai",
        content: detokenized,
        timestamp: new Date().toISOString(),
      }

      setMessages((prev) => [...prev, aiResponse])
    } catch (error) {
      console.error('Error sending message:', error)

      // Fallback to local AI response
      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: "ai",
        content: generateAIResponse(currentInput),
        timestamp: new Date().toISOString(),
      }

      setMessages((prev) => [...prev, aiResponse])

      toast({
        title: "AI Response",
        description: "Using offline AI. For better responses, check your internet connection.",
        variant: "default",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getQuickInsights = () => {
    if (!businessData) return []

    const insights = []
    const profitMargin = businessData.totalIncome > 0 ? (businessData.totalProfit / businessData.totalIncome) * 100 : 0

    if (profitMargin < 10) {
      insights.push({
        type: "warning",
        title: "Low Profit Margin",
        description: `Your profit margin is ${profitMargin.toFixed(1)}%. Consider cost optimization.`,
        icon: AlertTriangle,
      })
    }

    if (businessData.totalLoans > businessData.totalProfit * 2) {
      insights.push({
        type: "warning",
        title: "High Debt Load",
        description: "Outstanding loans are high relative to profits. Focus on debt reduction.",
        icon: AlertTriangle,
      })
    }

    if (businessData.clientCount < 5) {
      insights.push({
        type: "suggestion",
        title: "Client Diversification",
        description: "Consider expanding your client base to reduce dependency risk.",
        icon: Lightbulb,
      })
    }

    if (profitMargin > 20) {
      insights.push({
        type: "positive",
        title: "Healthy Profit Margin",
        description: "Great job! Your business is performing well financially.",
        icon: TrendingUp,
      })
    }

    return insights
  }

  const quickInsights = getQuickInsights()

  return (
    <DashboardLayout>
      <div className="space-y-6 mb-24">
        {/* Header */}
        <div className="backdrop-blur-md rounded-lg p-6 text-gray-900 dark:text-white border-white/20 dark:border-gray-700/20 shadow-xl bg-gradient-to-br from-white/90 to-white/50 dark:from-gray-900/90 dark:to-gray-900/50">
          <div className="flex items-center gap-3 mb-2">
            <Brain className="h-8 w-8" />
            <h1 className="text-2xl font-bold">AI Business Insights</h1>
          </div>
          <p className="text-gray-700 dark:text-gray-300">Get AI-powered suggestions and insights to improve your business performance</p>
        </div>

        {/* Loading State */}
        {isDataLoading && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                <span>Loading your business data...</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Data Summary for Debugging */}
        {!isDataLoading && businessData && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>📊 Data Summary</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    localStorage.removeItem("aiMessages")
                    window.location.reload()
                  }}
                >
                  Clear Chat & Refresh
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {businessData.totalIncome === 0 && businessData.totalSpending === 0 && businessData.clientCount === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">No business data found. Add some data to get AI insights!</p>
                  <Button
                    onClick={() => window.location.href = '/dashboard'}
                    className="gradient-bg text-white"
                  >
                    Go to Dashboard
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="font-medium">Total Income</div>
                    <div className="text-2xl font-bold text-green-600">${businessData.totalIncome.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="font-medium">Total Spending</div>
                    <div className="text-2xl font-bold text-red-600">${businessData.totalSpending.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="font-medium">Net Profit</div>
                    <div className="text-2xl font-bold text-blue-600">${businessData.totalProfit.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="font-medium">Clients</div>
                    <div className="text-2xl font-bold">{businessData.clientCount}</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Advanced Analytics - Client Performance */}
        {!isDataLoading && clientAnalysis.length > 0 && (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Top Performing Clients */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Top Performing Clients
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {clientAnalysis.slice(0, 5).map((client, index) => (
                    <div key={client.clientId} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">{client.name}</div>
                        <div className="text-sm text-muted-foreground">{client.company}</div>
                        <div className="text-xs">
                          {client.totalTransactions} transactions • Avg: ${client.avgTransactionValue.toFixed(0)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-green-600">${client.totalRevenue.toLocaleString()}</div>
                        <Badge variant={
                          client.trend === 'growing' ? 'default' :
                            client.trend === 'declining' ? 'destructive' : 'secondary'
                        }>
                          {client.trend === 'growing' ? '📈' : client.trend === 'declining' ? '📉' : '➖'} {client.trend}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* At-Risk Clients */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  At-Risk Clients
                </CardTitle>
              </CardHeader>
              <CardContent>
                {clientAnalysis.filter(c => c.isAtRisk).length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    <Shield className="h-8 w-8 mx-auto mb-2 text-green-500" />
                    All clients are active and healthy!
                  </div>
                ) : (
                  <div className="space-y-3">
                    {clientAnalysis.filter(c => c.isAtRisk).slice(0, 5).map((client) => (
                      <div key={client.clientId} className="flex items-center justify-between p-3 border rounded-lg border-red-200">
                        <div className="flex-1">
                          <div className="font-medium">{client.name}</div>
                          <div className="text-sm text-muted-foreground">{client.company}</div>
                          <div className="text-xs text-red-600">
                            {client.daysSinceLastTransaction === Infinity
                              ? 'No transactions yet'
                              : `${client.daysSinceLastTransaction} days since last transaction`}
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant={client.riskLevel === 'high' ? 'destructive' : 'secondary'}>
                            {client.riskLevel === 'high' ? '🔴' : '🟡'} {client.riskLevel} risk
                          </Badge>
                          <div className="text-sm text-muted-foreground mt-1">
                            ${client.totalRevenue.toLocaleString()} at risk
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Business Risk Analysis */}
        {!isDataLoading && riskAnalysis && businessData && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Business Risk Assessment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {riskAnalysis.clientConcentrationRisk.toFixed(1)}%
                  </div>
                  <div className="text-sm font-medium">Client Concentration</div>
                  <div className="text-xs text-muted-foreground">Top 3 clients revenue share</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {riskAnalysis.topClientDependency.toFixed(1)}%
                  </div>
                  <div className="text-sm font-medium">Top Client Dependency</div>
                  <div className="text-xs text-muted-foreground">Single client revenue share</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">
                    {riskAnalysis.churnRisk.length}
                  </div>
                  <div className="text-sm font-medium">Clients at Risk</div>
                  <div className="text-xs text-muted-foreground">Need immediate attention</div>
                </div>
              </div>

              {(riskAnalysis.clientConcentrationRisk > 50 || riskAnalysis.topClientDependency > 30) && (
                <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="font-medium text-orange-800">⚠️ Diversification Recommended</div>
                  <div className="text-sm text-orange-700 mt-1">
                    High client concentration increases business risk. Consider acquiring new clients.
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* ===== NEW AI FEATURES SECTION ===== */}
        {!isDataLoading && businessData && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-500" />
                AI-Powered Analytics
              </CardTitle>
              <CardDescription>Anomaly detection, expense insights, natural language queries, and revenue forecasting</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeInsightTab} onValueChange={setActiveInsightTab} className="space-y-4">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="anomalies" className="text-xs sm:text-sm">
                    <Activity className="h-4 w-4 mr-1 hidden sm:inline" />
                    Anomalies {anomalyAlerts.length > 0 && <Badge variant="destructive" className="ml-1 text-[10px] px-1">{anomalyAlerts.length}</Badge>}
                  </TabsTrigger>
                  <TabsTrigger value="expenses" className="text-xs sm:text-sm">
                    <DollarSign className="h-4 w-4 mr-1 hidden sm:inline" />
                    Expenses
                  </TabsTrigger>
                  <TabsTrigger value="nlq" className="text-xs sm:text-sm">
                    <Search className="h-4 w-4 mr-1 hidden sm:inline" />
                    Ask Data
                  </TabsTrigger>
                  <TabsTrigger value="forecast" className="text-xs sm:text-sm">
                    <TrendingUp className="h-4 w-4 mr-1 hidden sm:inline" />
                    Forecast
                  </TabsTrigger>
                </TabsList>

                {/* Tab 1: Anomaly Detection */}
                <TabsContent value="anomalies" className="space-y-4">
                  {anomalyAlerts.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Shield className="h-10 w-10 mx-auto mb-3 text-green-500" />
                      <p className="font-medium">No anomalies detected</p>
                      <p className="text-sm mt-1">Your spending and income patterns look normal. We&apos;ll alert you when something unusual occurs.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {anomalyAlerts.sort((a, b) => {
                        const sev = { critical: 0, high: 1, medium: 2, low: 3 }
                        return (sev[a.severity] || 3) - (sev[b.severity] || 3)
                      }).map((alert) => (
                        <motion.div
                          key={alert.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`p-4 rounded-lg border-l-4 ${
                            alert.severity === 'critical' ? 'border-l-red-600 bg-red-50 dark:bg-red-950/30' :
                            alert.severity === 'high' ? 'border-l-orange-500 bg-orange-50 dark:bg-orange-950/30' :
                            alert.severity === 'medium' ? 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-950/30' :
                            'border-l-blue-400 bg-blue-50 dark:bg-blue-950/30'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold text-sm">{alert.title}</span>
                                <Badge variant={alert.severity === 'critical' || alert.severity === 'high' ? 'destructive' : 'secondary'} className="text-[10px]">
                                  {alert.severity}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">{alert.description}</p>
                              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                <span>Expected: ${alert.expectedValue.toLocaleString()}</span>
                                <span>Actual: ${alert.currentValue.toLocaleString()}</span>
                                <span className={alert.deviationPercent > 0 ? 'text-red-600' : 'text-green-600'}>
                                  {alert.deviationPercent > 0 ? '+' : ''}{alert.deviationPercent.toFixed(1)}%
                                </span>
                              </div>
                              <p className="text-xs mt-2 text-blue-700 dark:text-blue-400">💡 {alert.recommendation}</p>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* Tab 2: AI Expense Suggestions */}
                <TabsContent value="expenses" className="space-y-4">
                  {expenseSuggestions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <DollarSign className="h-10 w-10 mx-auto mb-3 text-green-500" />
                      <p className="font-medium">No expense suggestions yet</p>
                      <p className="text-sm mt-1">Add more spending entries across different months to see AI-powered expense analysis.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {expenseSuggestions.map((suggestion) => (
                        <motion.div
                          key={suggestion.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className={`p-4 rounded-lg border ${
                            suggestion.severity === 'critical' ? 'border-red-300 bg-red-50 dark:bg-red-950/20' :
                            suggestion.severity === 'warning' ? 'border-yellow-300 bg-yellow-50 dark:bg-yellow-950/20' :
                            'border-gray-200 bg-gray-50 dark:bg-gray-800/50'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`mt-0.5 rounded-full p-1.5 ${
                              suggestion.type === 'increase' ? 'bg-red-100 text-red-600' :
                              suggestion.type === 'decrease' ? 'bg-green-100 text-green-600' :
                              'bg-blue-100 text-blue-600'
                            }`}>
                              {suggestion.type === 'increase' ? <ArrowUpRight className="h-4 w-4" /> :
                               suggestion.type === 'decrease' ? <ArrowDownRight className="h-4 w-4" /> :
                               <Lightbulb className="h-4 w-4" />}
                            </div>
                            <div className="flex-1">
                              <div className="font-semibold text-sm">{suggestion.title}</div>
                              <p className="text-sm text-muted-foreground mt-1">{suggestion.explanation}</p>
                              <div className="flex items-center gap-3 mt-2 text-xs">
                                <span>Previous: ${suggestion.previousAmount.toLocaleString()}</span>
                                <span>Current: ${suggestion.currentAmount.toLocaleString()}</span>
                                <Badge variant={suggestion.changePercent > 0 ? 'destructive' : 'default'} className="text-[10px]">
                                  {suggestion.changePercent > 0 ? '+' : ''}{suggestion.changePercent.toFixed(1)}%
                                </Badge>
                              </div>
                              {suggestion.actionItems.length > 0 && (
                                <div className="mt-2 space-y-1">
                                  {suggestion.actionItems.slice(0, 3).map((action, i) => (
                                    <p key={i} className="text-xs text-blue-700 dark:text-blue-400">• {action}</p>
                                  ))}
                                </div>
                              )}
                              {suggestion.potentialSavings && suggestion.potentialSavings > 0 && (
                                <p className="text-xs mt-1 text-green-700 dark:text-green-400 font-medium">
                                  💰 Potential savings: ${suggestion.potentialSavings.toLocaleString()}/mo
                                </p>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}

                  {/* Category breakdown */}
                  {categoryBreakdown.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-medium mb-3 text-sm">Spending by Category</h4>
                      <div className="space-y-2">
                        {categoryBreakdown.slice(0, 8).map((cat) => (
                          <div key={cat.category} className="flex items-center gap-3">
                            <div className="w-28 text-sm font-medium truncate">{cat.category}</div>
                            <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
                                style={{ width: `${Math.min(cat.percentOfTotal, 100)}%` }}
                              />
                            </div>
                            <div className="w-16 text-right text-sm">{cat.percentOfTotal.toFixed(1)}%</div>
                            <div className="w-24 text-right text-sm font-medium">${cat.total.toLocaleString()}</div>
                            <Badge variant={cat.trend === 'increasing' ? 'destructive' : cat.trend === 'decreasing' ? 'default' : 'secondary'} className="text-[10px] w-20 justify-center">
                              {cat.trend === 'increasing' ? '↑' : cat.trend === 'decreasing' ? '↓' : '→'} {cat.trend}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>

                {/* Tab 3: Natural Language Queries */}
                <TabsContent value="nlq" className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="e.g., 'Show me all clients who haven't paid in 60 days'"
                      value={nlqInput}
                      onChange={(e) => setNlqInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleNLQuery() }}
                      className="flex-1"
                    />
                    <Button onClick={handleNLQuery} disabled={nlqLoading || !nlqInput.trim()}>
                      {nlqLoading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      ) : (
                        <Search className="h-4 w-4" />
                      )}
                    </Button>
                  </div>

                  {/* Example queries */}
                  <div className="flex flex-wrap gap-2">
                    {[
                      "Clients who haven't paid in 60 days",
                      "Top 5 clients by revenue",
                      "Total spending last 3 months",
                      "Largest 10 expenses",
                      "Unpaid loans",
                      "How many clients",
                      "Average income",
                      "Spending on marketing",
                    ].map((example) => (
                      <Button
                        key={example}
                        variant="outline"
                        size="sm"
                        className="text-xs h-7"
                        onClick={() => {
                          setNlqInput(example)
                          setTimeout(() => handleNLQuery(), 50)
                        }}
                      >
                        {example}
                      </Button>
                    ))}
                  </div>

                  {/* NLQ Results */}
                  {nlqResult && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Search className="h-4 w-4" />
                            {nlqResult.query.description}
                          </CardTitle>
                          <CardDescription>{nlqResult.summary}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          {nlqResult.results.length > 0 ? (
                            <div className="overflow-x-auto max-h-64">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="border-b">
                                    {Object.keys(nlqResult.results[0])
                                      .filter(k => !k.startsWith('_') && k !== 'userId' && k !== 'encrypted' && k !== '__encrypted')
                                      .slice(0, 5)
                                      .map(key => (
                                        <th key={key} className="text-left p-2 font-medium text-xs uppercase">{key}</th>
                                      ))
                                    }
                                  </tr>
                                </thead>
                                <tbody>
                                  {nlqResult.results.slice(0, 10).map((row, i) => (
                                    <tr key={i} className="border-b last:border-0">
                                      {Object.entries(row)
                                        .filter(([k]) => !k.startsWith('_') && k !== 'userId' && k !== 'encrypted' && k !== '__encrypted')
                                        .slice(0, 5)
                                        .map(([key, val]) => (
                                          <td key={key} className="p-2 text-xs">
                                            {typeof val === 'number' ? (key.includes('mount') || key.includes('evenue') ? `$${val.toLocaleString()}` : val.toLocaleString()) :
                                             typeof val === 'boolean' ? (val ? '✅' : '❌') :
                                             String(val || '-').slice(0, 40)}
                                          </td>
                                        ))
                                      }
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                              {nlqResult.results.length > 10 && (
                                <p className="text-xs text-muted-foreground mt-2 text-center">
                                  Showing 10 of {nlqResult.results.length} results
                                </p>
                              )}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground text-center py-4">No matching results found.</p>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}
                </TabsContent>

                {/* Tab 4: Predictive Revenue Forecast */}
                <TabsContent value="forecast" className="space-y-4">
                  {!revenueForecast || revenueForecast.forecast.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <TrendingUp className="h-10 w-10 mx-auto mb-3 text-blue-500" />
                      <p className="font-medium">Insufficient data for forecasting</p>
                      <p className="text-sm mt-1">Need at least 3 months of income history to generate predictions. Keep adding income entries!</p>
                    </div>
                  ) : (
                    <>
                      {/* Forecast Summary Metrics */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="text-center p-3 border rounded-lg">
                          <div className="text-lg font-bold">
                            {revenueForecast.trend === 'growing' ? '📈' : revenueForecast.trend === 'declining' ? '📉' : revenueForecast.trend === 'volatile' ? '📊' : '➡️'}
                          </div>
                          <div className="text-sm font-medium capitalize">{revenueForecast.trend}</div>
                          <div className="text-xs text-muted-foreground">Revenue Trend</div>
                        </div>
                        <div className="text-center p-3 border rounded-lg">
                          <div className="text-lg font-bold text-green-600">${revenueForecast.metrics.averageMonthlyRevenue.toLocaleString()}</div>
                          <div className="text-xs text-muted-foreground">Avg Monthly Revenue</div>
                        </div>
                        <div className="text-center p-3 border rounded-lg">
                          <div className="text-lg font-bold text-blue-600">${revenueForecast.metrics.projectedAnnualRevenue.toLocaleString()}</div>
                          <div className="text-xs text-muted-foreground">Projected Annual</div>
                        </div>
                        <div className="text-center p-3 border rounded-lg">
                          <div className={`text-lg font-bold ${revenueForecast.growthRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {revenueForecast.growthRate >= 0 ? '+' : ''}{revenueForecast.growthRate.toFixed(1)}%
                          </div>
                          <div className="text-xs text-muted-foreground">Monthly Growth</div>
                        </div>
                      </div>

                      {/* Forecast Chart */}
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={[
                            ...revenueForecast.historical.map(h => ({ date: h.date, actual: h.amount })),
                            ...revenueForecast.forecast.map(f => ({ date: f.date, predicted: f.predicted, lower: f.lowerBound, upper: f.upperBound }))
                          ]}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                            <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                            <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, '']} />
                            <Legend />
                            <Area type="monotone" dataKey="upper" stroke="none" fill="#93c5fd" fillOpacity={0.2} name="Upper Bound" />
                            <Area type="monotone" dataKey="lower" stroke="none" fill="#93c5fd" fillOpacity={0.2} name="Lower Bound" />
                            <Line type="monotone" dataKey="actual" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} name="Actual Revenue" />
                            <Line type="monotone" dataKey="predicted" stroke="#3b82f6" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3 }} name="Predicted" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Forecast Details */}
                      {revenueForecast.seasonalPattern && (
                        <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                          <div className="text-sm font-medium text-blue-800 dark:text-blue-300">🔄 Seasonal Pattern Detected</div>
                          <div className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                            Best month: <strong>{revenueForecast.metrics.bestMonth}</strong> • Weakest: <strong>{revenueForecast.metrics.worstMonth}</strong>
                          </div>
                        </div>
                      )}

                      {revenueForecast.metrics.volatility > 0.3 && (
                        <div className="p-3 bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                          <div className="text-sm font-medium text-yellow-800 dark:text-yellow-300">⚠️ High Revenue Volatility</div>
                          <div className="text-xs text-yellow-700 dark:text-yellow-400 mt-1">
                            Your revenue fluctuates significantly ({(revenueForecast.metrics.volatility * 100).toFixed(0)}% CV). Forecast confidence is lower. Consider diversifying revenue sources.
                          </div>
                        </div>
                      )}

                      {/* Monthly Forecast Table */}
                      <div>
                        <h4 className="font-medium mb-2 text-sm">Monthly Forecast</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {revenueForecast.forecast.map((f) => (
                            <div key={f.date} className="p-2 border rounded text-center">
                              <div className="text-xs text-muted-foreground">{f.date}</div>
                              <div className="font-bold text-sm">${f.predicted.toLocaleString()}</div>
                              <div className="text-[10px] text-muted-foreground">
                                ${f.lowerBound.toLocaleString()} – ${f.upperBound.toLocaleString()}
                              </div>
                              <Badge variant="secondary" className="text-[10px] mt-1">{Math.round(f.confidence * 100)}% conf</Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}

        {/* Generate Advanced Report Button */}
        {!isDataLoading && businessData && clientAnalysis.length > 0 && (
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <Button
                  onClick={() => {
                    if (businessTrends && riskAnalysis) {
                      const report = generateInsightReport(clientAnalysis, businessTrends, riskAnalysis, businessData);
                      const reportMessage: ChatMessage = {
                        id: Date.now().toString(),
                        type: "ai",
                        content: report,
                        timestamp: new Date().toISOString(),
                      };
                      setMessages(prev => [...prev, reportMessage]);
                    }
                  }}
                  className="gradient-bg text-white"
                  size="lg"
                >
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Generate Advanced Analytics Report
                </Button>
                <p className="text-sm text-muted-foreground mt-2">
                  Get detailed insights about client performance, risks, and recommendations
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Sample Questions for Advanced Analytics */}
        {!isDataLoading && businessData && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                Try These Advanced Queries
              </CardTitle>
              <CardDescription>Click any question to ask the AI instantly</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-3">
                {[
                  "Which clients are at risk of stopping work with me?",
                  "Show me my top performing clients and their trends",
                  "What's my client concentration risk?",
                  "Generate an advanced business analytics report",
                  "What anomalies have you detected in my spending?",
                  "Why did my expenses increase this month?",
                  "What's my predicted revenue for next quarter?",
                  "Analyze my business risks and recommendations"
                ].map((question, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="text-left h-auto p-3 text-sm whitespace-normal  backdrop-blur-lg "
                    onClick={() => {
                      setInputMessage(question);
                      // Auto-send the message
                      setTimeout(() => {
                        const event = new KeyboardEvent('keydown', { key: 'Enter' });
                        document.dispatchEvent(event);
                      }, 100);
                    }}
                  >
                    {question}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Insights */}
        {quickInsights.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Quick Insights
              </CardTitle>
              <CardDescription>AI-generated insights based on your current business data</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {quickInsights.map((insight, index) => {
                  const Icon = insight.icon
                  return (
                    <div key={index} className="flex items-start gap-3 p-4 border rounded-lg">
                      <Icon
                        className={`h-5 w-5 mt-0.5 ${insight.type === "warning"
                          ? "text-red-500"
                          : insight.type === "positive"
                            ? "text-green-500"
                            : "text-blue-500"
                          }`}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium">{insight.title}</h3>
                          <Badge
                            variant={
                              insight.type === "warning"
                                ? "destructive"
                                : insight.type === "positive"
                                  ? "default"
                                  : "secondary"
                            }
                          >
                            {insight.type === "warning"
                              ? "Action Needed"
                              : insight.type === "positive"
                                ? "Good"
                                : "Suggestion"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{insight.description}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Chat Interface */}
        <Card className="flex flex-col h-[600px] mb-8">
          <CardHeader>
            <CardTitle>AI Assistant</CardTitle>
            <CardDescription>Ask questions about your business analytics and get personalized advice</CardDescription>
          </CardHeader>
          <CardContent className="h-full flex-1 flex flex-col p-0">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto space-y-4 px-6 pt-6 scroll-smooth hide-scrollbar">
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] p-3 rounded-lg ${message.type === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                      }`}
                  >
                    <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                    <div className="text-xs opacity-70 mt-1">{new Date(message.timestamp).toLocaleTimeString()}</div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted p-3 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      <span className="text-sm">AI is thinking...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input - always visible */}
            <div className="flex gap-2 px-6 pb-6 pt-2 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
              <Textarea
                placeholder="Ask me anything about your business analytics..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    sendMessage()
                  }
                }}
                rows={2}
                className="resize-none"
              />
              <Button
                onClick={sendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className="gradient-bg text-white"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

// --- Privacy helpers: client-side pseudonymization for AI ---
function sanitizeForAI(
  message: string,
  context: ChatMessage[],
  data: any
) {
  const clients: Array<{ clientId?: string; name?: string; company?: string }> = data?.clients || []

  // Build token maps
  const nameToToken = new Map<string, string>()
  const companyToToken = new Map<string, string>()
  const tokenToName = new Map<string, string>()

  // Assign deterministic tokens based on stable order (by totalRevenue desc then name)
  const byRevenue = (data?.clientAnalysis || [])
    .slice()
    .sort((a: any, b: any) => (b.totalRevenue || 0) - (a.totalRevenue || 0))

  const orderedClients = byRevenue.length
    ? byRevenue.map((a: any) => ({ name: a.name, company: a.company, clientId: a.clientId }))
    : clients

  orderedClients.forEach((c: any, idx: number) => {
    const name = (c?.name || '').trim()
    const company = (c?.company || '').trim()
    const nameToken = `client${idx + 1}`
    const companyToken = `company${idx + 1}`
    if (name && !nameToToken.has(name)) {
      nameToToken.set(name, nameToken)
      tokenToName.set(nameToken, name)
    }
    if (company && !companyToToken.has(company)) {
      companyToToken.set(company, companyToken)
      // Also map company tokens back so we can reinsert company names in AI responses
      tokenToName.set(companyToken, company)
    }
  })

  // Helper to replace occurrences with word boundaries (case-insensitive)
  const replaceAll = (text: string) => {
    let out = text
    // Replace names first (longest first to avoid partial overlaps)
    const names = Array.from(nameToToken.keys()).sort((a, b) => b.length - a.length)
    names.forEach((name) => {
      if (!name) return
      const token = nameToToken.get(name)!
      const pattern = new RegExp(`\\b${escapeRegex(name)}\\b`, 'gi')
      out = out.replace(pattern, token)
    })
    // Replace companies
    const companies = Array.from(companyToToken.keys()).sort((a, b) => b.length - a.length)
    companies.forEach((comp) => {
      if (!comp) return
      const token = companyToToken.get(comp)!
      const pattern = new RegExp(`\\b${escapeRegex(comp)}\\b`, 'gi')
      out = out.replace(pattern, token)
    })
    return out
  }

  // Sanitize message and recent context
  const sanitizedMessage = replaceAll(message)
  const sanitizedContext = (context || []).map((m) => ({ ...m, content: replaceAll(m.content) }))

  // Sanitize data copy (avoid mutating original)
  const deepClone = (obj: any) => JSON.parse(JSON.stringify(obj))
  const sanitizedData = deepClone(data || {})

  // Replace in clients
  if (Array.isArray(sanitizedData.clients)) {
    sanitizedData.clients = sanitizedData.clients.map((c: any) => ({
      ...c,
      name: c?.name ? (nameToToken.get(c.name) || c.name) : c?.name,
      company: c?.company ? (companyToToken.get(c.company) || c.company) : c?.company,
    }))
  }
  // Replace in clientAnalysis
  if (Array.isArray(sanitizedData.clientAnalysis)) {
    sanitizedData.clientAnalysis = sanitizedData.clientAnalysis.map((c: any) => ({
      ...c,
      name: c?.name ? (nameToToken.get(c.name) || c.name) : c?.name,
      company: c?.company ? (companyToToken.get(c.company) || c.company) : c?.company,
    }))
  }
  // Replace topClientName
  if (sanitizedData.topClientName) {
    const n = sanitizedData.topClientName
    sanitizedData.topClientName = nameToToken.get(n) || n
  }
  // Replace incomeEntries.source when it equals a client name
  if (Array.isArray(sanitizedData.incomeEntries)) {
    sanitizedData.incomeEntries = sanitizedData.incomeEntries.map((e: any) => {
      const src = e?.source
      if (typeof src === 'string' && nameToToken.has(src)) {
        return { ...e, source: nameToToken.get(src) }
      }
      return e
    })
  }

  return { sanitizedMessage, sanitizedContext, sanitizedData, tokenToName }
}

function detokenizeResponse(text: string, tokenToName: Map<string, string>) {
  let out = text
  // Replace longer tokens first
  const tokens = Array.from(tokenToName.keys()).sort((a, b) => b.length - a.length)
  tokens.forEach((tok) => {
    const real = tokenToName.get(tok)!
    const pattern = new RegExp(`\\b${escapeRegex(tok)}\\b`, 'g')
    out = out.replace(pattern, real)
  })
  return out
}

function escapeRegex(str: string) {
  return str.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')
}
