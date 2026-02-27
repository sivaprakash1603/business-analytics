"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  SUPPORTED_CURRENCIES,
  convertCurrencySync,
  formatCurrency,
  getFallbackRates,
} from "@/lib/currency"
import { ArrowRightLeft, RefreshCw, Globe } from "lucide-react"

interface CurrencyConverterProps {
  defaultCurrency?: string
  onCurrencyChange?: (currency: string) => void
}

export default function CurrencyConverter({
  defaultCurrency = "USD",
  onCurrencyChange,
}: CurrencyConverterProps) {
  const [amount, setAmount] = useState("100")
  const [fromCurrency, setFromCurrency] = useState(defaultCurrency)
  const [toCurrency, setToCurrency] = useState("EUR")
  const [rates, setRates] = useState<Record<string, number>>(getFallbackRates())
  const [convertedAmount, setConvertedAmount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)

  const fetchRates = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`https://api.exchangerate-api.com/v4/latest/USD`)
      if (res.ok) {
        const data = await res.json()
        setRates(data.rates)
        setLastUpdated(new Date().toLocaleTimeString())
      }
    } catch {
      // Use fallback rates
      console.warn("Using fallback exchange rates")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRates()
  }, [fetchRates])

  useEffect(() => {
    const value = parseFloat(amount) || 0
    const result = convertCurrencySync(value, fromCurrency, toCurrency, rates)
    setConvertedAmount(result)
  }, [amount, fromCurrency, toCurrency, rates])

  const swap = () => {
    setFromCurrency(toCurrency)
    setToCurrency(fromCurrency)
  }

  const fromInfo = SUPPORTED_CURRENCIES.find((c) => c.code === fromCurrency)
  const toInfo = SUPPORTED_CURRENCIES.find((c) => c.code === toCurrency)

  // Exchange rate for display
  const rate = convertCurrencySync(1, fromCurrency, toCurrency, rates)

  return (
    <Card className="glow-card backdrop-blur shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
              <Globe className="h-5 w-5 text-indigo-500" />
              Currency Converter
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-300">
              Convert between {SUPPORTED_CURRENCIES.length} currencies with live rates
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={fetchRates} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-end gap-3">
          {/* From */}
          <div className="flex-1 space-y-2">
            <Label className="text-xs text-gray-500">From</Label>
            <Select value={fromCurrency} onValueChange={(v) => {
              setFromCurrency(v)
              onCurrencyChange?.(v)
            }}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SUPPORTED_CURRENCIES.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    {c.symbol} {c.code} — {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="text-lg font-semibold"
            />
          </div>

          {/* Swap */}
          <Button variant="outline" size="sm" onClick={swap} className="mb-1">
            <ArrowRightLeft className="h-4 w-4" />
          </Button>

          {/* To */}
          <div className="flex-1 space-y-2">
            <Label className="text-xs text-gray-500">To</Label>
            <Select value={toCurrency} onValueChange={setToCurrency}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SUPPORTED_CURRENCIES.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    {c.symbol} {c.code} — {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-lg font-semibold text-gray-900 dark:text-white min-h-[42px] flex items-center">
              {formatCurrency(convertedAmount, toCurrency)}
            </div>
          </div>
        </div>

        {/* Rate Info */}
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>
            1 {fromCurrency} = {rate.toFixed(
              ["JPY", "KRW", "INR"].includes(toCurrency) ? 2 : 4
            )}{" "}
            {toCurrency}
          </span>
          {lastUpdated && <span>Updated: {lastUpdated}</span>}
        </div>

        {/* Quick Convert Row */}
        <div className="grid grid-cols-4 gap-2">
          {[100, 500, 1000, 5000].map((val) => (
            <button
              key={val}
              onClick={() => setAmount(String(val))}
              className="p-2 text-xs rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-center transition-colors"
            >
              <div className="font-medium text-gray-900 dark:text-white">
                {formatCurrency(val, fromCurrency)}
              </div>
              <div className="text-gray-500">
                {formatCurrency(convertCurrencySync(val, fromCurrency, toCurrency, rates), toCurrency)}
              </div>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
