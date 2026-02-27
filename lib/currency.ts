// Multi-currency support with exchange rates
// Uses a free API with offline fallback rates

export interface CurrencyInfo {
  code: string
  name: string
  symbol: string
}

export const SUPPORTED_CURRENCIES: CurrencyInfo[] = [
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "GBP", name: "British Pound", symbol: "£" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥" },
  { code: "CAD", name: "Canadian Dollar", symbol: "C$" },
  { code: "AUD", name: "Australian Dollar", symbol: "A$" },
  { code: "INR", name: "Indian Rupee", symbol: "₹" },
  { code: "CNY", name: "Chinese Yuan", symbol: "¥" },
  { code: "BRL", name: "Brazilian Real", symbol: "R$" },
  { code: "MXN", name: "Mexican Peso", symbol: "MX$" },
  { code: "KRW", name: "South Korean Won", symbol: "₩" },
  { code: "CHF", name: "Swiss Franc", symbol: "CHF" },
  { code: "SEK", name: "Swedish Krona", symbol: "kr" },
  { code: "NOK", name: "Norwegian Krone", symbol: "kr" },
  { code: "DKK", name: "Danish Krone", symbol: "kr" },
  { code: "NZD", name: "New Zealand Dollar", symbol: "NZ$" },
  { code: "SGD", name: "Singapore Dollar", symbol: "S$" },
  { code: "HKD", name: "Hong Kong Dollar", symbol: "HK$" },
  { code: "ZAR", name: "South African Rand", symbol: "R" },
  { code: "TRY", name: "Turkish Lira", symbol: "₺" },
]

// Fallback exchange rates (relative to USD) — updated periodically
const FALLBACK_RATES: Record<string, number> = {
  USD: 1.0,
  EUR: 0.92,
  GBP: 0.79,
  JPY: 149.5,
  CAD: 1.36,
  AUD: 1.53,
  INR: 83.1,
  CNY: 7.24,
  BRL: 4.97,
  MXN: 17.15,
  KRW: 1320,
  CHF: 0.88,
  SEK: 10.42,
  NOK: 10.55,
  DKK: 6.88,
  NZD: 1.63,
  SGD: 1.34,
  HKD: 7.82,
  ZAR: 18.72,
  TRY: 30.2,
}

let cachedRates: Record<string, number> | null = null
let cacheTimestamp: number = 0
const CACHE_DURATION = 3600000 // 1 hour

// Fetch live exchange rates (uses exchangerate-api.com free tier)
export async function fetchExchangeRates(baseCurrency: string = "USD"): Promise<Record<string, number>> {
  const now = Date.now()

  // Return cached rates if still fresh
  if (cachedRates && now - cacheTimestamp < CACHE_DURATION) {
    return cachedRates
  }

  try {
    // Free API — no key required for USD base
    const res = await fetch(
      `https://api.exchangerate-api.com/v4/latest/${baseCurrency}`,
      { next: { revalidate: 3600 } }
    )
    if (!res.ok) throw new Error("API error")
    const data = await res.json()
    cachedRates = data.rates
    cacheTimestamp = now
    return data.rates
  } catch (error) {
    console.warn("Failed to fetch live exchange rates, using fallback:", error)
    // Convert fallback rates to the requested base currency
    if (baseCurrency === "USD") return FALLBACK_RATES
    const baseToUsd = FALLBACK_RATES[baseCurrency] || 1
    const converted: Record<string, number> = {}
    for (const [code, rate] of Object.entries(FALLBACK_RATES)) {
      converted[code] = rate / baseToUsd
    }
    return converted
  }
}

// Convert an amount from one currency to another
export async function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): Promise<number> {
  if (fromCurrency === toCurrency) return amount
  const rates = await fetchExchangeRates("USD")

  const fromRate = rates[fromCurrency] || 1
  const toRate = rates[toCurrency] || 1

  // Convert: amount in fromCurrency → USD → toCurrency
  const inUsd = amount / fromRate
  return inUsd * toRate
}

// Synchronous conversion using fallback rates (for client-side computations)
export function convertCurrencySync(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rates?: Record<string, number>
): number {
  if (fromCurrency === toCurrency) return amount
  const r = rates || FALLBACK_RATES
  const fromRate = r[fromCurrency] || 1
  const toRate = r[toCurrency] || 1
  return (amount / fromRate) * toRate
}

// Format a monetary value with currency symbol
export function formatCurrency(amount: number, currencyCode: string): string {
  const currency = SUPPORTED_CURRENCIES.find((c) => c.code === currencyCode)
  const symbol = currency?.symbol || "$"

  // Special handling for currencies without decimals
  const noDecimalCurrencies = ["JPY", "KRW"]
  const decimals = noDecimalCurrencies.includes(currencyCode) ? 0 : 2

  return `${symbol}${amount.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`
}

// Get the symbol for a currency code
export function getCurrencySymbol(code: string): string {
  return SUPPORTED_CURRENCIES.find((c) => c.code === code)?.symbol || "$"
}

// Get fallback rates for client-side use
export function getFallbackRates(): Record<string, number> {
  return { ...FALLBACK_RATES }
}
