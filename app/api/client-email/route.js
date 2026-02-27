import { connectToDatabase } from "@/lib/mongo"
import { NextResponse } from "next/server"

// POST /api/client-email — Send email to a client and log it as activity
// Body: { userId, clientId, clientEmail, clientName, subject, body }
export async function POST(req) {
  try {
    const reqBody = await req.json()
    const { userId, clientId, clientEmail, clientName, subject, body: emailBody } = reqBody

    if (!userId || !clientId || !clientEmail || !subject || !emailBody) {
      return NextResponse.json(
        { error: "Missing required fields: userId, clientId, clientEmail, subject, body" },
        { status: 400 }
      )
    }

    // Send email via /api/send-email
    const gmailUser = process.env.GMAIL_USER
    if (!gmailUser) {
      return NextResponse.json(
        { error: "Email service not configured (GMAIL_USER missing)" },
        { status: 503 }
      )
    }

    // Build nicely formatted HTML email
    const html = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #3b82f6, #8b5cf6); padding: 24px 32px; border-radius: 12px 12px 0 0;">
          <h2 style="color: #fff; margin: 0; font-size: 20px;">${subject}</h2>
        </div>
        <div style="padding: 24px 32px; background: #ffffff; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
          <div style="white-space: pre-wrap; color: #374151; font-size: 15px; line-height: 1.6;">
${emailBody}
          </div>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">
            Sent from Business Analytics Dashboard
          </p>
        </div>
      </div>
    `

    // Use internal send-email API
    const origin = req.headers.get("origin") || req.headers.get("referer")?.replace(/\/[^/]*$/, "") || "http://localhost:3000"
    const emailRes = await fetch(`${origin}/api/send-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: clientEmail,
        subject,
        html,
        text: emailBody,
      }),
    })

    const emailResult = await emailRes.json()
    if (!emailRes.ok) {
      return NextResponse.json(
        { error: "Failed to send email", details: emailResult.error || emailResult.details },
        { status: 500 }
      )
    }

    // Log the email as a client activity
    const db = await connectToDatabase()
    const activityDoc = {
      userId,
      clientId,
      type: "email",
      title: `Email: ${subject}`,
      content: emailBody,
      metadata: {
        to: clientEmail,
        clientName: clientName || "",
        subject,
        messageId: emailResult.messageId || null,
        sentAt: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    }
    await db.collection("client_activity").insertOne(activityDoc)

    return NextResponse.json({
      success: true,
      messageId: emailResult.messageId,
      message: "Email sent and logged",
    })
  } catch (e) {
    console.error("[API][Client-Email] Error:", e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
