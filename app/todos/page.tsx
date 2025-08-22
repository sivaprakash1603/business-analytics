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
import { Plus, Calendar, Clock, CheckCircle, Trash2, AlertCircle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Todo List</h1>
            <p className="text-muted-foreground">Manage your tasks and stay organized</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-bg text-white">
                <Plus className="h-4 w-4 mr-2" />
                Add Todo
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Todo</DialogTitle>
                <DialogDescription>Create a new task with a due date and time.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="todoTitle">Title *</Label>
                  <Input
                    id="todoTitle"
                    placeholder="Enter todo title"
                    value={todoTitle}
                    onChange={(e) => setTodoTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="todoDescription">Description</Label>
                  <Textarea
                    id="todoDescription"
                    placeholder="Enter todo description (optional)"
                    value={todoDescription}
                    onChange={(e) => setTodoDescription(e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="todoDueDate">Due Date *</Label>
                    <Input
                      id="todoDueDate"
                      type="date"
                      value={todoDueDate}
                      onChange={(e) => setTodoDueDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="todoDueTime">Due Time *</Label>
                    <Input
                      id="todoDueTime"
                      type="time"
                      value={todoDueTime}
                      onChange={(e) => setTodoDueTime(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button onClick={addTodo} className="flex-1 gradient-bg text-white">
                    Add Todo
                  </Button>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="flex-1">
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
              <CheckCircle className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todos.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{completedCount}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Due Today</CardTitle>
              <Calendar className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{dueTodayCount}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{overdueCount}</div>
            </CardContent>
          </Card>
        </div>

        {/* Todos List */}
        <Card>
          <CardHeader>
            <CardTitle>All Tasks</CardTitle>
            <CardDescription>Manage your tasks and track progress</CardDescription>
          </CardHeader>
          <CardContent>
            {todos.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No tasks yet</h3>
                <p className="text-muted-foreground mb-4">Start by adding your first task to stay organized.</p>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="gradient-bg text-white">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Your First Task
                    </Button>
                  </DialogTrigger>
                </Dialog>
              </div>
            ) : (
              <div className="space-y-3">
                {sortedTodos.map((todo) => (
                  <div
                    key={todo.id}
                    className={`flex items-start gap-3 p-4 border rounded-lg transition-colors ${
                      todo.completed ? "bg-muted/50 opacity-75" : "hover:bg-muted/50"
                    }`}
                  >
                    <Checkbox checked={todo.completed} onCheckedChange={() => toggleTodo(todo.id)} className="mt-1" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className={`font-medium ${todo.completed ? "line-through text-muted-foreground" : ""}`}>
                          {todo.title}
                        </h3>
                        {!todo.completed && isOverdue(todo.dueDate, todo.dueTime) && (
                          <Badge variant="destructive" className="text-xs">
                            Overdue
                          </Badge>
                        )}
                        {!todo.completed && isDueToday(todo.dueDate) && !isOverdue(todo.dueDate, todo.dueTime) && (
                          <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800">
                            Due Today
                          </Badge>
                        )}
                        {todo.completed && (
                          <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                            Completed
                          </Badge>
                        )}
                      </div>
                      {todo.description && (
                        <p
                          className={`text-sm mb-2 ${todo.completed ? "text-muted-foreground" : "text-muted-foreground"}`}
                        >
                          {todo.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(todo.dueDate).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(`2000-01-01T${todo.dueTime}`).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteTodo(todo.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
        </DashboardLayout>
  )
}
