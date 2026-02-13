"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { Share2, Copy, Link, Trash2, Eye, ExternalLink } from "lucide-react"

interface ShareLink {
  _id: string
  token: string
  label: string
  expiresAt: string
  includeIncome: boolean
  includeSpending: boolean
  includeLoans: boolean
  viewCount: number
  createdAt: string
}

interface DashboardSharingProps {
  userId: string
}

export function DashboardSharing({ userId }: DashboardSharingProps) {
  const { toast } = useToast()
  const [shares, setShares] = useState<ShareLink[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)

  // Form state
  const [label, setLabel] = useState("Dashboard Snapshot")
  const [expiresInDays, setExpiresInDays] = useState(7)
  const [includeIncome, setIncludeIncome] = useState(true)
  const [includeSpending, setIncludeSpending] = useState(true)
  const [includeLoans, setIncludeLoans] = useState(true)

  const fetchShares = async () => {
    try {
      const res = await fetch(`/api/share?userId=${encodeURIComponent(userId)}`)
      const data = await res.json()
      if (res.ok) setShares(data.shares || [])
    } catch {
      console.error("Failed to fetch shares")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (userId) fetchShares()
  }, [userId])

  const createShare = async () => {
    setCreating(true)
    try {
      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          label,
          expiresInDays,
          includeIncome,
          includeSpending,
          includeLoans,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        const shareUrl = `${window.location.origin}${data.shareUrl}`
        await navigator.clipboard.writeText(shareUrl)
        toast({ title: "Share link created!", description: "Link copied to clipboard." })
        fetchShares()
      }
    } catch {
      toast({ title: "Error", description: "Failed to create share link.", variant: "destructive" })
    } finally {
      setCreating(false)
    }
  }

  const copyLink = async (token: string) => {
    const url = `${window.location.origin}/shared/${token}`
    await navigator.clipboard.writeText(url)
    toast({ title: "Copied!", description: "Share link copied to clipboard." })
  }

  const deleteShare = async (token: string) => {
    try {
      await fetch(`/api/share?token=${token}&userId=${encodeURIComponent(userId)}`, { method: "DELETE" })
      toast({ title: "Revoked", description: "Share link has been revoked." })
      fetchShares()
    } catch {
      toast({ title: "Error", description: "Failed to revoke share.", variant: "destructive" })
    }
  }

  const isExpired = (dateStr: string) => new Date(dateStr) < new Date()

  return (
    <Card className="glow-card backdrop-blur shadow-lg border-white/20 dark:border-gray-700/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
          <Share2 className="h-5 w-5 text-blue-500" />
          Dashboard Sharing
        </CardTitle>
        <CardDescription className="text-gray-600 dark:text-gray-300">
          Generate read-only links for stakeholders and investors
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Create new share */}
        <Card className="border-2 border-dashed border-blue-300 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-950/20">
          <CardContent className="p-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-gray-700 dark:text-gray-300">Label</Label>
                <Input
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="Dashboard Snapshot"
                  className="bg-white dark:bg-gray-700 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs text-gray-700 dark:text-gray-300">Expires in (days)</Label>
                <Input
                  type="number"
                  value={expiresInDays}
                  onChange={(e) => setExpiresInDays(Number(e.target.value))}
                  min={1}
                  max={90}
                  className="bg-white dark:bg-gray-700 text-sm"
                />
              </div>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <label className="flex items-center gap-2">
                <Switch checked={includeIncome} onCheckedChange={setIncludeIncome} />
                <span className="text-gray-700 dark:text-gray-300">Income</span>
              </label>
              <label className="flex items-center gap-2">
                <Switch checked={includeSpending} onCheckedChange={setIncludeSpending} />
                <span className="text-gray-700 dark:text-gray-300">Spending</span>
              </label>
              <label className="flex items-center gap-2">
                <Switch checked={includeLoans} onCheckedChange={setIncludeLoans} />
                <span className="text-gray-700 dark:text-gray-300">Loans</span>
              </label>
            </div>
            <Button
              onClick={createShare}
              disabled={creating}
              size="sm"
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
            >
              <Link className="h-4 w-4 mr-1" />
              {creating ? "Creating..." : "Generate Share Link"}
            </Button>
          </CardContent>
        </Card>

        {/* Existing shares */}
        {!loading && shares.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Active Share Links</h4>
            {shares.map((share) => {
              const expired = isExpired(share.expiresAt)
              return (
                <div
                  key={share.token}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    expired
                      ? "bg-gray-50 dark:bg-gray-800/40 border-gray-200 dark:border-gray-700 opacity-60"
                      : "bg-white dark:bg-gray-800/80 border-gray-200 dark:border-gray-700"
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-white truncate">{share.label}</span>
                      {expired && <Badge variant="secondary" className="text-[10px]">Expired</Badge>}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-[10px] text-gray-500">
                      <span className="flex items-center gap-0.5">
                        <Eye className="h-3 w-3" />
                        {share.viewCount} views
                      </span>
                      <span>Expires {new Date(share.expiresAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    {!expired && (
                      <>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => copyLink(share.token)} title="Copy link">
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => window.open(`/shared/${share.token}`, "_blank")}
                          title="Open"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-red-500 hover:text-red-700"
                      onClick={() => deleteShare(share.token)}
                      title="Revoke"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {!loading && shares.length === 0 && (
          <p className="text-center text-sm text-gray-500 py-2">No share links created yet.</p>
        )}
      </CardContent>
    </Card>
  )
}
