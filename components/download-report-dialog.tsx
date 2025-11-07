"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Download, FileText, Calendar } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { motion } from "framer-motion"
// We intentionally avoid capturing the on-screen dashboard chart.
// Instead, we render a fresh chart image based on the selected dates and filtered data.

interface DownloadReportDialogProps {
  companyName: string
  incomeEntries: any[]
  spendingEntries: any[]
  totalIncome: number
  totalSpending: number
  totalProfit: number
}

export function DownloadReportDialog({
  companyName,
  incomeEntries,
  spendingEntries,
  totalIncome,
  totalSpending,
  totalProfit,
}: DownloadReportDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [reportType, setReportType] = useState("both")
  const [includeIncome, setIncludeIncome] = useState(true)
  const [includeSpending, setIncludeSpending] = useState(true)
  const [includeChart, setIncludeChart] = useState(true)
  const [includeInsights, setIncludeInsights] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const { toast } = useToast()

  const generatePDF = async () => {
    if (!fromDate || !toDate) {
      toast({
        title: "Error",
        description: "Please select both from and to dates.",
        variant: "destructive",
      })
      return
    }

    if (new Date(fromDate) > new Date(toDate)) {
      toast({
        title: "Error",
        description: "From date cannot be later than to date.",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)

    try {
      const pdf = new jsPDF()
      const pageWidth = pdf.internal.pageSize.width
      const pageHeight = pdf.internal.pageSize.height

      // Filter data by date range
      const filteredIncome = incomeEntries.filter((entry) => {
        const entryDate = new Date(entry.date)
        return entryDate >= new Date(fromDate) && entryDate <= new Date(toDate)
      })

      const filteredSpending = spendingEntries.filter((entry) => {
        const entryDate = new Date(entry.date)
        return entryDate >= new Date(fromDate) && entryDate <= new Date(toDate)
      })

      const filteredTotalIncome = filteredIncome.reduce((sum, entry) => sum + entry.amount, 0)
      const filteredTotalSpending = filteredSpending.reduce((sum, entry) => sum + entry.amount, 0)
      const filteredTotalProfit = filteredTotalIncome - filteredTotalSpending

      // Header
      pdf.setFillColor(0, 191, 255)
      pdf.rect(0, 0, pageWidth, 40, "F")

      pdf.setTextColor(255, 255, 255)
      pdf.setFontSize(24)
      pdf.setFont("helvetica", "bold")
      pdf.text("Business Analytics Report", 20, 25)

      // Company Info
      pdf.setTextColor(0, 0, 0)
      pdf.setFontSize(16)
      pdf.setFont("helvetica", "bold")
      pdf.text(`Company: ${companyName}`, 20, 60)

      pdf.setFontSize(12)
      pdf.setFont("helvetica", "normal")
      pdf.text(
        `Report Period: ${new Date(fromDate).toLocaleDateString()} - ${new Date(toDate).toLocaleDateString()}`,
        20,
        75,
      )
      pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 85)

      let yPosition = 110

      // Summary Section
      pdf.setFontSize(16)
      pdf.setFont("helvetica", "bold")
      pdf.text("Financial Summary", 20, yPosition)
      yPosition += 15

      const summaryData = [
        ["Total Income", `$${filteredTotalIncome.toLocaleString()}`],
        ["Total Spending", `$${filteredTotalSpending.toLocaleString()}`],
        ["Net Profit", `$${filteredTotalProfit.toLocaleString()}`],
        [
          "Profit Margin",
          `${filteredTotalIncome > 0 ? ((filteredTotalProfit / filteredTotalIncome) * 100).toFixed(1) : 0}%`,
        ],
      ]

      autoTable(pdf, {
        startY: yPosition,
        head: [["Metric", "Value"]],
        body: summaryData,
        theme: "grid",
        headStyles: { fillColor: [0, 191, 255], textColor: [255, 255, 255] },
        styles: { fontSize: 11 },
        margin: { left: 20, right: 20 },
      })

      yPosition = (pdf as any).lastAutoTable.finalY + 20

      // Insights Section
      if (includeInsights) {
        if (yPosition > pageHeight - 80) {
          pdf.addPage()
          yPosition = 20
        }

        pdf.setFontSize(16)
        pdf.setFont("helvetica", "bold")
        pdf.text("Insights", 20, yPosition)
        yPosition += 10

        const insights = buildInsights({
          fromDate,
          toDate,
          income: filteredIncome,
          spending: filteredSpending,
          totalIncome: filteredTotalIncome,
          totalSpending: filteredTotalSpending,
        })

        pdf.setFontSize(11)
        pdf.setFont("helvetica", "normal")
        const maxWidth = pageWidth - 40
        insights.forEach((line) => {
          const textLines = pdf.splitTextToSize(`• ${line}`, maxWidth)
          if (yPosition + textLines.length * 6 > pageHeight - 30) {
            pdf.addPage()
            yPosition = 20
          }
          pdf.text(textLines, 20, yPosition)
          yPosition += textLines.length * 6 + 4
        })

        yPosition += 6
      }

      // Income Table
      if (includeIncome && filteredIncome.length > 0) {
        if (yPosition > pageHeight - 60) {
          pdf.addPage()
          yPosition = 20
        }

        pdf.setFontSize(14)
        pdf.setFont("helvetica", "bold")
        pdf.text("Income Details", 20, yPosition)
        yPosition += 10

        const incomeData = filteredIncome.map((entry) => [
          entry.source,
          `$${entry.amount.toLocaleString()}`,
          new Date(entry.date).toLocaleDateString(),
        ])

        autoTable(pdf, {
          startY: yPosition,
          head: [["Source", "Amount", "Date"]],
          body: incomeData,
          theme: "grid",
          headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255] },
          styles: { fontSize: 10 },
          margin: { left: 20, right: 20 },
        })

        yPosition = (pdf as any).lastAutoTable.finalY + 20
      }

      // Spending Table
      if (includeSpending && filteredSpending.length > 0) {
        if (yPosition > pageHeight - 60) {
          pdf.addPage()
          yPosition = 20
        }

        pdf.setFontSize(14)
        pdf.setFont("helvetica", "bold")
        pdf.text("Spending Details", 20, yPosition)
        yPosition += 10

        const spendingData = filteredSpending.map((entry) => [
          entry.reason,
          `$${entry.amount.toLocaleString()}`,
          new Date(entry.date).toLocaleDateString(),
        ])

        autoTable(pdf, {
          startY: yPosition,
          head: [["Reason", "Amount", "Date"]],
          body: spendingData,
          theme: "grid",
          headStyles: { fillColor: [239, 68, 68], textColor: [255, 255, 255] },
          styles: { fontSize: 10 },
          margin: { left: 20, right: 20 },
        })

        yPosition = (pdf as any).lastAutoTable.finalY + 20
      }

      // Create a fresh chart based on filtered data (do NOT reuse on-screen dashboard chart)
      if (includeChart) {
        if (yPosition > pageHeight - 100) {
          pdf.addPage()
          yPosition = 20
        }

        pdf.setFontSize(14)
        pdf.setFont("helvetica", "bold")
        pdf.text("Financial Chart", 20, yPosition)
        yPosition += 8

        const imgData = await renderChartImage({
          fromDate,
          toDate,
          income: filteredIncome,
          spending: filteredSpending,
          reportType,
        })

        if (imgData) {
          const maxWidth = pageWidth - 40 // margins
          const imgWidth = maxWidth
          const imgHeight = (imgWidth * 9) / 21 // keep ~21:9 aspect

          if (yPosition + imgHeight > pageHeight - 30) {
            pdf.addPage()
            yPosition = 20
          }
          pdf.addImage(imgData, "PNG", 20, yPosition, imgWidth, imgHeight, undefined, "FAST")
          yPosition += imgHeight + 10

          pdf.setFontSize(8)
          pdf.setTextColor(120)
          pdf.text("Chart generated from the selected date range.", 20, yPosition)
          yPosition += 6
          pdf.setTextColor(0)
        } else {
          pdf.setFontSize(10)
          pdf.text("No chart data available for the selected date range.", 20, yPosition + 12)
          yPosition += 24
        }
      }

      // Footer
      const totalPages = pdf.getNumberOfPages()
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i)
        pdf.setFontSize(8)
        pdf.setTextColor(128, 128, 128)
        pdf.text(`Page ${i} of ${totalPages}`, pageWidth - 30, pageHeight - 10)
        pdf.text(`Generated by Business Analytics Platform`, 20, pageHeight - 10)
      }

      // Save the PDF
      const fileName = `${companyName.replace(/\s+/g, "_")}_Report_${fromDate}_to_${toDate}.pdf`
      pdf.save(fileName)

      toast({
        title: "Success",
        description: "Report downloaded successfully!",
      })

      setIsOpen(false)
    } catch (error) {
      console.error("Error generating PDF:", error)
      toast({
        title: "Error",
        description: "Failed to generate report. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold drop-shadow-lg" size="lg">
          <Download className="h-4 w-4 mr-2" />
          Download Report
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Generate Report
          </DialogTitle>
          <DialogDescription>
            Select the date range and data to include in your business analytics report.
          </DialogDescription>
        </DialogHeader>

        <motion.div
          className="space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Date Range */}
          <Card className="light-card">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="h-4 w-4 text-blue-600" />
                <Label className="font-semibold">Date Range</Label>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fromDate">From Date</Label>
                  <Input id="fromDate" type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="toDate">To Date</Label>
                  <Input id="toDate" type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Report Type */}
          <Card className="light-card">
            <CardContent className="p-4 space-y-4">
              <Label className="font-semibold">Report Type</Label>
              <RadioGroup value={reportType} onValueChange={setReportType}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="income" id="income-only" />
                  <Label htmlFor="income-only">Income Only</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="spending" id="spending-only" />
                  <Label htmlFor="spending-only">Spending Only</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="both" id="both" />
                  <Label htmlFor="both">Income & Spending</Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Include Options */}
          <Card className="light-card">
            <CardContent className="p-4 space-y-4">
              <Label className="font-semibold">Include in Report</Label>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="include-income"
                    checked={includeIncome}
                    onCheckedChange={(checked) => setIncludeIncome(checked === true)}
                    disabled={reportType === "spending"}
                  />
                  <Label htmlFor="include-income">Detailed Income Table</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="include-spending"
                    checked={includeSpending}
                    onCheckedChange={(checked) => setIncludeSpending(checked === true)}
                    disabled={reportType === "income"}
                  />
                  <Label htmlFor="include-spending">Detailed Spending Table</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="include-insights" checked={includeInsights} onCheckedChange={(checked) => setIncludeInsights(checked === true)} />
                  <Label htmlFor="include-insights">Insights</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="include-chart" checked={includeChart} onCheckedChange={(checked) => setIncludeChart(checked === true)} />
                  <Label htmlFor="include-chart">Financial Chart</Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Generate Button */}
          <div className="flex space-x-2">
            <Button onClick={generatePDF} disabled={isGenerating} className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold drop-shadow-lg">
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Generating...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Generate PDF
                </>
              )}
            </Button>
            <Button variant="outline" onClick={() => setIsOpen(false)} className="flex-1">
              Cancel
            </Button>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  )
}

// --- Helpers ---
type SeriesEntry = { date: string; amount: number;[k: string]: any }

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

function eachDay(startISO: string, endISO: string) {
  const dates: Date[] = []
  const start = new Date(startISO)
  const end = new Date(endISO)
  // normalize to local midnight
  start.setHours(0, 0, 0, 0)
  end.setHours(0, 0, 0, 0)
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    dates.push(new Date(d))
  }
  return dates
}

async function renderChartImage({
  fromDate,
  toDate,
  income,
  spending,
  reportType,
}: {
  fromDate: string
  toDate: string
  income: SeriesEntry[]
  spending: SeriesEntry[]
  reportType: string
}): Promise<string | null> {
  try {
    const days = eachDay(fromDate, toDate)
    if (!days.length) return null

    // Aggregate by day
    const fmt = (d: Date) => d.toISOString().slice(0, 10)
    const incomeMap = new Map<string, number>()
    const spendingMap = new Map<string, number>()
    for (const d of days) {
      incomeMap.set(fmt(d), 0)
      spendingMap.set(fmt(d), 0)
    }
    for (const e of income || []) {
      const key = fmt(new Date(e.date))
      if (incomeMap.has(key)) incomeMap.set(key, (incomeMap.get(key) || 0) + (Number(e.amount) || 0))
    }
    for (const e of spending || []) {
      const key = fmt(new Date(e.date))
      if (spendingMap.has(key)) spendingMap.set(key, (spendingMap.get(key) || 0) + (Number(e.amount) || 0))
    }

    const incomeVals = days.map((d) => incomeMap.get(fmt(d)) || 0)
    const spendingVals = days.map((d) => spendingMap.get(fmt(d)) || 0)

    const maxVal = Math.max(
      1,
      reportType === "spending" ? Math.max(...spendingVals) : 0,
      reportType === "income" ? Math.max(...incomeVals) : 0,
      reportType === "both" ? Math.max(...incomeVals, ...spendingVals) : 0,
    )

    const width = 1200
    const height = 500
    const dpr = typeof window !== "undefined" ? Math.min(window.devicePixelRatio || 1, 2) : 1
    const canvas = document.createElement("canvas")
    canvas.width = Math.floor(width * dpr)
    canvas.height = Math.floor(height * dpr)
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`
    const ctx = canvas.getContext("2d")!
    ctx.scale(dpr, dpr)

    // Background
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, width, height)

    // Padding and axes
    const padLeft = 70
    const padRight = 20
    const padTop = 20
    const padBottom = 60
    const chartW = width - padLeft - padRight
    const chartH = height - padTop - padBottom

    // Axes
    ctx.strokeStyle = "#333"
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(padLeft, padTop)
    ctx.lineTo(padLeft, padTop + chartH)
    ctx.lineTo(padLeft + chartW, padTop + chartH)
    ctx.stroke()

    // Grid + Y labels (5 ticks)
    ctx.fillStyle = "#555"
    ctx.font = "12px sans-serif"
    const ticks = 5
    for (let i = 0; i <= ticks; i++) {
      const t = i / ticks
      const y = padTop + chartH - t * chartH
      ctx.strokeStyle = "#eee"
      ctx.beginPath()
      ctx.moveTo(padLeft, y)
      ctx.lineTo(padLeft + chartW, y)
      ctx.stroke()
      const val = (t * maxVal) | 0
      ctx.fillStyle = "#666"
      ctx.textAlign = "right"
      ctx.fillText(`$${val.toLocaleString()}`, padLeft - 10, y + 4)
    }

    // X labels (up to 8 evenly spaced)
    const xCount = days.length
    const xStep = chartW / Math.max(1, xCount - 1)
    const labelEvery = Math.ceil(xCount / 8)
    for (let i = 0; i < xCount; i++) {
      const x = padLeft + i * xStep
      if (i % labelEvery === 0 || i === xCount - 1 || i === 0) {
        const d = days[i]
        const label = d.toLocaleDateString()
        ctx.fillStyle = "#666"
        ctx.textAlign = "center"
        ctx.fillText(label, x, padTop + chartH + 20)
      }
    }

    const toY = (v: number) => padTop + chartH - (clamp(v, 0, maxVal) / maxVal) * chartH
    const toX = (i: number) => padLeft + i * xStep

    // Draw series helper
    const drawSeries = (vals: number[], color: string) => {
      ctx.strokeStyle = color
      ctx.lineWidth = 2
      ctx.beginPath()
      for (let i = 0; i < vals.length; i++) {
        const x = toX(i)
        const y = toY(vals[i])
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.stroke()
      // Dots
      ctx.fillStyle = color
      for (let i = 0; i < vals.length; i++) {
        const x = toX(i)
        const y = toY(vals[i])
        ctx.beginPath()
        ctx.arc(x, y, 3, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    // Determine which series to draw
    if (reportType === "income" || reportType === "both") {
      drawSeries(incomeVals, "#10B981") // emerald-500
    }
    if (reportType === "spending" || reportType === "both") {
      drawSeries(spendingVals, "#EF4444") // red-500
    }

    // Legend
    const legendY = height - padBottom + 28
    let lx = padLeft
    const addLegend = (label: string, color: string) => {
      ctx.fillStyle = color
      ctx.fillRect(lx, legendY - 10, 18, 3)
      ctx.fillStyle = "#333"
      ctx.textAlign = "left"
      ctx.fillText(label, lx + 24, legendY - 6)
      lx += ctx.measureText(label).width + 80
    }
    if (reportType === "income" || reportType === "both") addLegend("Income", "#10B981")
    if (reportType === "spending" || reportType === "both") addLegend("Spending", "#EF4444")

    return canvas.toDataURL("image/png")
  } catch (e) {
    console.error("Failed to render chart image", e)
    return null
  }
}

function buildInsights({
  fromDate,
  toDate,
  income,
  spending,
  totalIncome,
  totalSpending,
}: {
  fromDate: string
  toDate: string
  income: SeriesEntry[]
  spending: SeriesEntry[]
  totalIncome: number
  totalSpending: number
}): string[] {
  const lines: string[] = []
  const profit = totalIncome - totalSpending
  const margin = totalIncome > 0 ? (profit / totalIncome) * 100 : 0

  // Time split trends
  const start = new Date(fromDate).getTime()
  const end = new Date(toDate).getTime()
  const mid = start + (end - start) / 2

  const sum = (arr: SeriesEntry[]) => arr.reduce((s, e) => s + (Number(e.amount) || 0), 0)
  const before = {
    income: sum(income.filter((e) => new Date(e.date).getTime() < mid)),
    spending: sum(spending.filter((e) => new Date(e.date).getTime() < mid)),
  }
  const after = {
    income: sum(income.filter((e) => new Date(e.date).getTime() >= mid)),
    spending: sum(spending.filter((e) => new Date(e.date).getTime() >= mid)),
  }

  const pct = (oldVal: number, newVal: number) => {
    if (!oldVal && !newVal) return 0
    if (!oldVal) return 100
    return ((newVal - oldVal) / oldVal) * 100
  }
  const incomeTrend = pct(before.income, after.income)
  const spendingTrend = pct(before.spending, after.spending)

  // Top categories
  const topK = (arr: SeriesEntry[], key: 'source' | 'reason') => {
    const map = new Map<string, number>()
    for (const e of arr) {
      const k = (e as any)[key] || 'Unspecified'
      map.set(k, (map.get(k) || 0) + (Number(e.amount) || 0))
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]).slice(0, 3)
  }
  const topIncome = topK(income, 'source')
  const topSpending = topK(spending, 'reason')

  // Best/worst days
  const byDaySum = (arr: SeriesEntry[]) => {
    const m = new Map<string, number>()
    for (const e of arr) {
      const d = new Date(e.date)
      const key = d.toISOString().slice(0, 10)
      m.set(key, (m.get(key) || 0) + (Number(e.amount) || 0))
    }
    const list = Array.from(m.entries()).sort((a, b) => b[1] - a[1])
    return { best: list[0], worst: list[list.length - 1] }
  }
  const incDays = byDaySum(income)
  const spDays = byDaySum(spending)

  // Core insights
  lines.push(`Profit margin: ${margin.toFixed(1)}% (${profit >= 0 ? 'profitable' : 'loss-making'})`)
  lines.push(`Income trend: ${incomeTrend >= 0 ? 'up' : 'down'} ${Math.abs(incomeTrend).toFixed(1)}% in latter period`)
  lines.push(`Spending trend: ${spendingTrend >= 0 ? 'up' : 'down'} ${Math.abs(spendingTrend).toFixed(1)}% in latter period`)

  if (topIncome.length) {
    lines.push(
      `Top income sources: ` +
      topIncome.map(([k, v]) => `${k}: $${Math.round(v).toLocaleString()}`).join('; ')
    )
  }
  if (topSpending.length) {
    lines.push(
      `Top spending categories: ` +
      topSpending.map(([k, v]) => `${k}: $${Math.round(v).toLocaleString()}`).join('; ')
    )
  }

  if (incDays.best) {
    lines.push(`Highest income day: ${incDays.best[0]} ($${Math.round(incDays.best[1]).toLocaleString()})`)
  }
  if (spDays.best) {
    lines.push(`Highest spending day: ${spDays.best[0]} ($${Math.round(spDays.best[1]).toLocaleString()})`)
  }

  // Recommendations
  const recs: string[] = []
  if (profit < 0) recs.push('Prioritize cash preservation: reduce non-essential expenses and accelerate receivables')
  if (margin < 10 && totalIncome > 0) recs.push('Low margin: review pricing or reduce cost of goods/services')
  const topSpendShare = topSpending.length && totalSpending > 0 ? (topSpending[0][1] / totalSpending) * 100 : 0
  if (topSpendShare > 40) recs.push(`High expense concentration in "${topSpending[0][0]}" (${topSpendShare.toFixed(1)}%): negotiate rates or diversify vendors`)
  if (incomeTrend < 0 && spendingTrend > 0) recs.push('Deteriorating unit economics: boost revenue pipeline while enforcing expense discipline')

  if (recs.length) {
    lines.push('Recommendations: ' + recs.join('; '))
  }

  return lines
}
