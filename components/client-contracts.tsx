"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import {
  FileText, Plus, Trash2, DollarSign, Calendar, ChevronDown, ChevronUp, Edit2, Save, X,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface Contract {
  _id: string
  userId: string
  clientId: string
  title: string
  type: string
  value: number
  startDate: string
  endDate: string | null
  status: string
  description: string
  notes: string
  createdAt: string
}

interface ClientContractsProps {
  userId: string
  clientId: string
  clientName: string
}

const contractTypes = [
  { value: "retainer", label: "Retainer" },
  { value: "project", label: "Project" },
  { value: "subscription", label: "Subscription" },
  { value: "one-time", label: "One-Time" },
  { value: "nda", label: "NDA" },
  { value: "sla", label: "SLA" },
  { value: "other", label: "Other" },
]

const statusStyles: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  active: "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400",
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
  completed: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400",
  expired: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400",
  cancelled: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
}

export default function ClientContracts({ userId, clientId, clientName }: ClientContractsProps) {
  const [contracts, setContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [showAll, setShowAll] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const { toast } = useToast()

  // Form state
  const [fTitle, setFTitle] = useState("")
  const [fType, setFType] = useState("project")
  const [fValue, setFValue] = useState("")
  const [fStartDate, setFStartDate] = useState(new Date().toISOString().split("T")[0])
  const [fEndDate, setFEndDate] = useState("")
  const [fStatus, setFStatus] = useState("draft")
  const [fDesc, setFDesc] = useState("")
  const [fNotes, setFNotes] = useState("")

  const fetchContracts = useCallback(async () => {
    if (!userId || !clientId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/client-contracts?userId=${userId}&clientId=${clientId}`)
      const data = await res.json()
      if (res.ok) setContracts(data.contracts || [])
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [userId, clientId])

  useEffect(() => {
    fetchContracts()
  }, [fetchContracts])

  const resetForm = () => {
    setFTitle(""); setFType("project"); setFValue(""); setFStartDate(new Date().toISOString().split("T")[0])
    setFEndDate(""); setFStatus("draft"); setFDesc(""); setFNotes("")
    setEditId(null)
  }

  const startEdit = (c: Contract) => {
    setEditId(c._id)
    setFTitle(c.title); setFType(c.type); setFValue(c.value.toString()); setFStartDate(c.startDate)
    setFEndDate(c.endDate || ""); setFStatus(c.status); setFDesc(c.description); setFNotes(c.notes)
    setShowForm(true)
  }

  const saveContract = async () => {
    if (!fTitle.trim()) {
      toast({ title: "Error", description: "Contract title is required", variant: "destructive" })
      return
    }
    try {
      if (editId) {
        // Update
        const res = await fetch("/api/client-contracts", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editId, userId,
            title: fTitle, type: fType, value: parseFloat(fValue) || 0,
            startDate: fStartDate, endDate: fEndDate || null, status: fStatus,
            description: fDesc, notes: fNotes,
          }),
        })
        if (res.ok) {
          toast({ title: "Updated", description: "Contract updated" })
        } else {
          const err = await res.json()
          toast({ title: "Error", description: err.error, variant: "destructive" })
          return
        }
      } else {
        // Create
        const res = await fetch("/api/client-contracts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId, clientId,
            title: fTitle, type: fType, value: parseFloat(fValue) || 0,
            startDate: fStartDate, endDate: fEndDate || null, status: fStatus,
            description: fDesc, notes: fNotes,
          }),
        })
        if (res.ok) {
          toast({ title: "Created", description: "Contract added" })
        } else {
          const err = await res.json()
          toast({ title: "Error", description: err.error, variant: "destructive" })
          return
        }
      }
      resetForm()
      setShowForm(false)
      fetchContracts()
    } catch {
      toast({ title: "Error", description: "Failed to save contract", variant: "destructive" })
    }
  }

  const deleteContract = async (id: string) => {
    try {
      const res = await fetch(`/api/client-contracts?id=${id}&userId=${userId}`, { method: "DELETE" })
      if (res.ok) {
        toast({ title: "Deleted", description: "Contract removed" })
        setContracts((prev) => prev.filter((c) => c._id !== id))
      }
    } catch {
      toast({ title: "Error", description: "Failed to delete", variant: "destructive" })
    }
  }

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      await fetch("/api/client-contracts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, userId, status: newStatus }),
      })
      fetchContracts()
    } catch { /* ignore */ }
  }

  const totalValue = contracts.filter((c) => c.status === "active").reduce((s, c) => s + c.value, 0)
  const displayContracts = showAll ? contracts : contracts.slice(0, 4)

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <FileText className="h-4 w-4 text-pink-500" />
            Contracts
            <Badge variant="secondary" className="ml-1 text-xs">{contracts.length}</Badge>
            {totalValue > 0 && (
              <span className="text-xs font-normal text-green-600 ml-2">
                Active value: ${totalValue.toLocaleString()}
              </span>
            )}
          </CardTitle>
          <Button
            size="sm"
            variant="outline"
            onClick={() => { resetForm(); setShowForm(!showForm) }}
            className="h-7 text-xs"
          >
            <Plus className="h-3 w-3 mr-1" />
            Add
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="p-3 rounded-lg border border-pink-200 dark:border-pink-800 bg-pink-50/50 dark:bg-pink-950/20 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Title *</Label>
                    <Input value={fTitle} onChange={(e) => setFTitle(e.target.value)} placeholder="Contract name" className="h-8 text-xs" />
                  </div>
                  <div>
                    <Label className="text-xs">Type</Label>
                    <Select value={fType} onValueChange={setFType}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {contractTypes.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label className="text-xs">Value ($)</Label>
                    <Input type="number" value={fValue} onChange={(e) => setFValue(e.target.value)} placeholder="0" className="h-8 text-xs" />
                  </div>
                  <div>
                    <Label className="text-xs">Start Date</Label>
                    <Input type="date" value={fStartDate} onChange={(e) => setFStartDate(e.target.value)} className="h-8 text-xs" />
                  </div>
                  <div>
                    <Label className="text-xs">End Date</Label>
                    <Input type="date" value={fEndDate} onChange={(e) => setFEndDate(e.target.value)} className="h-8 text-xs" />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Status</Label>
                  <Select value={fStatus} onValueChange={setFStatus}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.keys(statusStyles).map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Description</Label>
                  <Textarea value={fDesc} onChange={(e) => setFDesc(e.target.value)} rows={2} placeholder="Contract scope, terms..." className="text-xs" />
                </div>
                <div>
                  <Label className="text-xs">Internal Notes</Label>
                  <Input value={fNotes} onChange={(e) => setFNotes(e.target.value)} placeholder="Private notes..." className="h-8 text-xs" />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={saveContract} className="h-7 text-xs bg-pink-600 hover:bg-pink-700 text-white">
                    <Save className="h-3 w-3 mr-1" /> {editId ? "Update" : "Create"}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => { resetForm(); setShowForm(false) }} className="h-7 text-xs">
                    <X className="h-3 w-3 mr-1" /> Cancel
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Contract list */}
        {loading ? (
          <div className="text-center py-4 text-xs text-muted-foreground">Loading...</div>
        ) : contracts.length === 0 ? (
          <div className="text-center py-6 text-xs text-muted-foreground">
            No contracts yet. Add agreements, NDAs, or service contracts.
          </div>
        ) : (
          <div className="space-y-2">
            {displayContracts.map((c, i) => (
              <motion.div
                key={c._id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-pink-300 dark:hover:border-pink-700 transition-colors group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{c.title}</span>
                      <Badge variant="outline" className="text-[10px] h-4 px-1.5 capitalize">{c.type}</Badge>
                      <Badge className={`text-[10px] h-4 px-1.5 capitalize border-0 ${statusStyles[c.status] || statusStyles.draft}`}>
                        {c.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      {c.value > 0 && (
                        <span className="flex items-center gap-0.5 text-green-600 font-medium">
                          <DollarSign className="h-3 w-3" />{c.value.toLocaleString()}
                        </span>
                      )}
                      <span className="flex items-center gap-0.5">
                        <Calendar className="h-3 w-3" />
                        {c.startDate}{c.endDate ? ` → ${c.endDate}` : ""}
                      </span>
                    </div>
                    {c.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{c.description}</p>}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {c.status === "draft" && (
                      <Button size="sm" variant="ghost" className="h-6 text-[10px] px-2" onClick={() => updateStatus(c._id, "active")}>
                        Activate
                      </Button>
                    )}
                    {c.status === "active" && (
                      <Button size="sm" variant="ghost" className="h-6 text-[10px] px-2" onClick={() => updateStatus(c._id, "completed")}>
                        Complete
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100" onClick={() => startEdit(c)}>
                      <Edit2 className="h-3 w-3 text-blue-500" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100" onClick={() => deleteContract(c._id)}>
                      <Trash2 className="h-3 w-3 text-red-500" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {contracts.length > 4 && (
          <Button variant="ghost" size="sm" onClick={() => setShowAll(!showAll)} className="w-full text-xs h-7">
            {showAll ? <><ChevronUp className="h-3 w-3 mr-1" /> Show Less</> : <><ChevronDown className="h-3 w-3 mr-1" /> Show All ({contracts.length})</>}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
