"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  segmentClients,
  getClientBadges,
  type ClientForSegmentation,
  type SegmentationResult,
} from "@/lib/client-segmentation"
import {
  Users, TrendingUp, AlertTriangle, Layers, ChevronDown, ChevronUp, BarChart3,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface ClientSegmentationViewProps {
  clients: ClientForSegmentation[]
  onSelectClient?: (clientId: string) => void
}

type SegmentCategory = "revenue" | "risk" | "activity" | "industry"

export default function ClientSegmentationView({ clients, onSelectClient }: ClientSegmentationViewProps) {
  const [selectedCategory, setSelectedCategory] = useState<SegmentCategory>("revenue")
  const [expandedSegment, setExpandedSegment] = useState<string | null>(null)

  const segResult: SegmentationResult = useMemo(() => segmentClients(clients), [clients])

  const categorySegments = useMemo(() => {
    const prefixMap: Record<SegmentCategory, string> = {
      revenue: "tier-",
      risk: "risk-",
      activity: "activity-",
      industry: "industry-",
    }
    return segResult.segments.filter((s) => s.id.startsWith(prefixMap[selectedCategory]))
  }, [segResult, selectedCategory])

  const categories: Array<{ id: SegmentCategory; label: string; icon: any }> = [
    { id: "revenue", label: "Revenue Tier", icon: TrendingUp },
    { id: "risk", label: "Risk Level", icon: AlertTriangle },
    { id: "activity", label: "Activity", icon: BarChart3 },
    { id: "industry", label: "Industry", icon: Layers },
  ]

  if (clients.length === 0) {
    return (
      <Card className="border-0 shadow-lg">
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Add clients to see segmentation analysis.
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <Users className="h-5 w-5 text-indigo-500" />
          Client Segmentation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 rounded-lg bg-indigo-50 dark:bg-indigo-950/20">
            <div className="text-xs text-gray-500">Total Clients</div>
            <div className="text-lg font-bold text-indigo-700 dark:text-indigo-400">{segResult.summary.totalClients}</div>
          </div>
          <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/20">
            <div className="text-xs text-gray-500">Total Revenue</div>
            <div className="text-lg font-bold text-green-700 dark:text-green-400">${segResult.summary.totalRevenue.toLocaleString()}</div>
          </div>
          <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-950/20">
            <div className="text-xs text-gray-500">Segments</div>
            <div className="text-lg font-bold text-purple-700 dark:text-purple-400">{segResult.summary.segmentCount}</div>
          </div>
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20">
            <div className="text-xs text-gray-500">At Risk</div>
            <div className="text-lg font-bold text-red-700 dark:text-red-400">{segResult.summary.atRiskCount}</div>
          </div>
        </div>

        {/* Category tabs */}
        <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
          {categories.map((cat) => {
            const Icon = cat.icon
            return (
              <Button
                key={cat.id}
                variant="ghost"
                size="sm"
                onClick={() => { setSelectedCategory(cat.id); setExpandedSegment(null) }}
                className={`flex-1 h-8 text-xs gap-1.5 ${
                  selectedCategory === cat.id
                    ? "bg-white dark:bg-gray-700 shadow-sm font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{cat.label}</span>
              </Button>
            )
          })}
        </div>

        {/* Segment cards */}
        <div className="space-y-2">
          {categorySegments.map((seg) => {
            const isExpanded = expandedSegment === seg.id
            const percentage = segResult.summary.totalClients > 0
              ? ((seg.count / segResult.summary.totalClients) * 100).toFixed(0)
              : "0"
            return (
              <motion.div
                key={seg.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className={`rounded-lg border transition-colors ${isExpanded ? "border-indigo-300 dark:border-indigo-700" : "border-gray-200 dark:border-gray-700"}`}
              >
                <button
                  onClick={() => setExpandedSegment(isExpanded ? null : seg.id)}
                  className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${seg.badgeClass}`} />
                    <div>
                      <span className="text-sm font-medium">{seg.label}</span>
                      <span className="text-xs text-muted-foreground ml-2">{seg.count} client{seg.count !== 1 ? "s" : ""} ({percentage}%)</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-xs font-medium text-green-600">${seg.totalRevenue.toLocaleString()}</div>
                      <div className="text-[10px] text-muted-foreground">avg ${Math.round(seg.avgRevenue).toLocaleString()}</div>
                    </div>
                    {/* Minibar */}
                    <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${seg.badgeClass} rounded-full transition-all`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </div>
                </button>

                {/* Expanded client list */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-3 pb-3 space-y-1 border-t border-gray-200 dark:border-gray-700 pt-2">
                        {seg.clients.map((client) => {
                          const badges = getClientBadges(client.clientId || client.id, segResult)
                          return (
                            <div
                              key={client.clientId || client.id}
                              className="flex items-center justify-between p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors"
                              onClick={() => onSelectClient?.(client.clientId || client.id)}
                            >
                              <div className="min-w-0">
                                <div className="text-sm font-medium truncate">{client.name}</div>
                                <div className="text-xs text-muted-foreground">{client.company}</div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <div className="flex gap-1 flex-wrap justify-end">
                                  {badges
                                    .filter((b) => !b.id.startsWith(seg.id.split("-")[0]))
                                    .slice(0, 3)
                                    .map((b) => (
                                      <Badge key={b.id} variant="outline" className={`text-[9px] h-4 px-1 ${b.textClass}`}>
                                        {b.label}
                                      </Badge>
                                    ))}
                                </div>
                                <span className="text-xs font-medium text-green-600 w-20 text-right">
                                  ${client.totalIncome.toLocaleString()}
                                </span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
