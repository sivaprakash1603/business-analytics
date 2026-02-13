// Anomaly Detection Engine
// Detects spending spikes, income drops, and unusual patterns using statistical methods

export interface AnomalyAlert {
  id: string
  type: 'spending_spike' | 'income_drop' | 'unusual_pattern' | 'category_spike' | 'frequency_change'
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  metric: string
  currentValue: number
  expectedValue: number
  deviationPercent: number
  period: string
  detectedAt: string
  category?: string
  recommendation: string
}

interface TimeGroupedData {
  period: string
  total: number
  count: number
  entries: any[]
}

/**
 * Groups entries by month and sums amounts
 */
function groupByMonth(entries: any[], dateField = 'date', amountField = 'amount'): TimeGroupedData[] {
  const groups = new Map<string, { total: number; count: number; entries: any[] }>()

  entries.forEach(entry => {
    const date = new Date(entry[dateField])
    if (isNaN(date.getTime())) return
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    const existing = groups.get(key) || { total: 0, count: 0, entries: [] }
    const amount = typeof entry[amountField] === 'number' ? entry[amountField] : parseFloat(entry[amountField]) || 0
    existing.total += amount
    existing.count += 1
    existing.entries.push(entry)
    groups.set(key, existing)
  })

  return Array.from(groups.entries())
    .map(([period, data]) => ({ period, ...data }))
    .sort((a, b) => a.period.localeCompare(b.period))
}

/**
 * Groups entries by week
 */
function groupByWeek(entries: any[], dateField = 'date', amountField = 'amount'): TimeGroupedData[] {
  const groups = new Map<string, { total: number; count: number; entries: any[] }>()

  entries.forEach(entry => {
    const date = new Date(entry[dateField])
    if (isNaN(date.getTime())) return
    // ISO week
    const startOfYear = new Date(date.getFullYear(), 0, 1)
    const weekNum = Math.ceil(((date.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7)
    const key = `${date.getFullYear()}-W${String(weekNum).padStart(2, '0')}`
    const existing = groups.get(key) || { total: 0, count: 0, entries: [] }
    const amount = typeof entry[amountField] === 'number' ? entry[amountField] : parseFloat(entry[amountField]) || 0
    existing.total += amount
    existing.count += 1
    existing.entries.push(entry)
    groups.set(key, existing)
  })

  return Array.from(groups.entries())
    .map(([period, data]) => ({ period, ...data }))
    .sort((a, b) => a.period.localeCompare(b.period))
}

/**
 * Calculates z-score for a value given an array of values
 */
function zScore(value: number, values: number[]): number {
  if (values.length < 2) return 0
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length
  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length
  const stdDev = Math.sqrt(variance)
  if (stdDev === 0) return 0
  return (value - mean) / stdDev
}

/**
 * Calculate moving average
 */
function movingAverage(values: number[], window: number): number[] {
  const result: number[] = []
  for (let i = 0; i < values.length; i++) {
    const start = Math.max(0, i - window + 1)
    const slice = values.slice(start, i + 1)
    result.push(slice.reduce((s, v) => s + v, 0) / slice.length)
  }
  return result
}

/**
 * Groups spending entries by reason/category and returns category-level totals per month
 */
function groupByCategory(entries: any[]): Map<string, TimeGroupedData[]> {
  const categories = new Map<string, any[]>()

  entries.forEach(entry => {
    const category = (entry.reason || entry.source || 'Uncategorized').toLowerCase().trim()
    const existing = categories.get(category) || []
    existing.push(entry)
    categories.set(category, existing)
  })

  const result = new Map<string, TimeGroupedData[]>()
  categories.forEach((catEntries, category) => {
    result.set(category, groupByMonth(catEntries))
  })
  return result
}

/**
 * Detect spending anomalies (spikes)
 */
export function detectSpendingAnomalies(spendingEntries: any[]): AnomalyAlert[] {
  const alerts: AnomalyAlert[] = []
  if (spendingEntries.length < 3) return alerts

  // Monthly spending analysis
  const monthly = groupByMonth(spendingEntries)
  if (monthly.length < 2) return alerts

  const totals = monthly.map(m => m.total)
  const ma = movingAverage(totals, 3)

  // Check the most recent month against moving average
  for (let i = 1; i < monthly.length; i++) {
    const current = monthly[i]
    const expected = ma[i - 1] // Previous period's moving average as expectation
    const deviation = expected > 0 ? ((current.total - expected) / expected) * 100 : 0

    if (deviation > 30) {
      const severity: AnomalyAlert['severity'] =
        deviation > 100 ? 'critical' :
        deviation > 60 ? 'high' :
        deviation > 30 ? 'medium' : 'low'

      alerts.push({
        id: `spending-spike-${current.period}`,
        type: 'spending_spike',
        severity,
        title: `Spending Spike in ${current.period}`,
        description: `Spending jumped ${deviation.toFixed(0)}% above the 3-month average`,
        metric: 'Monthly Spending',
        currentValue: current.total,
        expectedValue: expected,
        deviationPercent: deviation,
        period: current.period,
        detectedAt: new Date().toISOString(),
        recommendation: deviation > 60
          ? 'Investigate immediately. Check for unusual large transactions or new recurring costs.'
          : 'Review spending categories to identify the source of the increase.'
      })
    }
  }

  // Category-level spike detection
  const categoryGroups = groupByCategory(spendingEntries)
  categoryGroups.forEach((monthlyData, category) => {
    if (monthlyData.length < 2) return
    const categoryTotals = monthlyData.map(m => m.total)
    const lastMonth = monthlyData[monthlyData.length - 1]
    const prevAvg = categoryTotals.slice(0, -1).reduce((s, v) => s + v, 0) / (categoryTotals.length - 1)

    if (prevAvg > 0) {
      const deviation = ((lastMonth.total - prevAvg) / prevAvg) * 100
      if (deviation > 50 && lastMonth.total > 100) {
        alerts.push({
          id: `category-spike-${category}-${lastMonth.period}`,
          type: 'category_spike',
          severity: deviation > 100 ? 'high' : 'medium',
          title: `"${category}" spending up ${deviation.toFixed(0)}%`,
          description: `Spending on "${category}" increased from avg $${prevAvg.toFixed(0)} to $${lastMonth.total.toFixed(0)} in ${lastMonth.period}`,
          metric: `Category: ${category}`,
          currentValue: lastMonth.total,
          expectedValue: prevAvg,
          deviationPercent: deviation,
          period: lastMonth.period,
          detectedAt: new Date().toISOString(),
          category,
          recommendation: `Review all "${category}" charges in ${lastMonth.period}. Consider negotiating rates or finding alternatives.`
        })
      }
    }
  })

  return alerts.sort((a, b) => b.deviationPercent - a.deviationPercent)
}

/**
 * Detect income anomalies (drops)
 */
export function detectIncomeAnomalies(incomeEntries: any[]): AnomalyAlert[] {
  const alerts: AnomalyAlert[] = []
  if (incomeEntries.length < 3) return alerts

  const monthly = groupByMonth(incomeEntries)
  if (monthly.length < 2) return alerts

  const totals = monthly.map(m => m.total)
  const ma = movingAverage(totals, 3)

  for (let i = 1; i < monthly.length; i++) {
    const current = monthly[i]
    const expected = ma[i - 1]
    const deviation = expected > 0 ? ((current.total - expected) / expected) * 100 : 0

    // Income drops (negative deviation)
    if (deviation < -20) {
      const dropPercent = Math.abs(deviation)
      const severity: AnomalyAlert['severity'] =
        dropPercent > 60 ? 'critical' :
        dropPercent > 40 ? 'high' :
        dropPercent > 20 ? 'medium' : 'low'

      alerts.push({
        id: `income-drop-${current.period}`,
        type: 'income_drop',
        severity,
        title: `Income Drop in ${current.period}`,
        description: `Income fell ${dropPercent.toFixed(0)}% below the 3-month average`,
        metric: 'Monthly Income',
        currentValue: current.total,
        expectedValue: expected,
        deviationPercent: deviation,
        period: current.period,
        detectedAt: new Date().toISOString(),
        recommendation: dropPercent > 40
          ? 'Critical revenue decline. Contact top clients, review pipeline, and consider emergency measures.'
          : 'Investigate whether this is seasonal or a client loss. Ramp up sales and outreach.'
      })
    }

    // Transaction frequency changes
    const prevCount = i > 0 ? monthly[i - 1].count : 0
    if (prevCount > 0 && current.count < prevCount * 0.5 && prevCount >= 3) {
      alerts.push({
        id: `frequency-drop-${current.period}`,
        type: 'frequency_change',
        severity: 'medium',
        title: `Transaction Frequency Dropped in ${current.period}`,
        description: `Only ${current.count} transactions vs ${prevCount} last month (${((1 - current.count / prevCount) * 100).toFixed(0)}% fewer)`,
        metric: 'Transaction Count',
        currentValue: current.count,
        expectedValue: prevCount,
        deviationPercent: ((current.count - prevCount) / prevCount) * 100,
        period: current.period,
        detectedAt: new Date().toISOString(),
        recommendation: 'Fewer transactions may indicate client churn. Reach out to inactive clients.'
      })
    }
  }

  return alerts.sort((a, b) => Math.abs(b.deviationPercent) - Math.abs(a.deviationPercent))
}

/**
 * Detect unusual patterns across the full dataset
 */
export function detectUnusualPatterns(
  incomeEntries: any[],
  spendingEntries: any[]
): AnomalyAlert[] {
  const alerts: AnomalyAlert[] = []

  // Check if spending growth outpaces income growth
  const incomeMonthly = groupByMonth(incomeEntries)
  const spendingMonthly = groupByMonth(spendingEntries)

  if (incomeMonthly.length >= 3 && spendingMonthly.length >= 3) {
    const recentIncomeGrowth = incomeMonthly.length >= 2
      ? ((incomeMonthly[incomeMonthly.length - 1].total - incomeMonthly[incomeMonthly.length - 2].total) / incomeMonthly[incomeMonthly.length - 2].total) * 100
      : 0

    const recentSpendingGrowth = spendingMonthly.length >= 2
      ? ((spendingMonthly[spendingMonthly.length - 1].total - spendingMonthly[spendingMonthly.length - 2].total) / spendingMonthly[spendingMonthly.length - 2].total) * 100
      : 0

    if (recentSpendingGrowth > 0 && recentIncomeGrowth < recentSpendingGrowth && (recentSpendingGrowth - recentIncomeGrowth) > 15) {
      alerts.push({
        id: `pattern-spending-outpacing-${Date.now()}`,
        type: 'unusual_pattern',
        severity: recentSpendingGrowth - recentIncomeGrowth > 30 ? 'high' : 'medium',
        title: 'Spending Growth Outpacing Income',
        description: `Spending grew ${recentSpendingGrowth.toFixed(1)}% while income ${recentIncomeGrowth > 0 ? `only grew ${recentIncomeGrowth.toFixed(1)}%` : `declined ${Math.abs(recentIncomeGrowth).toFixed(1)}%`}`,
        metric: 'Growth Rate Gap',
        currentValue: recentSpendingGrowth,
        expectedValue: recentIncomeGrowth,
        deviationPercent: recentSpendingGrowth - recentIncomeGrowth,
        period: spendingMonthly[spendingMonthly.length - 1].period,
        detectedAt: new Date().toISOString(),
        recommendation: 'Your cost structure is expanding faster than revenue. Review new costs and consider cost controls.'
      })
    }

    // Check for profit margin compression
    const lastIncome = incomeMonthly[incomeMonthly.length - 1]
    const lastSpending = spendingMonthly[spendingMonthly.length - 1]
    const prevIncome = incomeMonthly.length >= 3 ? incomeMonthly[incomeMonthly.length - 3] : null
    const prevSpending = spendingMonthly.length >= 3 ? spendingMonthly[spendingMonthly.length - 3] : null

    if (lastIncome && lastSpending && prevIncome && prevSpending) {
      const currentMargin = lastIncome.total > 0 ? ((lastIncome.total - lastSpending.total) / lastIncome.total) * 100 : 0
      const prevMargin = prevIncome.total > 0 ? ((prevIncome.total - prevSpending.total) / prevIncome.total) * 100 : 0

      if (prevMargin > 0 && currentMargin < prevMargin && (prevMargin - currentMargin) > 10) {
        alerts.push({
          id: `pattern-margin-compression-${Date.now()}`,
          type: 'unusual_pattern',
          severity: currentMargin < 5 ? 'critical' : currentMargin < 15 ? 'high' : 'medium',
          title: 'Profit Margin Compression',
          description: `Profit margin dropped from ${prevMargin.toFixed(1)}% to ${currentMargin.toFixed(1)}% over 3 months`,
          metric: 'Profit Margin',
          currentValue: currentMargin,
          expectedValue: prevMargin,
          deviationPercent: ((currentMargin - prevMargin) / prevMargin) * 100,
          period: lastIncome.period,
          detectedAt: new Date().toISOString(),
          recommendation: currentMargin < 5
            ? 'Profit margins are dangerously low. Immediately review pricing and cut non-essential costs.'
            : 'Margins are shrinking. Analyze whether costs are rising or pricing needs adjustment.'
        })
      }
    }
  }

  return alerts
}

/**
 * Run full anomaly detection and return all alerts sorted by severity
 */
export function runFullAnomalyDetection(
  incomeEntries: any[],
  spendingEntries: any[]
): AnomalyAlert[] {
  const spendingAlerts = detectSpendingAnomalies(spendingEntries)
  const incomeAlerts = detectIncomeAnomalies(incomeEntries)
  const patternAlerts = detectUnusualPatterns(incomeEntries, spendingEntries)

  const allAlerts = [...spendingAlerts, ...incomeAlerts, ...patternAlerts]

  // Sort by severity then deviation
  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
  return allAlerts.sort((a, b) => {
    const sevDiff = severityOrder[a.severity] - severityOrder[b.severity]
    if (sevDiff !== 0) return sevDiff
    return Math.abs(b.deviationPercent) - Math.abs(a.deviationPercent)
  })
}
