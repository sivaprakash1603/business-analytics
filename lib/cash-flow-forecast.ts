// Cash Flow Forecasting Engine
// Projects future cash position based on recurring transactions, seasonality, and trends

export interface CashFlowDataPoint {
  date: string        // YYYY-MM
  income: number
  spending: number
  netCashFlow: number
  cumulativeBalance: number
}

export interface RecurringTransaction {
  type: 'income' | 'expense'
  category: string
  amount: number
  frequency: 'weekly' | 'monthly' | 'quarterly'
  confidence: number  // 0-1
}

export interface CashFlowForecast {
  historical: CashFlowDataPoint[]
  projected: CashFlowDataPoint[]
  recurringIncome: RecurringTransaction[]
  recurringExpenses: RecurringTransaction[]
  summary: {
    currentBalance: number
    projectedBalance3Mo: number
    projectedBalance6Mo: number
    burnRate: number        // monthly avg net outflow if negative
    runway: number | null   // months until cash runs out (null = infinite)
    avgMonthlyInflow: number
    avgMonthlyOutflow: number
    seasonalTrend: string
  }
  warnings: string[]
}

/**
 * Main entry: generate a full cash flow forecast
 */
export function generateCashFlowForecast(
  incomeEntries: any[],
  spendingEntries: any[],
  forecastMonths: number = 6,
  startingBalance: number = 0
): CashFlowForecast {
  // 1. Build historical monthly cash flow
  const historical = buildHistoricalCashFlow(incomeEntries, spendingEntries)

  if (historical.length < 2) {
    return createEmptyForecast(historical, startingBalance)
  }

  // 2. Detect recurring transactions
  const recurringIncome = detectRecurring(incomeEntries, 'income')
  const recurringExpenses = detectRecurring(spendingEntries, 'expense')

  // 3. Compute seasonal indices (if 6+ months)
  const incomeSeasonality = computeSeasonalIndices(historical.map(h => h.income))
  const spendingSeasonality = computeSeasonalIndices(historical.map(h => h.spending))

  // 4. Compute trend
  const incomeTrend = linearTrend(historical.map(h => h.income))
  const spendingTrend = linearTrend(historical.map(h => h.spending))

  // 5. Generate projections
  const lastMonth = historical[historical.length - 1]
  const currentBalance = startingBalance + historical.reduce((s, h) => s + h.netCashFlow, 0)
  const projected = projectCashFlow(
    historical, currentBalance, forecastMonths,
    incomeTrend, spendingTrend,
    incomeSeasonality, spendingSeasonality,
    recurringIncome, recurringExpenses
  )

  // 6. Compute summary
  const avgInflow = historical.length > 0
    ? historical.reduce((s, h) => s + h.income, 0) / historical.length
    : 0
  const avgOutflow = historical.length > 0
    ? historical.reduce((s, h) => s + h.spending, 0) / historical.length
    : 0
  const netAvg = avgInflow - avgOutflow
  const burnRate = netAvg < 0 ? Math.abs(netAvg) : 0
  const runway = burnRate > 0 ? Math.max(0, currentBalance / burnRate) : null

  const proj3 = projected.length >= 3 ? projected[2].cumulativeBalance : currentBalance
  const proj6 = projected.length >= 6 ? projected[5].cumulativeBalance : projected[projected.length - 1]?.cumulativeBalance ?? currentBalance

  // Seasonal trend label
  const recentMonths = historical.slice(-3)
  const priorMonths = historical.slice(-6, -3)
  let seasonalTrend = 'stable'
  if (priorMonths.length >= 3) {
    const recentAvg = recentMonths.reduce((s, h) => s + h.netCashFlow, 0) / recentMonths.length
    const priorAvg = priorMonths.reduce((s, h) => s + h.netCashFlow, 0) / priorMonths.length
    if (recentAvg > priorAvg * 1.1) seasonalTrend = 'improving'
    else if (recentAvg < priorAvg * 0.9) seasonalTrend = 'deteriorating'
  }

  // 7. Warnings
  const warnings: string[] = []
  if (burnRate > 0) {
    warnings.push(`You're burning $${Math.round(burnRate).toLocaleString()}/month on average. Runway: ${runway !== null ? `~${Math.round(runway)} months` : 'N/A'}.`)
  }
  const negativeMonths = projected.filter(p => p.cumulativeBalance < 0)
  if (negativeMonths.length > 0) {
    warnings.push(`Cash position is projected to go negative by ${negativeMonths[0].date}.`)
  }
  if (spendingTrend.slope > incomeTrend.slope && spendingTrend.slope > 0) {
    warnings.push('Spending growth is outpacing income growth. Monitor expenses closely.')
  }
  const highConcentration = recurringIncome.filter(r => r.confidence > 0.5)
  if (highConcentration.length === 1 && avgInflow > 0) {
    warnings.push('Revenue is concentrated in a single recurring source. Consider diversification.')
  }

  return {
    historical,
    projected,
    recurringIncome,
    recurringExpenses,
    summary: {
      currentBalance: Math.round(currentBalance),
      projectedBalance3Mo: Math.round(proj3),
      projectedBalance6Mo: Math.round(proj6),
      burnRate: Math.round(burnRate),
      runway: runway !== null ? Math.round(runway * 10) / 10 : null,
      avgMonthlyInflow: Math.round(avgInflow),
      avgMonthlyOutflow: Math.round(avgOutflow),
      seasonalTrend,
    },
    warnings,
  }
}

/** Build monthly cash flow from raw entries */
function buildHistoricalCashFlow(income: any[], spending: any[]): CashFlowDataPoint[] {
  const months = new Map<string, { income: number; spending: number }>()

  const addEntry = (entries: any[], field: 'income' | 'spending') => {
    entries.forEach(e => {
      const d = new Date(e.date || e.createdAt)
      if (isNaN(d.getTime())) return
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      if (!months.has(key)) months.set(key, { income: 0, spending: 0 })
      const amount = typeof e.amount === 'number' ? e.amount : parseFloat(e.amount) || 0
      months.get(key)![field] += amount
    })
  }

  addEntry(income, 'income')
  addEntry(spending, 'spending')

  const sorted = Array.from(months.entries()).sort(([a], [b]) => a.localeCompare(b))

  // Fill gaps
  if (sorted.length < 2) {
    return sorted.map(([date, data]) => ({
      date,
      income: data.income,
      spending: data.spending,
      netCashFlow: data.income - data.spending,
      cumulativeBalance: data.income - data.spending,
    }))
  }

  const result: CashFlowDataPoint[] = []
  const startDate = new Date(sorted[0][0] + '-01')
  const endDate = new Date(sorted[sorted.length - 1][0] + '-01')
  const allMonths = new Map(sorted)

  let cumulative = 0
  const current = new Date(startDate)
  while (current <= endDate) {
    const key = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`
    const data = allMonths.get(key) || { income: 0, spending: 0 }
    const net = data.income - data.spending
    cumulative += net
    result.push({
      date: key,
      income: data.income,
      spending: data.spending,
      netCashFlow: net,
      cumulativeBalance: cumulative,
    })
    current.setMonth(current.getMonth() + 1)
  }

  return result
}

/** Detect recurring transactions by grouping by source/reason */
function detectRecurring(entries: any[], type: 'income' | 'expense'): RecurringTransaction[] {
  const field = type === 'income' ? 'source' : 'reason'
  const grouped = new Map<string, { amounts: number[]; dates: Date[] }>()

  entries.forEach(e => {
    const category = (e[field] || 'Unknown').toLowerCase().trim()
    const d = new Date(e.date || e.createdAt)
    const amount = typeof e.amount === 'number' ? e.amount : parseFloat(e.amount) || 0
    if (isNaN(d.getTime()) || amount <= 0) return

    if (!grouped.has(category)) grouped.set(category, { amounts: [], dates: [] })
    grouped.get(category)!.amounts.push(amount)
    grouped.get(category)!.dates.push(d)
  })

  const recurring: RecurringTransaction[] = []

  grouped.forEach((data, category) => {
    if (data.amounts.length < 2) return

    // Check consistency
    const avgAmount = data.amounts.reduce((s, v) => s + v, 0) / data.amounts.length
    const amountVariance = data.amounts.reduce((s, v) => s + Math.pow(v - avgAmount, 2), 0) / data.amounts.length
    const amountCV = avgAmount > 0 ? Math.sqrt(amountVariance) / avgAmount : 1

    // Check frequency
    const sortedDates = data.dates.sort((a, b) => a.getTime() - b.getTime())
    const gaps: number[] = []
    for (let i = 1; i < sortedDates.length; i++) {
      gaps.push((sortedDates[i].getTime() - sortedDates[i - 1].getTime()) / (1000 * 60 * 60 * 24))
    }
    const avgGap = gaps.length > 0 ? gaps.reduce((s, v) => s + v, 0) / gaps.length : 999

    let frequency: RecurringTransaction['frequency'] = 'monthly'
    if (avgGap <= 10) frequency = 'weekly'
    else if (avgGap <= 45) frequency = 'monthly'
    else if (avgGap <= 120) frequency = 'quarterly'
    else return // Not recurring enough

    // Confidence based on consistency and count
    const gapCV = gaps.length > 0
      ? Math.sqrt(gaps.reduce((s, v) => s + Math.pow(v - avgGap, 2), 0) / gaps.length) / Math.max(avgGap, 1)
      : 1
    const confidence = Math.max(0, Math.min(1,
      (1 - amountCV * 0.5) * (1 - gapCV * 0.5) * Math.min(data.amounts.length / 4, 1)
    ))

    if (confidence > 0.2) {
      recurring.push({
        type,
        category: category.charAt(0).toUpperCase() + category.slice(1),
        amount: Math.round(avgAmount),
        frequency,
        confidence: Math.round(confidence * 100) / 100,
      })
    }
  })

  return recurring.sort((a, b) => b.amount - a.amount)
}

/** Simple linear trend: returns slope and intercept */
function linearTrend(values: number[]): { slope: number; intercept: number } {
  const n = values.length
  if (n < 2) return { slope: 0, intercept: values[0] || 0 }

  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0
  for (let i = 0; i < n; i++) {
    sumX += i; sumY += values[i]; sumXY += i * values[i]; sumX2 += i * i
  }
  const denom = n * sumX2 - sumX * sumX
  const slope = denom !== 0 ? (n * sumXY - sumX * sumY) / denom : 0
  const intercept = (sumY - slope * sumX) / n
  return { slope, intercept }
}

/** Compute seasonal indices (ratio to moving average) */
function computeSeasonalIndices(values: number[]): number[] | null {
  if (values.length < 6) return null
  const mean = values.reduce((s, v) => s + v, 0) / values.length
  if (mean === 0) return null

  // Group by month position modulo 12
  const buckets: number[][] = Array.from({ length: 12 }, () => [])
  values.forEach((v, i) => buckets[i % 12].push(v))

  const indices = buckets.map(b =>
    b.length > 0 ? (b.reduce((s, v) => s + v, 0) / b.length) / mean : 1
  )

  // Check if there's meaningful variation
  const variance = indices.reduce((s, v) => s + Math.pow(v - 1, 2), 0) / 12
  return variance > 0.01 ? indices : null
}

/** Project future cash flow */
function projectCashFlow(
  historical: CashFlowDataPoint[],
  currentBalance: number,
  months: number,
  incomeTrend: { slope: number; intercept: number },
  spendingTrend: { slope: number; intercept: number },
  incomeSeasonal: number[] | null,
  spendingSeasonal: number[] | null,
  recurringIncome: RecurringTransaction[],
  recurringExpenses: RecurringTransaction[],
): CashFlowDataPoint[] {
  const n = historical.length
  const lastDate = new Date(historical[n - 1].date + '-01')
  const projected: CashFlowDataPoint[] = []
  let cumBalance = currentBalance

  // Recent averages for blending
  const recent = historical.slice(-3)
  const recentAvgIncome = recent.reduce((s, h) => s + h.income, 0) / recent.length
  const recentAvgSpending = recent.reduce((s, h) => s + h.spending, 0) / recent.length

  for (let i = 1; i <= months; i++) {
    const projDate = new Date(lastDate)
    projDate.setMonth(projDate.getMonth() + i)
    const monthIdx = projDate.getMonth()
    const dateStr = `${projDate.getFullYear()}-${String(monthIdx + 1).padStart(2, '0')}`

    // Blend trend + recent average (60/40)
    let projIncome = incomeTrend.slope * (n + i - 1) + incomeTrend.intercept
    projIncome = projIncome * 0.4 + recentAvgIncome * 0.6

    let projSpending = spendingTrend.slope * (n + i - 1) + spendingTrend.intercept
    projSpending = projSpending * 0.4 + recentAvgSpending * 0.6

    // Apply seasonal factors
    if (incomeSeasonal) projIncome *= incomeSeasonal[monthIdx]
    if (spendingSeasonal) projSpending *= spendingSeasonal[monthIdx]

    // Ensure non-negative
    projIncome = Math.max(0, projIncome)
    projSpending = Math.max(0, projSpending)

    const net = projIncome - projSpending
    cumBalance += net

    projected.push({
      date: dateStr,
      income: Math.round(projIncome),
      spending: Math.round(projSpending),
      netCashFlow: Math.round(net),
      cumulativeBalance: Math.round(cumBalance),
    })
  }

  return projected
}

function createEmptyForecast(historical: CashFlowDataPoint[], startingBalance: number): CashFlowForecast {
  return {
    historical,
    projected: [],
    recurringIncome: [],
    recurringExpenses: [],
    summary: {
      currentBalance: startingBalance,
      projectedBalance3Mo: startingBalance,
      projectedBalance6Mo: startingBalance,
      burnRate: 0,
      runway: null,
      avgMonthlyInflow: 0,
      avgMonthlyOutflow: 0,
      seasonalTrend: 'stable',
    },
    warnings: ['Insufficient data — need at least 2 months of transaction history for forecasting.'],
  }
}
