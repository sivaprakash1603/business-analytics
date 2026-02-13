// AI-Powered Expense Suggestions Engine
// Analyzes spending by category, compares month-over-month, and generates actionable suggestions

export interface ExpenseSuggestion {
  id: string
  category: string
  type: 'increase' | 'decrease' | 'new_expense' | 'optimization' | 'trend'
  severity: 'info' | 'warning' | 'critical'
  title: string
  explanation: string
  currentAmount: number
  previousAmount: number
  changePercent: number
  period: string
  actionItems: string[]
  potentialSavings?: number
}

export interface CategoryBreakdown {
  category: string
  total: number
  count: number
  avgPerTransaction: number
  percentOfTotal: number
  monthlyTotals: { period: string; total: number }[]
  trend: 'increasing' | 'decreasing' | 'stable'
  changePercent: number
}

/**
 * Analyze spending by reason/category and generate breakdown
 */
export function analyzeSpendingCategories(spendingEntries: any[]): CategoryBreakdown[] {
  if (!spendingEntries || spendingEntries.length === 0) return []

  const totalSpending = spendingEntries.reduce((sum, e) => sum + (e.amount || 0), 0)
  const categoryMap = new Map<string, any[]>()

  spendingEntries.forEach(entry => {
    const category = normalizeCategory(entry.reason || 'Uncategorized')
    const existing = categoryMap.get(category) || []
    existing.push(entry)
    categoryMap.set(category, existing)
  })

  const breakdowns: CategoryBreakdown[] = []

  categoryMap.forEach((entries, category) => {
    const total = entries.reduce((sum: number, e: any) => sum + (e.amount || 0), 0)
    const count = entries.length

    // Monthly breakdown
    const monthlyMap = new Map<string, number>()
    entries.forEach((entry: any) => {
      const date = new Date(entry.date)
      if (isNaN(date.getTime())) return
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      monthlyMap.set(key, (monthlyMap.get(key) || 0) + (entry.amount || 0))
    })

    const monthlyTotals = Array.from(monthlyMap.entries())
      .map(([period, total]) => ({ period, total }))
      .sort((a, b) => a.period.localeCompare(b.period))

    // Trend calculation
    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable'
    let changePercent = 0

    if (monthlyTotals.length >= 2) {
      const recent = monthlyTotals.slice(-2)
      const prev = recent[0].total
      const curr = recent[1].total
      changePercent = prev > 0 ? ((curr - prev) / prev) * 100 : 0

      if (changePercent > 15) trend = 'increasing'
      else if (changePercent < -15) trend = 'decreasing'
    }

    breakdowns.push({
      category,
      total,
      count,
      avgPerTransaction: count > 0 ? total / count : 0,
      percentOfTotal: totalSpending > 0 ? (total / totalSpending) * 100 : 0,
      monthlyTotals,
      trend,
      changePercent
    })
  })

  return breakdowns.sort((a, b) => b.total - a.total)
}

/**
 * Normalize category names for consistent grouping
 */
function normalizeCategory(reason: string): string {
  const lower = reason.toLowerCase().trim()

  // Common category mappings
  const categoryMappings: Record<string, string[]> = {
    'Rent & Office': ['rent', 'office', 'lease', 'workspace', 'coworking'],
    'Payroll & Staff': ['salary', 'payroll', 'wages', 'employee', 'contractor', 'staff', 'hiring'],
    'Marketing': ['marketing', 'advertising', 'ads', 'promotion', 'campaign', 'seo', 'social media'],
    'Software & Tools': ['software', 'tool', 'subscription', 'saas', 'license', 'app'],
    'Utilities': ['utility', 'utilities', 'electric', 'water', 'internet', 'phone', 'gas'],
    'Travel': ['travel', 'flight', 'hotel', 'transportation', 'uber', 'taxi', 'fuel'],
    'Equipment': ['equipment', 'hardware', 'computer', 'laptop', 'device', 'furniture'],
    'Insurance': ['insurance', 'coverage', 'policy'],
    'Professional Services': ['legal', 'accounting', 'consulting', 'audit', 'tax'],
    'Supplies': ['supplies', 'materials', 'inventory', 'stock'],
    'Food & Entertainment': ['food', 'meal', 'restaurant', 'entertainment', 'lunch', 'dinner', 'coffee'],
  }

  for (const [category, keywords] of Object.entries(categoryMappings)) {
    if (keywords.some(kw => lower.includes(kw))) {
      return category
    }
  }

  // Capitalize first letter of each word if no mapping found
  return reason.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
}

/**
 * Generate AI-powered expense suggestions
 */
export function generateExpenseSuggestions(
  spendingEntries: any[],
  incomeEntries: any[]
): ExpenseSuggestion[] {
  if (!spendingEntries || spendingEntries.length < 2) return []

  const suggestions: ExpenseSuggestion[] = []
  const categories = analyzeSpendingCategories(spendingEntries)
  const totalIncome = incomeEntries.reduce((sum, e) => sum + (e.amount || 0), 0)
  const totalSpending = spendingEntries.reduce((sum, e) => sum + (e.amount || 0), 0)

  categories.forEach(cat => {
    // Category spending increases
    if (cat.trend === 'increasing' && cat.changePercent > 20 && cat.monthlyTotals.length >= 2) {
      const recent = cat.monthlyTotals[cat.monthlyTotals.length - 1]
      const prev = cat.monthlyTotals[cat.monthlyTotals.length - 2]

      const explanation = generateIncreaseExplanation(cat.category, cat.changePercent, recent.total, prev.total, cat.count)

      suggestions.push({
        id: `increase-${cat.category}-${recent.period}`,
        category: cat.category,
        type: 'increase',
        severity: cat.changePercent > 50 ? 'critical' : 'warning',
        title: `${cat.category} spending up ${cat.changePercent.toFixed(0)}%`,
        explanation,
        currentAmount: recent.total,
        previousAmount: prev.total,
        changePercent: cat.changePercent,
        period: recent.period,
        actionItems: generateActionItems(cat.category, 'increase', cat.changePercent),
        potentialSavings: estimateSavings(recent.total, prev.total, cat.changePercent)
      })
    }

    // Category spending decreases — positive signal
    if (cat.trend === 'decreasing' && cat.changePercent < -20 && cat.monthlyTotals.length >= 2) {
      const recent = cat.monthlyTotals[cat.monthlyTotals.length - 1]
      const prev = cat.monthlyTotals[cat.monthlyTotals.length - 2]

      suggestions.push({
        id: `decrease-${cat.category}-${recent.period}`,
        category: cat.category,
        type: 'decrease',
        severity: 'info',
        title: `${cat.category} spending down ${Math.abs(cat.changePercent).toFixed(0)}%`,
        explanation: `Good news! Your ${cat.category.toLowerCase()} costs decreased from $${prev.total.toLocaleString()} to $${recent.total.toLocaleString()}. This is saving you $${(prev.total - recent.total).toLocaleString()} compared to last month.`,
        currentAmount: recent.total,
        previousAmount: prev.total,
        changePercent: cat.changePercent,
        period: recent.period,
        actionItems: [
          'Verify the reduction is sustainable and not just delayed',
          'Document what changed to replicate savings elsewhere',
          'Consider reallocating saved funds to growth areas'
        ]
      })
    }

    // High-cost concentration
    if (cat.percentOfTotal > 40 && cat.total > 1000) {
      suggestions.push({
        id: `concentration-${cat.category}`,
        category: cat.category,
        type: 'optimization',
        severity: 'warning',
        title: `${cat.category} is ${cat.percentOfTotal.toFixed(0)}% of all spending`,
        explanation: `"${cat.category}" accounts for ${cat.percentOfTotal.toFixed(1)}% of your total spending ($${cat.total.toLocaleString()} of $${totalSpending.toLocaleString()}). This high concentration creates cost risk — any price increase here significantly impacts profitability.`,
        currentAmount: cat.total,
        previousAmount: 0,
        changePercent: 0,
        period: 'all-time',
        actionItems: [
          `Negotiate better rates for ${cat.category.toLowerCase()}`,
          'Explore alternative providers or vendors',
          'Consider whether this spending is yielding proportional ROI',
          'Set a target to reduce this category to under 30% of total spend'
        ],
        potentialSavings: cat.total * 0.1 // 10% optimization target
      })
    }
  })

  // Overall expense ratio warning
  if (totalIncome > 0 && totalSpending / totalIncome > 0.8) {
    suggestions.push({
      id: 'high-expense-ratio',
      category: 'Overall',
      type: 'optimization',
      severity: 'critical',
      title: `Expense ratio at ${((totalSpending / totalIncome) * 100).toFixed(0)}%`,
      explanation: `You're spending $${((totalSpending / totalIncome) * 100).toFixed(0)} for every $100 earned. Industry best practice is below 70%. At your current rate, a small revenue dip could cause losses.`,
      currentAmount: totalSpending,
      previousAmount: totalIncome,
      changePercent: ((totalSpending / totalIncome) * 100) - 70,
      period: 'all-time',
      actionItems: [
        'Audit all recurring expenses and cancel unused services',
        'Implement a cost approval process for purchases over $500',
        'Review vendor contracts for renegotiation opportunities',
        'Consider outsourcing non-core functions',
        'Set a target to reach 70% expense ratio within 6 months'
      ],
      potentialSavings: totalSpending * 0.15
    })
  }

  // Spending trend analysis
  const monthlySpending = new Map<string, number>()
  spendingEntries.forEach(entry => {
    const date = new Date(entry.date)
    if (isNaN(date.getTime())) return
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    monthlySpending.set(key, (monthlySpending.get(key) || 0) + (entry.amount || 0))
  })

  const months = Array.from(monthlySpending.entries()).sort((a, b) => a[0].localeCompare(b[0]))
  if (months.length >= 3) {
    // Check for consecutive monthly increases
    let consecutiveIncreases = 0
    for (let i = months.length - 1; i > 0; i--) {
      if (months[i][1] > months[i - 1][1]) {
        consecutiveIncreases++
      } else {
        break
      }
    }

    if (consecutiveIncreases >= 3) {
      const totalGrowth = months[0][1] > 0
        ? ((months[months.length - 1][1] - months[0][1]) / months[0][1]) * 100
        : 0

      suggestions.push({
        id: 'consecutive-increase-trend',
        category: 'Overall',
        type: 'trend',
        severity: 'warning',
        title: `Spending has increased for ${consecutiveIncreases} consecutive months`,
        explanation: `Your spending has risen every month for ${consecutiveIncreases} months straight, growing ${totalGrowth.toFixed(0)}% from $${months[months.length - consecutiveIncreases - 1]?.[1]?.toLocaleString() || '0'} to $${months[months.length - 1][1].toLocaleString()}. This trajectory is unsustainable without matching revenue growth.`,
        currentAmount: months[months.length - 1][1],
        previousAmount: months[months.length - consecutiveIncreases - 1]?.[1] || 0,
        changePercent: totalGrowth,
        period: months[months.length - 1][0],
        actionItems: [
          'Conduct a zero-based budgeting exercise',
          'Freeze non-essential spending for 30 days',
          'Set department/category spending caps',
          'Require ROI justification for new expenses'
        ]
      })
    }
  }

  return suggestions.sort((a, b) => {
    const sevOrder = { critical: 0, warning: 1, info: 2 }
    return sevOrder[a.severity] - sevOrder[b.severity]
  })
}

/**
 * Generate a human-readable explanation for why a category increased
 */
function generateIncreaseExplanation(
  category: string,
  changePercent: number,
  currentAmount: number,
  previousAmount: number,
  transactionCount: number
): string {
  const increase = currentAmount - previousAmount
  const baseMsg = `You spent ${changePercent.toFixed(0)}% more on ${category.toLowerCase()} this month — $${currentAmount.toLocaleString()} vs $${previousAmount.toLocaleString()} last month (an increase of $${increase.toLocaleString()}).`

  const reasonsByCategory: Record<string, string> = {
    'Rent & Office': ' This could be due to a lease renewal, office expansion, or new co-working arrangements.',
    'Payroll & Staff': ' This may reflect new hires, overtime pay, bonuses, or contractor engagements.',
    'Marketing': ' This is likely from new campaigns, ad spend increases, or seasonal promotions. Check if the ROI justifies the increase.',
    'Software & Tools': ' You may have added new subscriptions, upgraded plans, or purchased annual licenses.',
    'Utilities': ' Seasonal changes or rate increases may be driving this. Check for any usage anomalies.',
    'Travel': ' Business travel tends to be lumpy. Review if upcoming trips are essential or can be handled virtually.',
    'Equipment': ' Major purchases are one-time but should be planned. Verify these are budgeted capital expenditures.',
    'Insurance': ' Premiums may have increased at renewal. Consider shopping for competitive quotes.',
    'Professional Services': ' Legal or consulting engagements can spike with projects. Confirm scope and billing accuracy.',
    'Food & Entertainment': ' Client entertainment and team events can drive increases. Set per-event budgets.',
  }

  const reason = reasonsByCategory[category] || ` With ${transactionCount} transactions in this category, review the largest ones for potential savings.`

  return baseMsg + reason
}

/**
 * Generate category-specific action items
 */
function generateActionItems(category: string, type: string, changePercent: number): string[] {
  const baseActions = [
    `Review all ${category.toLowerCase()} charges from this month`,
    'Compare pricing with alternative providers',
    'Set a monthly budget cap for this category'
  ]

  const categoryActions: Record<string, string[]> = {
    'Marketing': [
      'Measure ROI on each marketing channel',
      'Pause underperforming campaigns',
      'Consider organic growth strategies to supplement paid efforts'
    ],
    'Payroll & Staff': [
      'Review staffing levels vs workload',
      'Check for overtime reduction opportunities',
      'Consider automation for repetitive tasks'
    ],
    'Software & Tools': [
      'Audit all active subscriptions — cancel unused ones',
      'Check for annual vs monthly billing savings',
      'Consolidate overlapping tools'
    ],
    'Travel': [
      'Set a per-trip budget policy',
      'Book in advance for better rates',
      'Evaluate virtual meeting alternatives'
    ],
  }

  return [...baseActions, ...(categoryActions[category] || [])]
}

/**
 * Estimate potential savings from an expense category optimization
 */
function estimateSavings(current: number, previous: number, changePercent: number): number {
  // Conservative estimate: bring spending back to 10% above previous level
  const target = previous * 1.1
  return Math.max(0, current - target)
}
