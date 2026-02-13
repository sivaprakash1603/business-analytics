// Profit & Loss Statement Generator
// Follows standard accounting format: Revenue → COGS → Gross Profit → OpEx → Net Income

export interface PLLineItem {
  label: string
  amount: number
  isSubtotal?: boolean
  isTotal?: boolean
  indent?: number
  category?: string
}

export interface PLStatement {
  title: string
  period: string
  startDate: string
  endDate: string
  sections: {
    revenue: PLLineItem[]
    costOfGoodsSold: PLLineItem[]
    grossProfit: PLLineItem
    operatingExpenses: PLLineItem[]
    operatingIncome: PLLineItem
    otherExpenses: PLLineItem[] // loans, interest
    netIncome: PLLineItem
  }
  totals: {
    totalRevenue: number
    totalCOGS: number
    grossProfit: number
    totalOpEx: number
    operatingIncome: number
    totalOtherExpenses: number
    netIncome: number
    grossMargin: number
    operatingMargin: number
    netMargin: number
  }
  previousPeriod?: {
    totalRevenue: number
    netIncome: number
    grossMargin: number
  }
}

// Expense categories for P&L classification
const COGS_KEYWORDS = [
  "material", "supply", "supplies", "inventory", "raw", "cost of goods",
  "production", "manufacturing", "wholesale", "purchase", "stock",
  "shipping cost", "freight", "packaging"
]

const OPEX_CATEGORIES: Record<string, string[]> = {
  "Salaries & Wages": ["salary", "salaries", "wage", "wages", "payroll", "bonus", "compensation", "staff"],
  "Rent & Utilities": ["rent", "lease", "utility", "utilities", "electric", "water", "gas", "internet", "phone"],
  "Marketing & Advertising": ["marketing", "advertising", "ad", "ads", "campaign", "promotion", "seo", "social media", "branding"],
  "Software & Technology": ["software", "saas", "subscription", "hosting", "cloud", "domain", "server", "license", "tech"],
  "Office Supplies": ["office", "stationery", "printer", "paper", "desk", "furniture"],
  "Travel & Entertainment": ["travel", "flight", "hotel", "meal", "food", "dinner", "lunch", "entertainment", "conference"],
  "Professional Services": ["legal", "accounting", "consulting", "lawyer", "accountant", "audit", "professional"],
  "Insurance": ["insurance", "coverage", "policy", "premium"],
  "Maintenance & Repairs": ["maintenance", "repair", "fix", "service", "cleaning"],
  "Miscellaneous": [] // catch-all
}

function classifyExpense(reason: string): { category: string; isCOGS: boolean } {
  const lower = reason.toLowerCase()

  // Check COGS first
  for (const keyword of COGS_KEYWORDS) {
    if (lower.includes(keyword)) {
      return { category: "Cost of Goods Sold", isCOGS: true }
    }
  }

  // Check operating expense categories
  for (const [category, keywords] of Object.entries(OPEX_CATEGORIES)) {
    if (category === "Miscellaneous") continue
    for (const keyword of keywords) {
      if (lower.includes(keyword)) {
        return { category, isCOGS: false }
      }
    }
  }

  return { category: "Miscellaneous", isCOGS: false }
}

export function generatePLStatement(
  incomeEntries: Array<{ source: string; amount: number; date: string }>,
  spendingEntries: Array<{ reason: string; amount: number; date: string }>,
  loanEntries: Array<{ amount: number; description: string; isPaid: boolean; date: string }>,
  periodType: "month" | "quarter" | "year" | "custom" = "month",
  customStart?: string,
  customEnd?: string
): PLStatement {
  const now = new Date()
  let startDate: Date
  let endDate: Date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
  let periodLabel: string

  switch (periodType) {
    case "month":
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      periodLabel = now.toLocaleDateString("en-US", { month: "long", year: "numeric" })
      break
    case "quarter": {
      const q = Math.floor(now.getMonth() / 3)
      startDate = new Date(now.getFullYear(), q * 3, 1)
      periodLabel = `Q${q + 1} ${now.getFullYear()}`
      break
    }
    case "year":
      startDate = new Date(now.getFullYear(), 0, 1)
      periodLabel = `FY ${now.getFullYear()}`
      break
    case "custom":
      startDate = customStart ? new Date(customStart) : new Date(now.getFullYear(), 0, 1)
      endDate = customEnd ? new Date(customEnd) : endDate
      periodLabel = `${startDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${endDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
      break
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      periodLabel = now.toLocaleDateString("en-US", { month: "long", year: "numeric" })
  }

  // Filter entries by period
  const periodIncome = incomeEntries.filter((e) => {
    const d = new Date(e.date)
    return d >= startDate && d <= endDate
  })

  const periodSpending = spendingEntries.filter((e) => {
    const d = new Date(e.date)
    return d >= startDate && d <= endDate
  })

  const periodLoans = loanEntries.filter((e) => {
    const d = new Date(e.date)
    return d >= startDate && d <= endDate
  })

  // === REVENUE ===
  const revenueBySource: Record<string, number> = {}
  periodIncome.forEach((e) => {
    const src = e.source || "Other Revenue"
    revenueBySource[src] = (revenueBySource[src] || 0) + e.amount
  })

  const revenueLines: PLLineItem[] = Object.entries(revenueBySource)
    .sort((a, b) => b[1] - a[1])
    .map(([label, amount]) => ({ label, amount, indent: 1 }))

  const totalRevenue = periodIncome.reduce((s, e) => s + e.amount, 0)
  revenueLines.push({ label: "Total Revenue", amount: totalRevenue, isSubtotal: true })

  // === COST OF GOODS SOLD ===
  const cogsItems: Record<string, number> = {}
  const opexItems: Record<string, number> = {}

  periodSpending.forEach((e) => {
    const { category, isCOGS } = classifyExpense(e.reason)
    if (isCOGS) {
      cogsItems[e.reason] = (cogsItems[e.reason] || 0) + e.amount
    } else {
      opexItems[category] = (opexItems[category] || 0) + e.amount
    }
  })

  const cogsLines: PLLineItem[] = Object.entries(cogsItems)
    .sort((a, b) => b[1] - a[1])
    .map(([label, amount]) => ({ label, amount: -amount, indent: 1 }))

  const totalCOGS = Object.values(cogsItems).reduce((s, v) => s + v, 0)
  if (cogsLines.length > 0) {
    cogsLines.push({ label: "Total COGS", amount: -totalCOGS, isSubtotal: true })
  }

  // === GROSS PROFIT ===
  const grossProfit = totalRevenue - totalCOGS

  // === OPERATING EXPENSES ===
  const opexLines: PLLineItem[] = Object.entries(opexItems)
    .sort((a, b) => b[1] - a[1])
    .map(([label, amount]) => ({ label, amount: -amount, indent: 1, category: label }))

  const totalOpEx = Object.values(opexItems).reduce((s, v) => s + v, 0)
  opexLines.push({ label: "Total Operating Expenses", amount: -totalOpEx, isSubtotal: true })

  // === OPERATING INCOME ===
  const operatingIncome = grossProfit - totalOpEx

  // === OTHER EXPENSES (loans) ===
  const otherExpenses: PLLineItem[] = []
  const activeLoanPayments = periodLoans.filter((l) => l.isPaid)
  const totalLoanPayments = activeLoanPayments.reduce((s, l) => s + l.amount, 0)
  if (totalLoanPayments > 0) {
    otherExpenses.push({ label: "Loan Payments", amount: -totalLoanPayments, indent: 1 })
  }
  const totalOtherExpenses = totalLoanPayments

  // === NET INCOME ===
  const netIncome = operatingIncome - totalOtherExpenses

  // === MARGINS ===
  const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0
  const operatingMargin = totalRevenue > 0 ? (operatingIncome / totalRevenue) * 100 : 0
  const netMargin = totalRevenue > 0 ? (netIncome / totalRevenue) * 100 : 0

  // === PREVIOUS PERIOD (for comparison) ===
  let previousPeriod: PLStatement["previousPeriod"]
  const periodMs = endDate.getTime() - startDate.getTime()
  const prevStart = new Date(startDate.getTime() - periodMs)
  const prevEnd = new Date(startDate.getTime() - 1)

  const prevIncome = incomeEntries
    .filter((e) => {
      const d = new Date(e.date)
      return d >= prevStart && d <= prevEnd
    })
    .reduce((s, e) => s + e.amount, 0)

  const prevSpending = spendingEntries
    .filter((e) => {
      const d = new Date(e.date)
      return d >= prevStart && d <= prevEnd
    })
    .reduce((s, e) => s + e.amount, 0)

  if (prevIncome > 0 || prevSpending > 0) {
    previousPeriod = {
      totalRevenue: prevIncome,
      netIncome: prevIncome - prevSpending,
      grossMargin: prevIncome > 0 ? ((prevIncome - prevSpending) / prevIncome) * 100 : 0,
    }
  }

  return {
    title: "Profit & Loss Statement",
    period: periodLabel,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    sections: {
      revenue: revenueLines,
      costOfGoodsSold: cogsLines,
      grossProfit: { label: "Gross Profit", amount: grossProfit, isTotal: true },
      operatingExpenses: opexLines,
      operatingIncome: { label: "Operating Income", amount: operatingIncome, isTotal: true },
      otherExpenses,
      netIncome: { label: "Net Income", amount: netIncome, isTotal: true },
    },
    totals: {
      totalRevenue,
      totalCOGS,
      grossProfit,
      totalOpEx,
      operatingIncome,
      totalOtherExpenses,
      netIncome,
      grossMargin,
      operatingMargin,
      netMargin,
    },
    previousPeriod,
  }
}
