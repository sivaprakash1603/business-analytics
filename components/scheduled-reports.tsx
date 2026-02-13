"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Mail, Plus, Trash2, Clock, Calendar, CheckCircle } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface Schedule {
  _id: string
  userId: string
  email: string
  frequency: "weekly" | "monthly"
  reportType: string
  enabled: boolean
  lastSentAt: string | null
  nextRunAt: string
  createdAt: string
}

interface ScheduledReportsProps {
  userId: string
  userEmail?: string
}

export function ScheduledReports({ userId, userEmail }: ScheduledReportsProps) {
  const { toast } = useToast()
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)

  // Form state
  const [email, setEmail] = useState(userEmail || "")
  const [frequency, setFrequency] = useState<string>("weekly")
  const [reportType, setReportType] = useState<string>("full")

  const fetchSchedules = async () => {
    try {
      const res = await fetch(`/api/scheduled-reports?userId=${encodeURIComponent(userId)}`)
      const data = await res.json()
      if (res.ok) setSchedules(data.schedules || [])
    } catch {
      console.error("Failed to fetch schedules")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (userId) fetchSchedules()
  }, [userId])

  useEffect(() => {
    if (userEmail) setEmail(userEmail)
  }, [userEmail])

  const createSchedule = async () => {
    if (!email) {
      toast({ title: "Error", description: "Email is required.", variant: "destructive" })
      return
    }

    try {
      const res = await fetch("/api/scheduled-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, email, frequency, reportType }),
      })
      if (res.ok) {
        toast({ title: "Schedule Created", description: `${frequency} report will be sent to ${email}.` })
        setShowAdd(false)
        fetchSchedules()
      }
    } catch {
      toast({ title: "Error", description: "Failed to create schedule.", variant: "destructive" })
    }
  }

  const toggleSchedule = async (id: string, enabled: boolean) => {
    try {
      await fetch("/api/scheduled-reports", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, userId, enabled }),
      })
      fetchSchedules()
    } catch {
      toast({ title: "Error", description: "Failed to update.", variant: "destructive" })
    }
  }

  const deleteSchedule = async (id: string) => {
    try {
      await fetch(`/api/scheduled-reports?id=${id}&userId=${encodeURIComponent(userId)}`, { method: "DELETE" })
      toast({ title: "Deleted", description: "Report schedule removed." })
      fetchSchedules()
    } catch {
      toast({ title: "Error", description: "Failed to delete.", variant: "destructive" })
    }
  }

  return (
    <Card className="glow-card backdrop-blur shadow-lg border-white/20 dark:border-gray-700/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
              <Mail className="h-5 w-5 text-purple-500" />
              Scheduled Report Emails
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-300">
              Auto-generate and email financial reports on a schedule
            </CardDescription>
          </div>
          <Button
            onClick={() => setShowAdd(!showAdd)}
            size="sm"
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
          >
            <Plus className="h-4 w-4 mr-1" />
            New Schedule
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add form */}
        <AnimatePresence>
          {showAdd && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <Card className="border-2 border-dashed border-purple-300 dark:border-purple-700 bg-purple-50/50 dark:bg-purple-950/20">
                <CardContent className="p-4 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <Label className="text-xs text-gray-700 dark:text-gray-300">Email Address</Label>
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your@email.com"
                        className="bg-white dark:bg-gray-700 text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-700 dark:text-gray-300">Frequency</Label>
                      <Select value={frequency} onValueChange={setFrequency}>
                        <SelectTrigger className="bg-white dark:bg-gray-700 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="weekly">Weekly (Mondays)</SelectItem>
                          <SelectItem value="monthly">Monthly (1st)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-700 dark:text-gray-300">Report Type</Label>
                      <Select value={reportType} onValueChange={setReportType}>
                        <SelectTrigger className="bg-white dark:bg-gray-700 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="full">Full Summary</SelectItem>
                          <SelectItem value="income">Income Only</SelectItem>
                          <SelectItem value="spending">Spending Only</SelectItem>
                          <SelectItem value="pl">Profit & Loss</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" size="sm" onClick={() => setShowAdd(false)}>
                      Cancel
                    </Button>
                    <Button size="sm" onClick={createSchedule} className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                      Create Schedule
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Schedules List */}
        {!loading && schedules.length > 0 && (
          <div className="space-y-2">
            {schedules.map((sched) => (
              <div
                key={sched._id}
                className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                  sched.enabled
                    ? "bg-white dark:bg-gray-800/80 border-gray-200 dark:border-gray-700"
                    : "bg-gray-50 dark:bg-gray-800/40 border-gray-200 dark:border-gray-700 opacity-60"
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{sched.email}</span>
                    <Badge variant="secondary" className="text-[10px]">
                      {sched.frequency === "weekly" ? "Weekly" : "Monthly"}
                    </Badge>
                    <Badge variant="outline" className="text-[10px]">
                      {sched.reportType === "full" ? "Full" : sched.reportType === "pl" ? "P&L" : sched.reportType}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 text-[10px] text-gray-500">
                    {sched.lastSentAt && (
                      <span className="flex items-center gap-0.5">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        Last sent {new Date(sched.lastSentAt).toLocaleDateString()}
                      </span>
                    )}
                    <span className="flex items-center gap-0.5">
                      <Calendar className="h-3 w-3" />
                      Next: {new Date(sched.nextRunAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-2">
                  <Switch
                    checked={sched.enabled}
                    onCheckedChange={(v) => toggleSchedule(sched._id, v)}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-red-500 hover:text-red-700"
                    onClick={() => deleteSchedule(sched._id)}
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && schedules.length === 0 && !showAdd && (
          <div className="text-center py-6 text-gray-500 dark:text-gray-400">
            <Mail className="h-10 w-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No scheduled reports yet. Create one to get started!</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
