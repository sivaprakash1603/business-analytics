"use client"

import DashboardLayout from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { useToast } from "@/hooks/use-toast"
import { Plus, Calendar, Clock, CheckCircle, Trash2, AlertCircle, CheckSquare, Target, TrendingUp } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { motion } from "framer-motion"
import { MagazineCard } from "@/components/magazine-card"
import { FloatingElements } from "@/components/floating-elements"

interface Todo {
  id: string
  title: string
  description: string
  dueDate: string
  dueTime: string
  completed: boolean
  createdAt: string
}

export default function TodosPage() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [todoTitle, setTodoTitle] = useState("")
  const [todoDescription, setTodoDescription] = useState("")
  const [todoDueDate, setTodoDueDate] = useState("")
  const [todoDueTime, setTodoDueTime] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const { toast } = useToast()


  const { user } = useAuth()

  // Fetch todos from DB
  async function fetchTodosFromDB() {
    if (!user?.uid) return setTodos([])
    try {
      const res = await fetch("/api/todos?userId=" + user.uid)
      const data = await res.json()
      if (res.ok && data.entries) {
        setTodos(data.entries.map((todo: any) => ({ ...todo, id: todo._id })))
      } else setTodos([])
    } catch {
      setTodos([])
    }
  }

  useEffect(() => {
    if (user?.uid) fetchTodosFromDB()
  }, [user?.uid])

  const addTodo = async () => {
    if (!todoTitle || !todoDueDate || !todoDueTime) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }
    if (!user?.uid) {
      toast({
        title: "Error",
        description: "You must be logged in to add a todo.",
        variant: "destructive",
      })
      return
    }
    try {
      const res = await fetch("/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: todoTitle,
          description: todoDescription,
          dueDate: todoDueDate,
          dueTime: todoDueTime,
          completed: false,
          createdAt: new Date().toISOString(),
          userId: user.uid,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast({
          title: "Error",
          description: data.error || "Failed to store todo.",
          variant: "destructive",
        })
        return
      }
      setTodoTitle("")
      setTodoDescription("")
      setTodoDueDate("")
      setTodoDueTime("")
      setIsDialogOpen(false)
      toast({
        title: "Success",
        description: "Todo added successfully!",
      })
      fetchTodosFromDB()
    } catch {
      toast({
        title: "Error",
        description: "Failed to store todo.",
        variant: "destructive",
      })
    }
  }

  const toggleTodo = async (id: string) => {
    const todo = todos.find((t) => t.id === id)
    if (!todo) return
    try {
      const res = await fetch("/api/todos", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, completed: !todo.completed }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast({
          title: "Error",
          description: data.error || "Failed to update todo.",
          variant: "destructive",
        })
        return
      }
      toast({
        title: "Success",
        description: `Todo ${todo.completed ? "unmarked" : "completed"}!`,
      })
      fetchTodosFromDB()
    } catch {
      toast({
        title: "Error",
        description: "Failed to update todo.",
        variant: "destructive",
      })
    }
  }

  const deleteTodo = async (id: string) => {
    try {
      const res = await fetch("/api/todos", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast({
          title: "Error",
          description: data.error || "Failed to delete todo.",
          variant: "destructive",
        })
        return
      }
      toast({
        title: "Success",
        description: "Todo deleted successfully!",
      })
      fetchTodosFromDB()
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete todo.",
        variant: "destructive",
      })
    }
  }

  const isOverdue = (dueDate: string, dueTime: string) => {
    const now = new Date()
    const due = new Date(`${dueDate}T${dueTime}`)
    return due < now
  }

  const isDueToday = (dueDate: string) => {
    const today = new Date().toISOString().split("T")[0]
    return dueDate === today
  }

  const sortedTodos = [...todos].sort((a, b) => {
    // Completed todos go to bottom
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1
    }

    // Sort by due date and time
    const dateA = new Date(`${a.dueDate}T${a.dueTime}`)
    const dateB = new Date(`${b.dueDate}T${b.dueTime}`)
    return dateA.getTime() - dateB.getTime()
  })

  const completedCount = todos.filter((todo) => todo.completed).length
  const overdueCount = todos.filter((todo) => !todo.completed && isOverdue(todo.dueDate, todo.dueTime)).length
  const dueTodayCount = todos.filter((todo) => !todo.completed && isDueToday(todo.dueDate)).length

  return (
    <DashboardLayout>
      <div className="relative min-h-screen">
        <FloatingElements />

        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10"
        >
          <div className="glow-card backdrop-blur rounded-lg p-8 text-gray-900 dark:text-white mb-8 overflow-hidden relative border border-white/20 dark:border-gray-700/20 shadow-xl">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <motion.h1
                    className="text-4xl font-bold mb-3 flex items-center gap-4"
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                  >
                    <CheckSquare className="h-10 w-10" />
                    Task Management Hub
                  </motion.h1>
                  <motion.p
                    className="text-gray-700 dark:text-gray-300 text-lg max-w-2xl"
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                  >
                    Stay organized and productive with intelligent task management.
                    Track deadlines, prioritize work, and achieve your goals efficiently.
                  </motion.p>
                </div>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white border-0 px-6 py-3 text-lg shadow-lg">
                        <Plus className="h-5 w-5 mr-2" />
                        Create Task
                      </Button>
                    </DialogTrigger>
                  </Dialog>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
              className="flex-1"
            >
              <MagazineCard
                title="Total Tasks"
                value={todos.length}
                description="All tasks in your system"
                icon={CheckSquare}
                gradient="from-blue-500 to-cyan-500"
                className="hover:scale-105 transition-all duration-300 h-full"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
              className="flex-1"
            >
              <MagazineCard
                title="Completed"
                value={completedCount}
                description="Tasks successfully finished"
                icon={CheckCircle}
                gradient="from-green-500 to-emerald-500"
                className="hover:scale-105 transition-all duration-300 h-full"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              viewport={{ once: true }}
              className="flex-1"
            >
              <MagazineCard
                title="Due Today"
                value={dueTodayCount}
                description="Tasks requiring immediate attention"
                icon={Calendar}
                gradient="from-orange-500 to-red-500"
                className="hover:scale-105 transition-all duration-300 h-full"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              viewport={{ once: true }}
              className="flex-1"
            >
              <MagazineCard
                title="Overdue"
                value={overdueCount}
                description="Tasks past their deadline"
                icon={AlertCircle}
                gradient="from-red-500 to-pink-500"
                className="hover:scale-105 transition-all duration-300 h-full"
              />
            </motion.div>
          </div>
        </div>

        {/* Tasks List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
            <Card className="glow-card backdrop-blur-sm border-0 shadow-2xl">
              <CardHeader className="pb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl font-bold flex items-center gap-3">
                      <Target className="h-6 w-6 text-blue-600" />
                      Your Tasks
                    </CardTitle>
                    <CardDescription className="text-lg">
                      Manage and track all your business tasks and deadlines
                    </CardDescription>
                  </div>
                  <Badge variant="secondary" className="px-4 py-2 text-sm">
                    {todos.length} Total Tasks
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {todos.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="text-center py-16"
                  >
                    <CheckCircle className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
                    <h3 className="text-2xl font-semibold mb-3">No tasks yet</h3>
                    <p className="text-muted-foreground text-lg mb-6 max-w-md mx-auto">
                      Start building your productivity by creating your first task.
                      Stay organized and achieve your business goals efficiently.
                    </p>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                      <DialogTrigger asChild>
                        <Button className="gradient-bg text-white px-8 py-3 text-lg">
                          <Plus className="h-5 w-5 mr-2" />
                          Create Your First Task
                        </Button>
                      </DialogTrigger>
                    </Dialog>
                  </motion.div>
                ) : (
                  <div className="space-y-4">
                    {sortedTodos.map((todo, index) => (
                      <motion.div
                        key={todo.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className={`group relative overflow-hidden p-6 border rounded-xl transition-all duration-300 ${
                          todo.completed
                            ? "bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800"
                            : "bg-gradient-to-r from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 hover:shadow-lg border-gray-200 dark:border-gray-700"
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <Checkbox
                            checked={todo.completed}
                            onCheckedChange={() => toggleTodo(todo.id)}
                            className="mt-1 h-5 w-5"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className={`text-lg font-semibold transition-colors ${
                                todo.completed
                                  ? "line-through text-muted-foreground"
                                  : "group-hover:text-blue-600"
                              }`}>
                                {todo.title}
                              </h3>
                              {!todo.completed && isOverdue(todo.dueDate, todo.dueTime) && (
                                <Badge variant="destructive" className="animate-pulse">
                                  <AlertCircle className="h-3 w-3 mr-1" />
                                  Overdue
                                </Badge>
                              )}
                              {!todo.completed && isDueToday(todo.dueDate) && !isOverdue(todo.dueDate, todo.dueTime) && (
                                <Badge variant="secondary" className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                                  <Clock className="h-3 w-3 mr-1" />
                                  Due Today
                                </Badge>
                              )}
                              {todo.completed && (
                                <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Completed
                                </Badge>
                              )}
                            </div>
                            {todo.description && (
                              <p className={`text-sm mb-4 leading-relaxed ${
                                todo.completed ? "text-muted-foreground" : "text-muted-foreground"
                              }`}>
                                {todo.description}
                              </p>
                            )}
                            <div className="flex items-center gap-6 text-sm text-muted-foreground">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                <span className="font-medium">
                                  {new Date(todo.dueDate).toLocaleDateString('en-US', {
                                    weekday: 'short',
                                    month: 'short',
                                    day: 'numeric'
                                  })}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                <span className="font-medium">
                                  {new Date(`2000-01-01T${todo.dueTime}`).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteTodo(todo.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

        {/* Add Todo Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <Plus className="h-5 w-5" />
                Create New Task
              </DialogTitle>
              <DialogDescription className="text-base">
                Add a new task with specific deadlines and details to stay organized.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="space-y-3">
                <Label htmlFor="todoTitle" className="text-sm font-medium">Task Title *</Label>
                <Input
                  id="todoTitle"
                  placeholder="Enter a clear, actionable task title"
                  value={todoTitle}
                  onChange={(e) => setTodoTitle(e.target.value)}
                  className="text-base"
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="todoDescription" className="text-sm font-medium">Description</Label>
                <Textarea
                  id="todoDescription"
                  placeholder="Add details, context, or specific requirements..."
                  value={todoDescription}
                  onChange={(e) => setTodoDescription(e.target.value)}
                  rows={4}
                  className="text-base resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <Label htmlFor="todoDueDate" className="text-sm font-medium">Due Date *</Label>
                  <Input
                    id="todoDueDate"
                    type="date"
                    value={todoDueDate}
                    onChange={(e) => setTodoDueDate(e.target.value)}
                    className="text-base"
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="todoDueTime" className="text-sm font-medium">Due Time *</Label>
                  <Input
                    id="todoDueTime"
                    type="time"
                    value={todoDueTime}
                    onChange={(e) => setTodoDueTime(e.target.value)}
                    className="text-base"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={addTodo}
                  className="flex-1 gradient-bg text-white py-3 text-base font-medium"
                  disabled={!todoTitle || !todoDueDate || !todoDueTime}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Task
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  className="flex-1 py-3 text-base"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
