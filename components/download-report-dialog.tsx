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

      // Chart placeholder (since we can't easily embed the actual chart)
      if (includeChart) {
        if (yPosition > pageHeight - 100) {
          pdf.addPage()
          yPosition = 20
        }

        pdf.setFontSize(14)
        pdf.setFont("helvetica", "bold")
        pdf.text("Financial Chart", 20, yPosition)
        yPosition += 10

        // Create a simple bar representation
        pdf.setDrawColor(0, 191, 255)
        pdf.setFillColor(0, 191, 255)
        pdf.rect(20, yPosition, 50, 20, "FD")
        pdf.setTextColor(255, 255, 255)
        pdf.setFontSize(10)
        pdf.text("Income", 25, yPosition + 12)

        pdf.setDrawColor(239, 68, 68)
        pdf.setFillColor(239, 68, 68)
        pdf.rect(80, yPosition, 50, 20, "FD")
        pdf.setTextColor(255, 255, 255)
        pdf.text("Spending", 85, yPosition + 12)

        pdf.setDrawColor(16, 185, 129)
        pdf.setFillColor(16, 185, 129)
        pdf.rect(140, yPosition, 50, 20, "FD")
        pdf.setTextColor(255, 255, 255)
        pdf.text("Profit", 145, yPosition + 12)

        pdf.setTextColor(0, 0, 0)
        pdf.setFontSize(8)
        pdf.text("Note: For detailed interactive charts, please refer to the dashboard.", 20, yPosition + 35)
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
        <Button className="gradient-bg text-white" size="lg">
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
                  <Checkbox id="include-chart" checked={includeChart} onCheckedChange={(checked) => setIncludeChart(checked === true)} />
                  <Label htmlFor="include-chart">Financial Chart</Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Generate Button */}
          <div className="flex space-x-2">
            <Button onClick={generatePDF} disabled={isGenerating} className="flex-1 gradient-bg text-white">
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
