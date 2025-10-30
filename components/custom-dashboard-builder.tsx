"use client"

import React, { useState, useCallback, Suspense } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { motion, Reorder } from "framer-motion"
import { Plus, Settings, Trash2, GripVertical, BarChart3, TrendingUp, Users, DollarSign, PieChart, Activity, Save, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import dynamic from "next/dynamic"

interface DashboardWidget {
  id: string
  type: 'chart' | 'metric' | 'table' | 'text'
  title: string
  description?: string
  position: { x: number; y: number; w: number; h: number }
  config: any
  data?: any[]
}

const LazyInteractiveChart = dynamic(() =>
  import("@/components/interactive-chart").then(mod => ({ default: mod.InteractiveChart })), {
    loading: () => (
      <Card className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-white/20 dark:border-gray-700/20 shadow-xl">
        <CardContent className="flex items-center justify-center h-32">
          <div className="text-center">
            <BarChart3 className="h-8 w-8 mx-auto mb-2 text-gray-400 animate-pulse" />
            <p className="text-sm text-gray-500">Loading chart...</p>
          </div>
        </CardContent>
      </Card>
    )
  }
)

interface CustomDashboardBuilderProps {
  initialWidgets?: DashboardWidget[]
  onSave?: (widgets: DashboardWidget[]) => void
  availableData?: any
}

const WIDGET_TYPES = [
  { id: 'chart', label: 'Interactive Chart', icon: BarChart3, color: 'bg-blue-500' },
  { id: 'metric', label: 'Metric Card', icon: TrendingUp, color: 'bg-green-500' },
  { id: 'table', label: 'Data Table', icon: Users, color: 'bg-purple-500' },
  { id: 'text', label: 'Text Block', icon: DollarSign, color: 'bg-orange-500' },
]

export function CustomDashboardBuilder({
  initialWidgets = [],
  onSave,
  availableData
}: CustomDashboardBuilderProps) {
  const [widgets, setWidgets] = useState<DashboardWidget[]>(initialWidgets)
  const [isEditMode, setIsEditMode] = useState(false)
  const [selectedWidget, setSelectedWidget] = useState<DashboardWidget | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const { toast } = useToast()

  const addWidget = useCallback((type: string) => {
    const newWidget: DashboardWidget = {
      id: `widget-${Date.now()}`,
      type: type as any,
      title: `New ${type} Widget`,
      position: { x: 0, y: 0, w: 6, h: 4 },
      config: {},
      data: availableData || []
    }

    setWidgets(prev => [...prev, newWidget])
    setIsAddDialogOpen(false)
    setSelectedWidget(newWidget)

    toast({
      title: "Widget Added",
      description: `New ${type} widget has been added to your dashboard.`,
    })
  }, [availableData, toast])

  const updateWidget = useCallback((id: string, updates: Partial<DashboardWidget>) => {
    setWidgets(prev => prev.map(widget =>
      widget.id === id ? { ...widget, ...updates } : widget
    ))
  }, [])

  const removeWidget = useCallback((id: string) => {
    setWidgets(prev => prev.filter(widget => widget.id !== id))
    if (selectedWidget?.id === id) {
      setSelectedWidget(null)
    }

    toast({
      title: "Widget Removed",
      description: "Widget has been removed from your dashboard.",
    })
  }, [selectedWidget, toast])

  const saveDashboard = useCallback(() => {
    if (onSave) {
      onSave(widgets)
    }

    toast({
      title: "Dashboard Saved",
      description: "Your custom dashboard layout has been saved.",
    })
  }, [widgets, onSave, toast])

  const renderWidget = (widget: DashboardWidget) => {
    switch (widget.type) {
      case 'chart':
        return (
          <Suspense fallback={
            <Card className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-white/20 dark:border-gray-700/20 shadow-xl">
              <CardContent className="flex items-center justify-center h-32">
                <div className="text-center">
                  <BarChart3 className="h-8 w-8 mx-auto mb-2 text-gray-400 animate-pulse" />
                  <p className="text-sm text-gray-500">Loading chart...</p>
                </div>
              </CardContent>
            </Card>
          }>
            <LazyInteractiveChart
              data={widget.data || []}
              title={widget.title}
              description={widget.description}
              type={widget.config.chartType || 'line'}
              height={widget.position.h * 60}
              enableRealTime={widget.config.enableRealTime}
            />
          </Suspense>
        )

      case 'metric':
        return (
          <Card className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-white/20 dark:border-gray-700/20 shadow-xl">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">{widget.title}</CardTitle>
              {widget.description && (
                <CardDescription className="text-gray-600 dark:text-gray-300">
                  {widget.description}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {widget.config.value || '0'}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                {widget.config.change || '+0% from last period'}
              </div>
            </CardContent>
          </Card>
        )

      case 'table':
        return (
          <Card className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-white/20 dark:border-gray-700/20 shadow-xl">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">{widget.title}</CardTitle>
              {widget.description && (
                <CardDescription className="text-gray-600 dark:text-gray-300">
                  {widget.description}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-2 text-gray-900 dark:text-white">Name</th>
                      <th className="text-left py-2 text-gray-900 dark:text-white">Value</th>
                      <th className="text-left py-2 text-gray-900 dark:text-white">Change</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(widget.data || []).slice(0, 5).map((item: any, index: number) => (
                      <tr key={index} className="border-b border-gray-100 dark:border-gray-800">
                        <td className="py-2 text-gray-700 dark:text-gray-300">{item.name || item.source}</td>
                        <td className="py-2 text-gray-700 dark:text-gray-300">${item.value || item.amount || 0}</td>
                        <td className="py-2 text-green-600 dark:text-green-400">+{item.change || 0}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )

      case 'text':
        return (
          <Card className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-white/20 dark:border-gray-700/20 shadow-xl">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">{widget.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {widget.config.content || 'Add your custom text content here...'}
              </div>
            </CardContent>
          </Card>
        )

      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Dashboard Controls */}
      <Card className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-white/20 dark:border-gray-700/20 shadow-xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-gray-900 dark:text-white">Custom Dashboard Builder</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-300">
                Create and customize your personal dashboard layout
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant={isEditMode ? "default" : "outline"}
                onClick={() => setIsEditMode(!isEditMode)}
              >
                <Settings className="h-4 w-4 mr-2" />
                {isEditMode ? 'Exit Edit' : 'Edit Mode'}
              </Button>

              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Widget
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Widget</DialogTitle>
                    <DialogDescription>
                      Choose a widget type to add to your dashboard
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid grid-cols-2 gap-4">
                    {WIDGET_TYPES.map((type) => (
                      <Button
                        key={type.id}
                        variant="outline"
                        className="h-20 flex flex-col items-center justify-center gap-2"
                        onClick={() => addWidget(type.id)}
                      >
                        <div className={`p-2 rounded-lg ${type.color}`}>
                          <type.icon className="h-6 w-6 text-white" />
                        </div>
                        <span className="text-sm">{type.label}</span>
                      </Button>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>

              <Button onClick={saveDashboard}>
                <Save className="h-4 w-4 mr-2" />
                Save Dashboard
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Widget Configuration Panel */}
      {selectedWidget && isEditMode && (
        <Card className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-white/20 dark:border-gray-700/20 shadow-xl">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white flex items-center justify-between">
              Configure Widget
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedWidget(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="widget-title">Title</Label>
                <Input
                  id="widget-title"
                  value={selectedWidget.title}
                  onChange={(e) => updateWidget(selectedWidget.id, { title: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="widget-description">Description</Label>
                <Input
                  id="widget-description"
                  value={selectedWidget.description || ''}
                  onChange={(e) => updateWidget(selectedWidget.id, { description: e.target.value })}
                />
              </div>
            </div>

            {selectedWidget.type === 'text' && (
              <div>
                <Label htmlFor="widget-content">Content</Label>
                <Textarea
                  id="widget-content"
                  value={selectedWidget.config.content || ''}
                  onChange={(e) => updateWidget(selectedWidget.id, {
                    config: { ...selectedWidget.config, content: e.target.value }
                  })}
                  rows={4}
                />
              </div>
            )}

            {selectedWidget.type === 'chart' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Chart Type</Label>
                  <Select
                    value={selectedWidget.config.chartType || 'line'}
                    onValueChange={(value) => updateWidget(selectedWidget.id, {
                      config: { ...selectedWidget.config, chartType: value }
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="line">Line Chart</SelectItem>
                      <SelectItem value="bar">Bar Chart</SelectItem>
                      <SelectItem value="area">Area Chart</SelectItem>
                      <SelectItem value="pie">Pie Chart</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="realtime"
                    checked={selectedWidget.config.enableRealTime || false}
                    onChange={(e) => updateWidget(selectedWidget.id, {
                      config: { ...selectedWidget.config, enableRealTime: e.target.checked }
                    })}
                    title="Enable real-time updates for this chart"
                  />
                  <Label htmlFor="realtime">Enable Real-time Updates</Label>
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <Button
                variant="destructive"
                onClick={() => removeWidget(selectedWidget.id)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Remove Widget
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Reorder.Group axis="y" values={widgets} onReorder={setWidgets}>
          {widgets.map((widget) => (
            <Reorder.Item key={widget.id} value={widget}>
              <motion.div
                layout
                className={`relative ${isEditMode ? 'cursor-move' : ''}`}
                onClick={() => isEditMode && setSelectedWidget(widget)}
              >
                {isEditMode && (
                  <div className="absolute -top-2 -left-2 z-10 flex items-center gap-1">
                    <div className="bg-blue-500 text-white p-1 rounded">
                      <GripVertical className="h-4 w-4" />
                    </div>
                    {selectedWidget?.id === widget.id && (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        Selected
                      </Badge>
                    )}
                  </div>
                )}
                {renderWidget(widget)}
              </motion.div>
            </Reorder.Item>
          ))}
        </Reorder.Group>
      </div>

      {widgets.length === 0 && (
        <Card className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-white/20 dark:border-gray-700/20 shadow-xl">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BarChart3 className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No widgets yet
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-center mb-4">
              Start building your custom dashboard by adding widgets
            </p>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Widget
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
