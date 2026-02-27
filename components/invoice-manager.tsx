"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { generateInvoicePDF, getCurrencySymbol } from "@/lib/invoice-generator"
import {
  FileText,
  Plus,
  Trash2,
  Send,
  CheckCircle,
  Download,
  Eye,
  X,
  DollarSign,
  Clock,
  AlertTriangle,
} from "lucide-react"

interface InvoiceItem {
  description: string
  quantity: number
  unitPrice: number
  total: number
}

interface Invoice {
  id: string
  clientId: string | null
  clientName: string
  clientEmail: string | null
  invoiceNumber: string
  items: InvoiceItem[]
  subtotal: number
  tax: number
  total: number
  currency: string
  dueDate: string | null
  notes: string
  status: string
  paidDate: string | null
  sentDate: string | null
  createdAt: string
}

interface InvoiceManagerProps {
  userId: string
  companyName?: string
}

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
  sent: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  paid: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  overdue: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  cancelled: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
}

export default function InvoiceManager({ userId, companyName }: InvoiceManagerProps) {
  const { toast } = useToast()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [filterStatus, setFilterStatus] = useState("all")

  // Form state
  const [clientName, setClientName] = useState("")
  const [clientEmail, setClientEmail] = useState("")
  const [currency, setCurrency] = useState("USD")
  const [dueDate, setDueDate] = useState("")
  const [notes, setNotes] = useState("")
  const [taxRate, setTaxRate] = useState("0")
  const [items, setItems] = useState<InvoiceItem[]>([
    { description: "", quantity: 1, unitPrice: 0, total: 0 },
  ])

  const loadInvoices = useCallback(async () => {
    try {
      const url = filterStatus === "all"
        ? `/api/invoices?userId=${userId}`
        : `/api/invoices?userId=${userId}&status=${filterStatus}`
      const res = await fetch(url)
      const data = await res.json()
      setInvoices(data.invoices || [])
    } catch (err) {
      console.error("Failed to load invoices:", err)
    } finally {
      setLoading(false)
    }
  }, [userId, filterStatus])

  useEffect(() => {
    if (userId) loadInvoices()
  }, [userId, loadInvoices])

  const updateItem = (index: number, field: string, value: string | number) => {
    const updated = [...items]
    ;(updated[index] as any)[field] = value
    if (field === "quantity" || field === "unitPrice") {
      updated[index].total = (Number(updated[index].quantity) || 0) * (Number(updated[index].unitPrice) || 0)
    }
    setItems(updated)
  }

  const addItem = () => {
    setItems([...items, { description: "", quantity: 1, unitPrice: 0, total: 0 }])
  }

  const removeItem = (index: number) => {
    if (items.length <= 1) return
    setItems(items.filter((_, i) => i !== index))
  }

  const subtotal = items.reduce((sum, item) => sum + item.total, 0)
  const tax = subtotal * (Number(taxRate) / 100)
  const total = subtotal + tax

  const createInvoice = async () => {
    if (!clientName || items.some((i) => !i.description || !i.unitPrice)) {
      toast({ title: "Error", description: "Fill in client name and all item details.", variant: "destructive" })
      return
    }

    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          clientName,
          clientEmail,
          items,
          subtotal,
          tax,
          total,
          currency,
          dueDate: dueDate ? new Date(dueDate).toISOString() : null,
          notes,
          status: "draft",
        }),
      })
      if (!res.ok) throw new Error("Failed")
      toast({ title: "Success", description: "Invoice created!" })
      resetForm()
      loadInvoices()
    } catch {
      toast({ title: "Error", description: "Failed to create invoice.", variant: "destructive" })
    }
  }

  const resetForm = () => {
    setClientName("")
    setClientEmail("")
    setDueDate("")
    setNotes("")
    setTaxRate("0")
    setItems([{ description: "", quantity: 1, unitPrice: 0, total: 0 }])
    setShowForm(false)
  }

  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch("/api/invoices", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, userId, status }),
      })
      if (!res.ok) throw new Error("Failed")
      toast({ title: "Success", description: `Invoice marked as ${status}.` })
      loadInvoices()
    } catch {
      toast({ title: "Error", description: "Failed to update invoice.", variant: "destructive" })
    }
  }

  const sendInvoice = async (invoice: Invoice) => {
    if (!invoice.clientEmail) {
      toast({ title: "Error", description: "Client email is required to send invoice.", variant: "destructive" })
      return
    }

    try {
      // Generate PDF
      const pdf = generateInvoicePDF({
        ...invoice,
        clientEmail: invoice.clientEmail ?? undefined,
        dueDate: invoice.dueDate ?? undefined,
        companyName,
      })
      const pdfBlob = pdf.output("blob")

      // Send email with invoice details
      const res = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: invoice.clientEmail,
          subject: `Invoice ${invoice.invoiceNumber} from ${companyName || "Your Business"}`,
          html: `
            <h2>Invoice ${invoice.invoiceNumber}</h2>
            <p>Dear ${invoice.clientName},</p>
            <p>Please find your invoice details below:</p>
            <table style="border-collapse: collapse; width: 100%;">
              <tr style="background: #f3f4f6;"><th style="padding: 8px; text-align: left;">Description</th><th>Qty</th><th>Price</th><th>Total</th></tr>
              ${invoice.items.map((i) => `<tr><td style="padding: 8px;">${i.description}</td><td style="text-align:center;">${i.quantity}</td><td style="text-align:right;">${getCurrencySymbol(invoice.currency)}${i.unitPrice.toFixed(2)}</td><td style="text-align:right;">${getCurrencySymbol(invoice.currency)}${i.total.toFixed(2)}</td></tr>`).join("")}
            </table>
            <p><strong>Total: ${getCurrencySymbol(invoice.currency)}${invoice.total.toFixed(2)}</strong></p>
            ${invoice.dueDate ? `<p>Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}</p>` : ""}
            ${invoice.notes ? `<p>Notes: ${invoice.notes}</p>` : ""}
          `,
        }),
      })

      if (res.ok) {
        await updateStatus(invoice.id, "sent")
        toast({ title: "Sent!", description: `Invoice emailed to ${invoice.clientEmail}.` })
      } else {
        throw new Error("Email failed")
      }
    } catch {
      // Still mark as sent even if email fails (PDF can be downloaded)
      await updateStatus(invoice.id, "sent")
      toast({
        title: "Partially sent",
        description: "Invoice marked as sent. Email delivery may have failed — you can download the PDF.",
      })
    }
  }

  const downloadPDF = (invoice: Invoice) => {
    const pdf = generateInvoicePDF({ ...invoice, clientEmail: invoice.clientEmail ?? undefined, dueDate: invoice.dueDate ?? undefined, companyName })
    pdf.save(`${invoice.invoiceNumber}.pdf`)
  }

  const deleteInvoice = async (id: string) => {
    try {
      const res = await fetch("/api/invoices", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, userId }),
      })
      if (!res.ok) throw new Error("Failed")
      toast({ title: "Deleted", description: "Invoice removed." })
      loadInvoices()
    } catch {
      toast({ title: "Error", description: "Failed to delete invoice.", variant: "destructive" })
    }
  }

  // Summary stats
  const totalOutstanding = invoices
    .filter((i) => i.status === "sent" || i.status === "overdue")
    .reduce((sum, i) => sum + i.total, 0)
  const totalPaid = invoices
    .filter((i) => i.status === "paid")
    .reduce((sum, i) => sum + i.total, 0)
  const overdueCount = invoices.filter((i) => i.status === "overdue").length

  return (
    <Card className="glow-card backdrop-blur shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
              <FileText className="h-5 w-5 text-blue-500" />
              Invoice Manager
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-300">
              Create, send, and track invoices
            </CardDescription>
          </div>
          <Button size="sm" onClick={() => setShowForm(!showForm)}
            className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white">
            <Plus className="h-4 w-4 mr-1" />
            New Invoice
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30">
            <div className="text-xs text-blue-600 dark:text-blue-400">Outstanding</div>
            <div className="text-xl font-bold text-blue-700 dark:text-blue-300">
              ${totalOutstanding.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/30">
            <div className="text-xs text-green-600 dark:text-green-400">Paid</div>
            <div className="text-xl font-bold text-green-700 dark:text-green-300">
              ${totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/30">
            <div className="text-xs text-red-600 dark:text-red-400">Overdue</div>
            <div className="text-xl font-bold text-red-700 dark:text-red-300">{overdueCount}</div>
          </div>
        </div>

        {/* Create Form */}
        {showForm && (
          <Card className="border-2 border-dashed border-blue-300 dark:border-blue-600 bg-blue-50/50 dark:bg-blue-950/20">
            <CardContent className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Client Name *</Label>
                  <Input placeholder="Client name" value={clientName} onChange={(e) => setClientName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Client Email</Label>
                  <Input placeholder="client@email.com" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["USD", "EUR", "GBP", "CAD", "AUD", "INR", "JPY", "CNY"].map((c) => (
                        <SelectItem key={c} value={c}>{c} ({getCurrencySymbol(c)})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Items */}
              <div className="space-y-2">
                <Label className="font-medium">Line Items</Label>
                {items.map((item, idx) => (
                  <div key={idx} className="flex gap-2 items-end">
                    <div className="flex-[3]">
                      <Input
                        placeholder="Description"
                        value={item.description}
                        onChange={(e) => updateItem(idx, "description", e.target.value)}
                      />
                    </div>
                    <div className="flex-1">
                      <Input
                        type="number"
                        placeholder="Qty"
                        value={item.quantity || ""}
                        onChange={(e) => updateItem(idx, "quantity", Number(e.target.value))}
                      />
                    </div>
                    <div className="flex-1">
                      <Input
                        type="number"
                        placeholder="Price"
                        value={item.unitPrice || ""}
                        onChange={(e) => updateItem(idx, "unitPrice", Number(e.target.value))}
                      />
                    </div>
                    <div className="flex-1 text-right font-medium text-sm pt-2">
                      {getCurrencySymbol(currency)}{item.total.toFixed(2)}
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => removeItem(idx)} disabled={items.length <= 1}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={addItem}>
                  <Plus className="h-3 w-3 mr-1" /> Add Item
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Due Date</Label>
                  <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Tax Rate (%)</Label>
                  <Input type="number" placeholder="0" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} />
                </div>
                <div className="pt-6 text-right space-y-1">
                  <div className="text-sm text-gray-500">Subtotal: {getCurrencySymbol(currency)}{subtotal.toFixed(2)}</div>
                  <div className="text-sm text-gray-500">Tax: {getCurrencySymbol(currency)}{tax.toFixed(2)}</div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white">
                    Total: {getCurrencySymbol(currency)}{total.toFixed(2)}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea placeholder="Payment terms, thank you note, etc." value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={resetForm}>Cancel</Button>
                <Button onClick={createInvoice} className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white">
                  Create Invoice
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filter */}
        <div className="flex gap-2">
          {["all", "draft", "sent", "paid", "overdue"].map((s) => (
            <Button
              key={s}
              variant={filterStatus === s ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterStatus(s)}
              className={filterStatus === s ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white" : ""}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
              {s !== "all" && (
                <span className="ml-1 text-xs">({invoices.filter((i) => s === "all" || i.status === s).length})</span>
              )}
            </Button>
          ))}
        </div>

        {/* Invoice List */}
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading...</div>
        ) : invoices.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No invoices yet. Create your first invoice above.
          </div>
        ) : (
          <div className="space-y-2">
            {invoices
              .filter((i) => filterStatus === "all" || i.status === filterStatus)
              .map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <FileText className="h-5 w-5 text-gray-400" />
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {inv.invoiceNumber}
                        <span className="ml-2 text-sm text-gray-500">— {inv.clientName}</span>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                        <span>{new Date(inv.createdAt).toLocaleDateString()}</span>
                        {inv.dueDate && (
                          <>
                            <span>•</span>
                            <span>Due: {new Date(inv.dueDate).toLocaleDateString()}</span>
                          </>
                        )}
                        <span>•</span>
                        <span>{inv.items.length} item{inv.items.length !== 1 ? "s" : ""}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {getCurrencySymbol(inv.currency)}{inv.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                    <Badge className={STATUS_COLORS[inv.status] || STATUS_COLORS.draft}>
                      {inv.status}
                    </Badge>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => downloadPDF(inv)} title="Download PDF">
                        <Download className="h-4 w-4" />
                      </Button>
                      {inv.status === "draft" && (
                        <Button variant="ghost" size="sm" onClick={() => sendInvoice(inv)} title="Send">
                          <Send className="h-4 w-4 text-blue-500" />
                        </Button>
                      )}
                      {(inv.status === "sent" || inv.status === "overdue") && (
                        <Button variant="ghost" size="sm" onClick={() => updateStatus(inv.id, "paid")} title="Mark Paid">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        </Button>
                      )}
                      {inv.status === "draft" && (
                        <Button variant="ghost" size="sm" onClick={() => deleteInvoice(inv.id)} title="Delete">
                          <Trash2 className="h-4 w-4 text-red-400" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
