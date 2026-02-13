"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Target, Plus, Trash2, TrendingUp, Trophy, Flag, Pause, Play, CheckCircle2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface Milestone {
  percent: number
  label: string
  reached: boolean
}

interface Goal {
  _id: string
  userId: string
  title: string
  type: "revenue" | "profit" | "clients" | "savings" | "custom"
  target: number
  current: number
  startDate: string
  endDate: string | null
  milestones: Milestone[]
  status: "active" | "completed" | "paused"
  createdAt: string
  updatedAt: string
}

interface GoalTrackingProps {
  userId: string
  totalIncome: number
  totalSpending: number
  totalProfit: number
  clientCount: number
}

const GOAL_TYPE_CONFIG: Record<string, { label: string; color: string; gradient: string; icon: string }> = {
  revenue: { label: "Revenue", color: "text-green-600", gradient: "from-green-500 to-emerald-500", icon: "💰" },
  profit: { label: "Profit", color: "text-blue-600", gradient: "from-blue-500 to-cyan-500", icon: "📈" },
  clients: { label: "Clients", color: "text-purple-600", gradient: "from-purple-500 to-pink-500", icon: "👥" },
  savings: { label: "Savings", color: "text-amber-600", gradient: "from-amber-500 to-orange-500", icon: "🏦" },
  custom: { label: "Custom", color: "text-gray-600", gradient: "from-gray-500 to-slate-500", icon: "🎯" },
}

export function GoalTracking({ userId, totalIncome, totalSpending, totalProfit, clientCount }: GoalTrackingProps) {
  const { toast } = useToast()
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)

  // Form state
  const [newTitle, setNewTitle] = useState("")
  const [newType, setNewType] = useState<string>("revenue")
  const [newTarget, setNewTarget] = useState("")
  const [newEndDate, setNewEndDate] = useState("")

  const fetchGoals = async () => {
    try {
      const res = await fetch(`/api/goals?userId=${encodeURIComponent(userId)}`)
      const data = await res.json()
      if (res.ok) setGoals(data.goals || [])
    } catch {
      console.error("Failed to fetch goals")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (userId) fetchGoals()
  }, [userId])

  // Auto-update goal current values based on live data
  const goalsWithLiveData = useMemo(() => {
    return goals.map((goal) => {
      let current = goal.current
      switch (goal.type) {
        case "revenue":
          current = totalIncome
          break
        case "profit":
          current = totalProfit
          break
        case "clients":
          current = clientCount
          break
        case "savings":
          current = Math.max(0, totalIncome - totalSpending)
          break
        default:
          current = goal.current
      }
      return { ...goal, current }
    })
  }, [goals, totalIncome, totalProfit, totalSpending, clientCount])

  const addGoal = async () => {
    if (!newTitle || !newTarget) {
      toast({ title: "Error", description: "Title and target are required.", variant: "destructive" })
      return
    }

    const defaultMilestones: Milestone[] = [
      { percent: 25, label: "25% — Getting started", reached: false },
      { percent: 50, label: "50% — Halfway there", reached: false },
      { percent: 75, label: "75% — Almost done", reached: false },
      { percent: 100, label: "100% — Goal reached!", reached: false },
    ]

    try {
      const res = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          title: newTitle,
          type: newType,
          target: Number(newTarget),
          endDate: newEndDate || null,
          milestones: defaultMilestones,
        }),
      })
      if (res.ok) {
        toast({ title: "Goal Created", description: `"${newTitle}" has been added.` })
        setNewTitle("")
        setNewTarget("")
        setNewEndDate("")
        setShowAdd(false)
        fetchGoals()
      }
    } catch {
      toast({ title: "Error", description: "Failed to create goal.", variant: "destructive" })
    }
  }

  const updateGoalStatus = async (id: string, status: string) => {
    try {
      await fetch("/api/goals", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, userId, status }),
      })
      fetchGoals()
    } catch {
      toast({ title: "Error", description: "Failed to update goal.", variant: "destructive" })
    }
  }

  const deleteGoal = async (id: string) => {
    try {
      await fetch(`/api/goals?id=${id}&userId=${encodeURIComponent(userId)}`, { method: "DELETE" })
      toast({ title: "Deleted", description: "Goal removed." })
      fetchGoals()
    } catch {
      toast({ title: "Error", description: "Failed to delete goal.", variant: "destructive" })
    }
  }

  const getProgress = (current: number, target: number) => Math.min(100, Math.max(0, (current / target) * 100))

  const getDaysRemaining = (endDate: string | null) => {
    if (!endDate) return null
    const days = Math.ceil((new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    return days
  }

  if (loading) {
    return (
      <Card className="glow-card backdrop-blur shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="glow-card backdrop-blur shadow-lg border-white/20 dark:border-gray-700/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
              <Target className="h-5 w-5 text-blue-500" />
              Goal Tracking
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-300">
              Set targets and track your progress toward business goals
            </CardDescription>
          </div>
          <Button
            onClick={() => setShowAdd(!showAdd)}
            size="sm"
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
          >
            <Plus className="h-4 w-4 mr-1" />
            New Goal
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add Goal Form */}
        <AnimatePresence>
          {showAdd && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <Card className="border-2 border-dashed border-blue-300 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-950/20">
                <CardContent className="p-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-700 dark:text-gray-300">Goal Title</Label>
                      <Input
                        placeholder="e.g., Reach $100k Revenue"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        className="bg-white dark:bg-gray-700"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-700 dark:text-gray-300">Type</Label>
                      <Select value={newType} onValueChange={setNewType}>
                        <SelectTrigger className="bg-white dark:bg-gray-700">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(GOAL_TYPE_CONFIG).map(([k, v]) => (
                            <SelectItem key={k} value={k}>
                              {v.icon} {v.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-gray-700 dark:text-gray-300">Target Value</Label>
                      <Input
                        type="number"
                        placeholder="e.g., 100000"
                        value={newTarget}
                        onChange={(e) => setNewTarget(e.target.value)}
                        className="bg-white dark:bg-gray-700"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-700 dark:text-gray-300">Deadline (optional)</Label>
                      <Input
                        type="date"
                        value={newEndDate}
                        onChange={(e) => setNewEndDate(e.target.value)}
                        className="bg-white dark:bg-gray-700"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" size="sm" onClick={() => setShowAdd(false)}>
                      Cancel
                    </Button>
                    <Button size="sm" onClick={addGoal} className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                      Create Goal
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Goals List */}
        {goalsWithLiveData.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Target className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>No goals set yet. Create one to start tracking!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {goalsWithLiveData.map((goal) => {
              const progress = getProgress(goal.current, goal.target)
              const config = GOAL_TYPE_CONFIG[goal.type] || GOAL_TYPE_CONFIG.custom
              const daysLeft = getDaysRemaining(goal.endDate)
              const isOverdue = daysLeft !== null && daysLeft < 0
              const isCompleted = progress >= 100 || goal.status === "completed"

              return (
                <motion.div
                  key={goal._id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 rounded-xl border transition-all ${
                    isCompleted
                      ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800"
                      : goal.status === "paused"
                      ? "bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 opacity-70"
                      : "bg-white dark:bg-gray-800/80 border-gray-200 dark:border-gray-700"
                  }`}
                >
                  {/* Goal Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{config.icon}</span>
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                          {goal.title}
                          {isCompleted && <Trophy className="h-4 w-4 text-yellow-500" />}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="secondary" className="text-[10px]">
                            {config.label}
                          </Badge>
                          {goal.status === "paused" && (
                            <Badge variant="outline" className="text-[10px] text-orange-600">
                              Paused
                            </Badge>
                          )}
                          {isOverdue && !isCompleted && (
                            <Badge variant="destructive" className="text-[10px]">
                              Overdue
                            </Badge>
                          )}
                          {daysLeft !== null && daysLeft > 0 && !isCompleted && (
                            <span className="text-[10px] text-gray-500">
                              {daysLeft} day{daysLeft !== 1 ? "s" : ""} left
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {goal.status === "active" && !isCompleted && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => updateGoalStatus(goal._id, "paused")}
                          title="Pause"
                        >
                          <Pause className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      {goal.status === "paused" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => updateGoalStatus(goal._id, "active")}
                          title="Resume"
                        >
                          <Play className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      {!isCompleted && progress >= 100 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-green-600"
                          onClick={() => updateGoalStatus(goal._id, "completed")}
                          title="Mark Complete"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-red-500 hover:text-red-700"
                        onClick={() => deleteGoal(goal._id)}
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-2">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600 dark:text-gray-400">
                        {goal.type === "clients"
                          ? `${Math.round(goal.current)} / ${goal.target}`
                          : `$${goal.current.toLocaleString()} / $${goal.target.toLocaleString()}`}
                      </span>
                      <span className={`font-semibold ${progress >= 100 ? "text-green-600" : config.color}`}>
                        {progress.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full bg-gradient-to-r ${config.gradient}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(progress, 100)}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                      />
                    </div>
                  </div>

                  {/* Milestones */}
                  {goal.milestones && goal.milestones.length > 0 && (
                    <div className="flex gap-1 mt-2">
                      {goal.milestones.map((m, i) => {
                        const reached = progress >= m.percent
                        return (
                          <div
                            key={i}
                            className="flex items-center gap-1"
                            title={m.label}
                          >
                            <div
                              className={`h-2 w-2 rounded-full ${
                                reached ? "bg-green-500" : "bg-gray-300 dark:bg-gray-600"
                              }`}
                            />
                            {i < goal.milestones.length - 1 && (
                              <div className={`h-0.5 w-4 ${reached ? "bg-green-400" : "bg-gray-200 dark:bg-gray-700"}`} />
                            )}
                          </div>
                        )
                      })}
                      <span className="text-[10px] text-gray-500 ml-1">
                        {goal.milestones.filter((m) => progress >= m.percent).length}/{goal.milestones.length} milestones
                      </span>
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>
        )}

        {/* Summary stats */}
        {goalsWithLiveData.length > 0 && (
          <div className="grid grid-cols-3 gap-3 pt-2 border-t border-gray-200 dark:border-gray-700">
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">{goalsWithLiveData.filter((g) => g.status === "completed" || getProgress(g.current, g.target) >= 100).length}</div>
              <div className="text-xs text-gray-500">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600">{goalsWithLiveData.filter((g) => g.status === "active" && getProgress(g.current, g.target) < 100).length}</div>
              <div className="text-xs text-gray-500">In Progress</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-amber-600">
                {goalsWithLiveData.length > 0
                  ? (goalsWithLiveData.reduce((sum, g) => sum + getProgress(g.current, g.target), 0) / goalsWithLiveData.length).toFixed(0)
                  : 0}
                %
              </div>
              <div className="text-xs text-gray-500">Avg Progress</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
