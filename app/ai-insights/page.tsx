"use client"

import DashboardLayout from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/auth-provider"
import { Brain, Send, TrendingUp, AlertTriangle, Lightbulb, BarChart3, Users, Target, Shield, Sparkles, Zap, MessageSquare } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { 
  analyzeClients, 
  calculateBusinessTrends, 
  assessRisks, 
  generateInsightReport,
  type ClientAnalysis,
  type BusinessTrends,
  type RiskAnalysis
} from "@/lib/advanced-analytics"
import { motion } from "framer-motion"
import { MagazineCard } from "@/components/magazine-card"
import { FloatingElements } from "@/components/floating-elements"

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
  clients: any[]
}

export default function AIInsightsPage() {
  const { user } = useAuth()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isDataLoading, setIsDataLoading] = useState(true)
  const [businessData, setBusinessData] = useState<BusinessData | null>(null)
  const [clientAnalysis, setClientAnalysis] = useState<ClientAnalysis[]>([])
  const [businessTrends, setBusinessTrends] = useState<BusinessTrends | null>(null)
  const [riskAnalysis, setRiskAnalysis] = useState<RiskAnalysis | null>(null)
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

        const incomeEntries = incomeData.entries || []
        const spendingEntries = spendingData.entries || []
        const loanEntries = loansData.entries || []
        const clients = clientsData.clients || []

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
          clients,
        })

        // Perform advanced analytics
        const clientAnalysisResults = analyzeClients(incomeEntries, clients)
        const businessTrendsResults = calculateBusinessTrends(incomeEntries)
        const riskAnalysisResults = assessRisks(clientAnalysisResults, totalIncome)
        
        setClientAnalysis(clientAnalysisResults)
        setBusinessTrends(businessTrendsResults)
        setRiskAnalysis(riskAnalysisResults)

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
  }, [user, toast])

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
      return `Your current profit margin is ${profitMargin.toFixed(1)}%. ${
        profitMargin > 20
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

${
  expenseRatio > 80
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
      // Call the AI chat API with advanced analytics data
      const enhancedBusinessData = {
        ...businessData,
        clientAnalysis: clientAnalysis,
        businessTrends: businessTrends,
        riskAnalysis: riskAnalysis,
        atRiskClientsCount: clientAnalysis.filter(c => c.isAtRisk).length,
        topClientRevenue: clientAnalysis[0]?.totalRevenue || 0,
        topClientName: clientAnalysis[0]?.name || 'N/A'
      };

      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: currentInput,
          businessData: enhancedBusinessData,
          context: messages.slice(-6) // Last 6 messages for context
        })
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to get AI response')
      }

      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: "ai",
        content: data.response,
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
      <div className="space-y-6">
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
                  "Which clients should I focus on for retention?",
                  "How dependent am I on my biggest client?",
                  "What trends do you see in my revenue?",
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
                        className={`h-5 w-5 mt-0.5 ${
                          insight.type === "warning"
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
        <Card className="flex flex-col h-[600px]">
          <CardHeader>
            <CardTitle>AI Assistant</CardTitle>
            <CardDescription>Ask questions about your business analytics and get personalized advice</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto space-y-4 mb-4">
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] p-3 rounded-lg ${
                      message.type === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
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

            {/* Input */}
            <div className="flex gap-2">
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
