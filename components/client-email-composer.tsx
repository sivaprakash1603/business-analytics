"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Mail, Send, Loader2 } from "lucide-react"

interface ClientEmailComposerProps {
  userId: string
  clientId: string
  clientName: string
  clientEmail: string
  onSent?: () => void
}

export default function ClientEmailComposer({ userId, clientId, clientName, clientEmail, onSent }: ClientEmailComposerProps) {
  const [subject, setSubject] = useState("")
  const [body, setBody] = useState("")
  const [sending, setSending] = useState(false)
  const [showComposer, setShowComposer] = useState(false)
  const { toast } = useToast()

  const sendEmail = async () => {
    if (!subject.trim() || !body.trim()) {
      toast({ title: "Error", description: "Subject and body are required", variant: "destructive" })
      return
    }
    if (!clientEmail) {
      toast({ title: "Error", description: "No email address for this client", variant: "destructive" })
      return
    }
    setSending(true)
    try {
      const res = await fetch("/api/client-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          clientId,
          clientEmail,
          clientName,
          subject,
          body,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        toast({ title: "Sent!", description: `Email sent to ${clientName}` })
        setSubject("")
        setBody("")
        setShowComposer(false)
        onSent?.()
      } else {
        toast({ title: "Failed", description: data.error || "Could not send email", variant: "destructive" })
      }
    } catch {
      toast({ title: "Error", description: "Network error sending email", variant: "destructive" })
    } finally {
      setSending(false)
    }
  }

  if (!clientEmail) return null

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Mail className="h-4 w-4 text-purple-500" />
            Send Email
          </CardTitle>
          <Button
            size="sm"
            variant={showComposer ? "secondary" : "outline"}
            onClick={() => setShowComposer(!showComposer)}
            className="h-7 text-xs"
          >
            {showComposer ? "Close" : "Compose"}
          </Button>
        </div>
      </CardHeader>
      {showComposer && (
        <CardContent className="space-y-3 pt-0">
          <div className="p-3 rounded-lg border border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/20 space-y-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-medium">To:</span>
              <span>{clientName} &lt;{clientEmail}&gt;</span>
            </div>
            <div>
              <Label className="text-xs">Subject *</Label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Email subject..."
                className="h-8 text-xs"
              />
            </div>
            <div>
              <Label className="text-xs">Message *</Label>
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write your message..."
                rows={5}
                className="text-xs"
              />
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={sendEmail}
                disabled={sending}
                className="h-7 text-xs bg-purple-600 hover:bg-purple-700 text-white"
              >
                {sending ? (
                  <><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Sending...</>
                ) : (
                  <><Send className="h-3 w-3 mr-1" /> Send Email</>
                )}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowComposer(false)} className="h-7 text-xs">
                Cancel
              </Button>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  )
}
