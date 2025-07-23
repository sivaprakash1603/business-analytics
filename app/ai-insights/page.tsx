"use client"

import DashboardLayout from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { Brain, Send, TrendingUp, AlertTriangle, Lightbulb, BarChart3 } from "lucide-react"
import { Badge } from "@/components/ui/badge"

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
  incomeEntries: any[]
  spendingEntries: any[]
  clients: any[]
}

export default function AIInsightsPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [businessData, setBusinessData] = useState<BusinessData | null>(null)
  const { toast } = useToast()

  // Load business data from localStorage
  useEffect(() => {
    const incomeEntries = JSON.parse(localStorage.getItem("incomeEntries") || "[]")
    const spendingEntries = JSON.parse(localStorage.getItem("spendingEntries") || "[]")
    const loanEntries = JSON.parse(localStorage.getItem("loanEntries") || "[]")
    const clients = JSON.parse(localStorage.getItem("clients") || "[]")

    const totalIncome = incomeEntries.reduce((sum: number, entry: any) => sum + entry.amount, 0)
    const totalSpending = spendingEntries.reduce((sum: number, entry: any) => sum + entry.amount, 0)
    const totalLoans = loanEntries
      .filter((loan: any) => !loan.isPaid)
      .reduce((sum: number, loan: any) => sum + loan.amount, 0)

    setBusinessData({
      totalIncome,
      totalSpending,
      totalProfit: totalIncome - totalSpending,
      totalLoans,
      clientCount: clients.length,
      incomeEntries,
      spendingEntries,
      clients,
    })

    // Load saved messages
    const savedMessages = localStorage.getItem("aiMessages")
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages))
    } else {
      // Add welcome message
      const welcomeMessage: ChatMessage = {
        id: Date.now().toString(),
        type: "ai",
        content: `Welcome to AI Business Insights! I've analyzed your business data and I'm ready to help you make informed decisions. 

Here's a quick overview of your business:
• Total Income: $${totalIncome.toLocaleString()}
• Total Spending: $${totalSpending.toLocaleString()}
• Net Profit: $${(totalIncome - totalSpending).toLocaleString()}
• Active Clients: ${clients.length}
• Outstanding Loans: $${totalLoans.toLocaleString()}

Feel free to ask me questions about your business performance, request suggestions for improvement, or get insights about your financial trends!`,
        timestamp: new Date().toISOString(),
      }
      setMessages([welcomeMessage])
    }
  }, [])

  // Save messages to localStorage
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem("aiMessages", JSON.stringify(messages))
    }
  }, [messages])

  const generateAIResponse = (userMessage: string): string => {
    const message = userMessage.toLowerCase()

    if (!businessData) return "I'm still loading your business data. Please try again in a moment."

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
    return `I can help you analyze various aspects of your business:

📊 **Financial Analysis**: Ask about profit margins, cash flow, or expense ratios
👥 **Client Insights**: Get advice on client management and revenue optimization  
💰 **Cost Management**: Learn about expense reduction and efficiency improvements
📈 **Growth Strategies**: Discover opportunities for business expansion
💡 **General Advice**: Get personalized recommendations based on your data

What specific area would you like to explore? You can ask questions like:
• "How can I improve my profit margins?"
• "What's my cash flow situation?"
• "How can I reduce expenses?"
• "What growth opportunities do you see?"
• "Give me advice on client management"`
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
    setInputMessage("")
    setIsLoading(true)

    // Simulate AI processing time
    setTimeout(() => {
      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: "ai",
        content: generateAIResponse(inputMessage),
        timestamp: new Date().toISOString(),
      }

      setMessages((prev) => [...prev, aiResponse])
      setIsLoading(false)
    }, 1500)
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
        <div className="gradient-bg rounded-lg p-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <Brain className="h-8 w-8" />
            <h1 className="text-2xl font-bold">AI Business Insights</h1>
          </div>
          <p className="text-white/90">Get AI-powered suggestions and insights to improve your business performance</p>
        </div>

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
