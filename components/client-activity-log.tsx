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
  MessageSquare, Phone, Mail, Calendar, ClipboardList, FileText, MoreHorizontal,
  Plus, Trash2, Clock, ChevronDown, ChevronUp, Send,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface Activity {
  _id: string
  userId: string
  clientId: string
  type: "note" | "call" | "email" | "meeting" | "task" | "contract" | "other"
  title: string
  content: string
  metadata: Record<string, any>
  timestamp: string
  createdAt: string
}

interface ClientActivityLogProps {
  userId: string
  clientId: string
  clientName: string
  clientEmail?: string
}

const typeConfig: Record<string, { icon: any; color: string; bgColor: string; label: string }> = {
  note: { icon: MessageSquare, color: "text-blue-600", bgColor: "bg-blue-100 dark:bg-blue-950/40", label: "Note" },
  call: { icon: Phone, color: "text-green-600", bgColor: "bg-green-100 dark:bg-green-950/40", label: "Call" },
  email: { icon: Mail, color: "text-purple-600", bgColor: "bg-purple-100 dark:bg-purple-950/40", label: "Email" },
  meeting: { icon: Calendar, color: "text-amber-600", bgColor: "bg-amber-100 dark:bg-amber-950/40", label: "Meeting" },
  task: { icon: ClipboardList, color: "text-cyan-600", bgColor: "bg-cyan-100 dark:bg-cyan-950/40", label: "Task" },
  contract: { icon: FileText, color: "text-pink-600", bgColor: "bg-pink-100 dark:bg-pink-950/40", label: "Contract" },
  other: { icon: MoreHorizontal, color: "text-gray-600", bgColor: "bg-gray-100 dark:bg-gray-800/40", label: "Other" },
}

export default function ClientActivityLog({ userId, clientId, clientName, clientEmail }: ClientActivityLogProps) {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [showAll, setShowAll] = useState(false)
  const [formType, setFormType] = useState<string>("note")
  const [formTitle, setFormTitle] = useState("")
  const [formContent, setFormContent] = useState("")
  const [callDuration, setCallDuration] = useState("")
  const [meetingDate, setMeetingDate] = useState("")
  const { toast } = useToast()

  const fetchActivities = useCallback(async () => {
    if (!userId || !clientId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/client-activity?userId=${userId}&clientId=${clientId}`)
      const data = await res.json()
      if (res.ok) setActivities(data.activities || [])
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [userId, clientId])

  useEffect(() => {
    fetchActivities()
  }, [fetchActivities])

  const addActivity = async () => {
    if (!formTitle.trim()) {
      toast({ title: "Error", description: "Title is required", variant: "destructive" })
      return
    }
    const metadata: Record<string, any> = {}
    if (formType === "call" && callDuration) metadata.duration = callDuration
    if (formType === "meeting" && meetingDate) metadata.meetingDate = meetingDate
    if (formType === "email" && clientEmail) metadata.to = clientEmail

    try {
      const res = await fetch("/api/client-activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, clientId, type: formType, title: formTitle, content: formContent, metadata }),
      })
      if (res.ok) {
        toast({ title: "Added", description: "Activity logged" })
        setFormTitle("")
        setFormContent("")
        setCallDuration("")
        setMeetingDate("")
        setShowForm(false)
        fetchActivities()
      } else {
        const err = await res.json()
        toast({ title: "Error", description: err.error, variant: "destructive" })
      }
    } catch {
      toast({ title: "Error", description: "Failed to add activity", variant: "destructive" })
    }
  }

  const deleteActivity = async (id: string) => {
    try {
      const res = await fetch(`/api/client-activity?id=${id}&userId=${userId}`, { method: "DELETE" })
      if (res.ok) {
        toast({ title: "Deleted", description: "Activity removed" })
        setActivities((prev) => prev.filter((a) => a._id !== id))
      }
    } catch {
      toast({ title: "Error", description: "Failed to delete", variant: "destructive" })
    }
  }

  const displayActivities = showAll ? activities : activities.slice(0, 5)

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-500" />
            Activity Log
            <Badge variant="secondary" className="ml-1 text-xs">{activities.length}</Badge>
          </CardTitle>
          <Button size="sm" variant="outline" onClick={() => setShowForm(!showForm)} className="h-7 text-xs">
            <Plus className="h-3 w-3 mr-1" />
            Add
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Add form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="p-3 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Type</Label>
                    <Select value={formType} onValueChange={setFormType}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(typeConfig).map(([key, cfg]) => (
                          <SelectItem key={key} value={key}>
                            <span className="flex items-center gap-1.5">
                              <cfg.icon className={`h-3 w-3 ${cfg.color}`} />
                              {cfg.label}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Title *</Label>
                    <Input
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      placeholder="Brief summary..."
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
                {formType === "call" && (
                  <div>
                    <Label className="text-xs">Call Duration</Label>
                    <Input value={callDuration} onChange={(e) => setCallDuration(e.target.value)} placeholder="e.g. 30 min" className="h-8 text-xs" />
                  </div>
                )}
                {formType === "meeting" && (
                  <div>
                    <Label className="text-xs">Meeting Date</Label>
                    <Input type="date" value={meetingDate} onChange={(e) => setMeetingDate(e.target.value)} className="h-8 text-xs" />
                  </div>
                )}
                <div>
                  <Label className="text-xs">Details</Label>
                  <Textarea
                    value={formContent}
                    onChange={(e) => setFormContent(e.target.value)}
                    placeholder="Notes, details, follow-ups..."
                    rows={2}
                    className="text-xs"
                  />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={addActivity} className="h-7 text-xs bg-blue-600 hover:bg-blue-700 text-white">
                    <Send className="h-3 w-3 mr-1" /> Save
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowForm(false)} className="h-7 text-xs">Cancel</Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Timeline */}
        {loading ? (
          <div className="text-center py-4 text-xs text-muted-foreground">Loading...</div>
        ) : activities.length === 0 ? (
          <div className="text-center py-6 text-xs text-muted-foreground">
            No activity logged yet. Add notes, calls, and interactions.
          </div>
        ) : (
          <div className="space-y-1">
            {displayActivities.map((a, i) => {
              const cfg = typeConfig[a.type] || typeConfig.other
              const Icon = cfg.icon
              return (
                <motion.div
                  key={a._id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex gap-3 group"
                >
                  {/* Timeline line + dot */}
                  <div className="flex flex-col items-center pt-1">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center ${cfg.bgColor} shrink-0`}>
                      <Icon className={`h-3.5 w-3.5 ${cfg.color}`} />
                    </div>
                    {i < displayActivities.length - 1 && (
                      <div className="w-px flex-1 bg-gray-200 dark:bg-gray-700 mt-1" />
                    )}
                  </div>
                  {/* Content */}
                  <div className="flex-1 pb-3 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-gray-900 dark:text-white truncate">{a.title}</span>
                          <Badge variant="outline" className={`text-[10px] h-4 px-1.5 ${cfg.color}`}>{cfg.label}</Badge>
                        </div>
                        {a.content && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{a.content}</p>
                        )}
                        {a.metadata?.duration && (
                          <span className="text-[10px] text-muted-foreground">Duration: {a.metadata.duration}</span>
                        )}
                        {a.metadata?.to && (
                          <span className="text-[10px] text-muted-foreground block">To: {a.metadata.to}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                          {new Date(a.timestamp).toLocaleDateString()} {new Date(a.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => deleteActivity(a._id)}
                        >
                          <Trash2 className="h-3 w-3 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}

        {activities.length > 5 && (
          <Button variant="ghost" size="sm" onClick={() => setShowAll(!showAll)} className="w-full text-xs h-7">
            {showAll ? <><ChevronUp className="h-3 w-3 mr-1" /> Show Less</> : <><ChevronDown className="h-3 w-3 mr-1" /> Show All ({activities.length})</>}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
