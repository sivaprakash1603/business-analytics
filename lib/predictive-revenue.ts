// Predictive Revenue Modeling
// Uses historical income data to forecast future revenue
// Implements linear regression, weighted moving averages, and seasonal decomposition

export interface RevenueDataPoint {
  date: string        // ISO date or YYYY-MM
  amount: number
  source?: string
}

export interface ForecastPoint {
  date: string        // YYYY-MM
  predicted: number
  lowerBound: number
  upperBound: number
  confidence: number  // 0-1
}

export interface RevenueForecast {
  historical: { date: string; amount: number }[]
  forecast: ForecastPoint[]
  trend: 'growing' | 'declining' | 'stable' | 'volatile'
  growthRate: number  // monthly percentage
  seasonalPattern: boolean
  summary: string
  metrics: {
    averageMonthlyRevenue: number
    projectedAnnualRevenue: number
    bestMonth: string
    worstMonth: string
    volatility: number  // coefficient of variation
  }
}

/**
 * Generate a multi-month revenue forecast from historical income data
 */
export function generateRevenueForecast(
  incomeEntries: any[],
  forecastMonths: number = 6
): RevenueForecast {
  // 1. Aggregate income by month
  const monthlyData = aggregateByMonth(incomeEntries)

  if (monthlyData.length < 3) {
    return createEmptyForecast(monthlyData, 'Insufficient data — need at least 3 months of income history')
  }

  const amounts = monthlyData.map(d => d.amount)

  // 2. Compute basic statistics
  const mean = amounts.reduce((s, v) => s + v, 0) / amounts.length
  const stdDev = Math.sqrt(amounts.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / amounts.length)
  const volatility = mean > 0 ? stdDev / mean : 0

  // 3. Detect seasonality (if at least 12 months)
  const seasonalFactors = detectSeasonality(monthlyData)
  const hasSeasonality = seasonalFactors !== null

  // 4. Compute trend via linear regression
  const regression = linearRegression(amounts)

  // 5. Weighted moving average (recent months weighted more)
  const wma = weightedMovingAverage(amounts, Math.min(6, Math.floor(amounts.length / 2)))

  // 6. Determine overall trend
  const trend = determineTrend(regression, volatility, amounts)

  // 7. Monthly growth rate
  const growthRates: number[] = []
  for (let i = 1; i < amounts.length; i++) {
    if (amounts[i - 1] > 0) {
      growthRates.push((amounts[i] - amounts[i - 1]) / amounts[i - 1])
    }
  }
  const avgGrowthRate = growthRates.length > 0
    ? growthRates.reduce((s, v) => s + v, 0) / growthRates.length
    : 0

  // 8. Generate forecast
  const forecast = generateForecastPoints(
    monthlyData, amounts, regression, wma,
    seasonalFactors, volatility, forecastMonths
  )

  // 9. Find best/worst months
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const monthlyAvgs: Record<number, number[]> = {}
  monthlyData.forEach(d => {
    const m = new Date(d.date + '-01').getMonth()
    if (!monthlyAvgs[m]) monthlyAvgs[m] = []
    monthlyAvgs[m].push(d.amount)
  })

  let bestMonth = 'N/A', worstMonth = 'N/A'
  let bestAvg = -Infinity, worstAvg = Infinity
  Object.entries(monthlyAvgs).forEach(([m, vals]) => {
    const avg = vals.reduce((s, v) => s + v, 0) / vals.length
    if (avg > bestAvg) { bestAvg = avg; bestMonth = monthNames[parseInt(m)] }
    if (avg < worstAvg) { worstAvg = avg; worstMonth = monthNames[parseInt(m)] }
  })

  // 10. Projected annual revenue
  const lastForecastValues = forecast.map(f => f.predicted)
  const recentMonthlyAvg = amounts.slice(-3).reduce((s, v) => s + v, 0) / Math.min(3, amounts.length)
  const projectedAnnual = recentMonthlyAvg * 12 * (1 + avgGrowthRate)

  // 11. Summary
  const trendLabel = trend === 'growing' ? '📈 Growing' : trend === 'declining' ? '📉 Declining' : trend === 'volatile' ? '📊 Volatile' : '➡️ Stable'
  const summary = buildForecastSummary(trend, avgGrowthRate, mean, forecast, hasSeasonality, volatility, bestMonth, worstMonth)

  return {
    historical: monthlyData,
    forecast,
    trend,
    growthRate: avgGrowthRate * 100,
    seasonalPattern: hasSeasonality,
    summary,
    metrics: {
      averageMonthlyRevenue: Math.round(mean),
      projectedAnnualRevenue: Math.round(projectedAnnual),
      bestMonth,
      worstMonth,
      volatility: Math.round(volatility * 100) / 100,
    }
  }
}

/**
 * Aggregate individual income entries into monthly totals
 */
function aggregateByMonth(entries: any[]): { date: string; amount: number }[] {
  const monthly: Record<string, number> = {}

  entries.forEach(entry => {
    const date = entry.date || entry.createdAt
    if (!date) return

    const d = new Date(date)
    if (isNaN(d.getTime())) return

    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    monthly[key] = (monthly[key] || 0) + (typeof entry.amount === 'number' ? entry.amount : parseFloat(entry.amount) || 0)
  })

  // Sort chronologically and fill gaps
  const keys = Object.keys(monthly).sort()
  if (keys.length < 2) return keys.map(k => ({ date: k, amount: monthly[k] }))

  const result: { date: string; amount: number }[] = []
  const startDate = new Date(keys[0] + '-01')
  const endDate = new Date(keys[keys.length - 1] + '-01')

  const current = new Date(startDate)
  while (current <= endDate) {
    const key = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`
    result.push({ date: key, amount: monthly[key] || 0 })
    current.setMonth(current.getMonth() + 1)
  }

  return result
}

/**
 * Simple linear regression: y = slope*x + intercept
 */
function linearRegression(values: number[]): { slope: number; intercept: number; r2: number } {
  const n = values.length
  if (n < 2) return { slope: 0, intercept: values[0] || 0, r2: 0 }

  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0
  for (let i = 0; i < n; i++) {
    sumX += i
    sumY += values[i]
    sumXY += i * values[i]
    sumX2 += i * i
  }

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
  const intercept = (sumY - slope * sumX) / n

  // R-squared
  const yMean = sumY / n
  let ssTot = 0, ssRes = 0
  for (let i = 0; i < n; i++) {
    ssTot += Math.pow(values[i] - yMean, 2)
    ssRes += Math.pow(values[i] - (slope * i + intercept), 2)
  }
  const r2 = ssTot > 0 ? 1 - ssRes / ssTot : 0

  return { slope, intercept, r2 }
}

/**
 * Weighted Moving Average — recent values have higher weight
 */
function weightedMovingAverage(values: number[], window: number): number {
  if (values.length === 0) return 0
  const w = Math.min(window, values.length)
  const slice = values.slice(-w)

  let totalWeight = 0
  let weightedSum = 0
  for (let i = 0; i < slice.length; i++) {
    const weight = i + 1 // linear increasing weight
    weightedSum += slice[i] * weight
    totalWeight += weight
  }
  return totalWeight > 0 ? weightedSum / totalWeight : 0
}

/**
 * Detect seasonal patterns (min 12 months needed)
 * Returns seasonal multipliers for each month, or null if not seasonal
 */
function detectSeasonality(data: { date: string; amount: number }[]): number[] | null {
  if (data.length < 12) return null

  const mean = data.reduce((s, d) => s + d.amount, 0) / data.length
  if (mean === 0) return null

  // Group by month index
  const monthBuckets: Record<number, number[]> = {}
  data.forEach(d => {
    const m = new Date(d.date + '-01').getMonth()
    if (!monthBuckets[m]) monthBuckets[m] = []
    monthBuckets[m].push(d.amount)
  })

  // Calculate seasonal factors (ratio to mean)
  const factors: number[] = new Array(12).fill(1)
  Object.entries(monthBuckets).forEach(([m, vals]) => {
    const monthAvg = vals.reduce((s, v) => s + v, 0) / vals.length
    factors[parseInt(m)] = monthAvg / mean
  })

  // Check if there's meaningful seasonality (variation > 10%)
  const factorVariance = factors.reduce((s, f) => s + Math.pow(f - 1, 2), 0) / 12
  if (factorVariance < 0.01) return null // Not enough seasonal variation

  return factors
}

/**
 * Determine overall revenue trend
 */
function determineTrend(
  regression: { slope: number; intercept: number; r2: number },
  volatility: number,
  values: number[]
): RevenueForecast['trend'] {
  const mean = values.reduce((s, v) => s + v, 0) / values.length
  if (mean === 0) return 'stable'

  const normalizedSlope = mean > 0 ? regression.slope / mean : 0

  if (volatility > 0.5) return 'volatile'
  if (normalizedSlope > 0.03 && regression.r2 > 0.3) return 'growing'
  if (normalizedSlope < -0.03 && regression.r2 > 0.3) return 'declining'
  return 'stable'
}

/**
 * Generate forecast data points using ensemble of methods
 */
function generateForecastPoints(
  historical: { date: string; amount: number }[],
  amounts: number[],
  regression: { slope: number; intercept: number; r2: number },
  wma: number,
  seasonalFactors: number[] | null,
  volatility: number,
  months: number
): ForecastPoint[] {
  const forecast: ForecastPoint[] = []
  const n = amounts.length
  const lastDate = new Date(historical[historical.length - 1].date + '-01')

  for (let i = 1; i <= months; i++) {
    const forecastDate = new Date(lastDate)
    forecastDate.setMonth(forecastDate.getMonth() + i)
    const month = forecastDate.getMonth()
    const dateStr = `${forecastDate.getFullYear()}-${String(month + 1).padStart(2, '0')}`

    // Method 1: Linear regression extrapolation
    const regValue = regression.slope * (n + i - 1) + regression.intercept

    // Method 2: Weighted moving average with trend
    const trendAdjustedWMA = wma + regression.slope * i

    // Method 3: Exponential smoothing (Holt's linear)
    const alpha = 0.3 // level smoothing
    const beta = 0.1  // trend smoothing
    let level = amounts[amounts.length - 1]
    let trendEst = regression.slope
    for (let j = 0; j < i; j++) {
      level = level + trendEst
      trendEst = trendEst * (1 - beta) + regression.slope * beta
    }
    const expSmoothed = level

    // Ensemble: weighted average of methods (regression weighted by R²)
    const regWeight = regression.r2 * 0.4
    const wmaWeight = 0.35
    const expWeight = 0.25
    const totalWeight = regWeight + wmaWeight + expWeight

    let predicted = (regValue * regWeight + trendAdjustedWMA * wmaWeight + expSmoothed * expWeight) / totalWeight

    // Apply seasonal adjustment
    if (seasonalFactors) {
      predicted *= seasonalFactors[month]
    }

    // Ensure non-negative
    predicted = Math.max(0, predicted)

    // Confidence interval widens with forecast horizon
    const confidence = Math.max(0.3, 1 - (i * 0.08) - (volatility * 0.3))
    const errorMargin = predicted * (1 - confidence) * (1 + volatility)
    const lowerBound = Math.max(0, predicted - errorMargin)
    const upperBound = predicted + errorMargin

    forecast.push({
      date: dateStr,
      predicted: Math.round(predicted),
      lowerBound: Math.round(lowerBound),
      upperBound: Math.round(upperBound),
      confidence: Math.round(confidence * 100) / 100,
    })
  }

  return forecast
}

/**
 * Build a human-readable forecast summary
 */
function buildForecastSummary(
  trend: RevenueForecast['trend'],
  growthRate: number,
  avgMonthly: number,
  forecast: ForecastPoint[],
  seasonal: boolean,
  volatility: number,
  bestMonth: string,
  worstMonth: string,
): string {
  const lines: string[] = []

  const trendEmoji = trend === 'growing' ? '📈' : trend === 'declining' ? '📉' : trend === 'volatile' ? '📊' : '➡️'
  lines.push(`${trendEmoji} **Revenue Trend: ${trend.charAt(0).toUpperCase() + trend.slice(1)}**`)
  lines.push('')

  if (growthRate !== 0) {
    const dir = growthRate > 0 ? 'growth' : 'decline'
    lines.push(`• Average monthly ${dir}: **${Math.abs(growthRate * 100).toFixed(1)}%**`)
  }
  lines.push(`• Average monthly revenue: **$${avgMonthly.toLocaleString()}**`)

  if (forecast.length > 0) {
    const nextMonth = forecast[0]
    const lastForecast = forecast[forecast.length - 1]
    lines.push(`• Next month forecast: **$${nextMonth.predicted.toLocaleString()}** (${Math.round(nextMonth.confidence * 100)}% confidence)`)
    lines.push(`• ${forecast.length}-month forecast: **$${lastForecast.predicted.toLocaleString()}** (${Math.round(lastForecast.confidence * 100)}% confidence)`)
  }

  if (seasonal) {
    lines.push(`• Seasonal pattern detected — strongest month: **${bestMonth}**, weakest: **${worstMonth}**`)
  }

  if (volatility > 0.3) {
    lines.push(`\n⚠️ High revenue volatility detected (${(volatility * 100).toFixed(0)}% CV). Forecasts may be less reliable. Consider diversifying revenue sources.`)
  }

  return lines.join('\n')
}

/**
 * Create an empty/minimal forecast when data is insufficient
 */
function createEmptyForecast(data: { date: string; amount: number }[], message: string): RevenueForecast {
  const total = data.reduce((s, d) => s + d.amount, 0)
  return {
    historical: data,
    forecast: [],
    trend: 'stable',
    growthRate: 0,
    seasonalPattern: false,
    summary: `⚠️ ${message}\n\nAdd more income entries over time to enable accurate forecasting.`,
    metrics: {
      averageMonthlyRevenue: data.length > 0 ? Math.round(total / data.length) : 0,
      projectedAnnualRevenue: 0,
      bestMonth: 'N/A',
      worstMonth: 'N/A',
      volatility: 0
    }
  }
}
