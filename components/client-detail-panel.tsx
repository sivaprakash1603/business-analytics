"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { X, DollarSign, Calendar, Building2, Mail } from "lucide-react"
import ClientActivityLog from "@/components/client-activity-log"
import ClientEmailComposer from "@/components/client-email-composer"
import ClientContracts from "@/components/client-contracts"
import { getClientBadges, type SegmentationResult } from "@/lib/client-segmentation"

interface ClientDetailPanelProps {
  userId: string
  client: {
    id: string
    _id?: string
    clientId?: string
    name: string
    company: string
    description?: string
    totalIncome: number
    createdAt: string
    email?: string
  }
  segResult?: SegmentationResult
  onClose: () => void
}

export default function ClientDetailPanel({ userId, client, segResult, onClose }: ClientDetailPanelProps) {
  const clientId = client.clientId || client._id || client.id
  const badges = segResult ? getClientBadges(clientId, segResult) : []

  const refreshActivity = () => {
    // Activity log auto-refreshes via its own fetch
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }}
      className="space-y-4"
    >
      {/* Client header */}
      <div className="flex items-start justify-between p-4 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 border border-blue-200 dark:border-blue-800">
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{client.name}</h2>
            {badges.map((b) => (
              <Badge key={b.id} className={`text-[10px] h-5 px-1.5 border-0 ${b.bgClass} ${b.textClass}`}>
                {b.label}
              </Badge>
            ))}
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><Building2 className="h-3.5 w-3.5" /> {client.company}</span>
            <span className="flex items-center gap-1"><DollarSign className="h-3.5 w-3.5 text-green-600" /> ${client.totalIncome.toLocaleString()} revenue</span>
            <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> Since {new Date(client.createdAt).toLocaleDateString()}</span>
            {client.email && (
              <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> {client.email}</span>
            )}
          </div>
          {client.description && <p className="text-sm text-muted-foreground">{client.description}</p>}
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} className="shrink-0">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Feature panels */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          <ClientActivityLog
            userId={userId}
            clientId={clientId}
            clientName={client.name}
            clientEmail={client.email}
          />
          {client.email && (
            <ClientEmailComposer
              userId={userId}
              clientId={clientId}
              clientName={client.name}
              clientEmail={client.email}
              onSent={refreshActivity}
            />
          )}
        </div>
        <div>
          <ClientContracts
            userId={userId}
            clientId={clientId}
            clientName={client.name}
          />
        </div>
      </div>
    </motion.div>
  )
}
