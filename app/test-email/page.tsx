"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

export default function EmailTestPage() {
  const [to, setTo] = useState("")
  const [subject, setSubject] = useState("Test Email from Business Analytics Dashboard")
  const [message, setMessage] = useState("Hello! This is a test email from your business analytics application.")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const sendTestEmail = async () => {
    if (!to || !subject || !message) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: to,
          subject: subject,
          html: `<h2>${subject}</h2><p>${message}</p>`,
          text: message,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Success!",
          description: "Email sent successfully!",
        })
        setTo("")
        setMessage("Hello! This is a test email from your business analytics application.")
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to send email",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Network error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Gmail Email Test</CardTitle>
          <CardDescription>
            Test your Gmail integration. Make sure to configure your Gmail credentials in .env.local first.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="to">To Email Address</Label>
            <Input
              id="to"
              type="email"
              placeholder="recipient@example.com"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              rows={6}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          <Button onClick={sendTestEmail} disabled={isLoading} className="w-full">
            {isLoading ? "Sending..." : "Send Test Email"}
          </Button>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-2">Setup Instructions:</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Enable 2-factor authentication on your Gmail account</li>
              <li>Go to Google Account Settings → Security → 2-Step Verification → App passwords</li>
              <li>Generate an app password for "Mail" application</li>
              <li>Update .env.local with your Gmail address and the 16-character app password</li>
              <li>Restart your development server</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
