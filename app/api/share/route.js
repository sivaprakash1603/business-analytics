import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongo"
import crypto from "crypto"

// POST /api/share — Create a shareable link
export async function POST(request) {
  try {
    const body = await request.json()
    const { userId, expiresInDays = 7, includeIncome = true, includeSpending = true, includeLoans = true, label } = body

    if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 })

    const db = await connectToDatabase()

    // Generate unique share token
    const token = crypto.randomBytes(24).toString("hex")
    const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()

    const shareDoc = {
      userId,
      token,
      label: label || "Shared Dashboard",
      expiresAt,
      includeIncome,
      includeSpending,
      includeLoans,
      createdAt: new Date().toISOString(),
      viewCount: 0,
    }

    await db.collection("shares").insertOne(shareDoc)

    return NextResponse.json({
      success: true,
      token,
      expiresAt,
      shareUrl: `/shared/${token}`,
    })
  } catch (err) {
    console.error("[API][Share][POST]", err)
    return NextResponse.json({ error: "Failed to create share link" }, { status: 500 })
  }
}

// GET /api/share?token=xxx — Fetch shared data (public, no auth required)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get("token")
    const userId = searchParams.get("userId")

    // If userId is provided, list user's shares
    if (userId) {
      const db = await connectToDatabase()
      const shares = await db.collection("shares").find({ userId }).sort({ createdAt: -1 }).toArray()
      return NextResponse.json({ shares })
    }

    // If token is provided, fetch shared dashboard data
    if (!token) return NextResponse.json({ error: "token or userId required" }, { status: 400 })

    const db = await connectToDatabase()
    const share = await db.collection("shares").findOne({ token })

    if (!share) {
      return NextResponse.json({ error: "Share link not found or expired" }, { status: 404 })
    }

    // Check expiration
    if (new Date(share.expiresAt) < new Date()) {
      return NextResponse.json({ error: "This share link has expired" }, { status: 410 })
    }

    // Increment view count
    await db.collection("shares").updateOne({ token }, { $inc: { viewCount: 1 } })

    // Fetch the owner's data
    const data = {}

    if (share.includeIncome) {
      const entries = await db.collection("income").find({ userId: share.userId }).toArray()
      // Only return non-encrypted data for shares
      data.income = entries
        .filter(e => !e.__encrypted)
        .map(e => ({ source: e.source, amount: Number(e.amount) || 0, date: e.date }))
    }

    if (share.includeSpending) {
      const entries = await db.collection("spending").find({ userId: share.userId }).toArray()
      data.spending = entries
        .filter(e => !e.__encrypted)
        .map(e => ({ reason: e.reason, amount: Number(e.amount) || 0, date: e.date }))
    }

    if (share.includeLoans) {
      const entries = await db.collection("loans").find({ userId: share.userId }).toArray()
      data.loans = entries
        .filter(e => !e.__encrypted)
        .map(e => ({ description: e.description, amount: Number(e.amount) || 0, isPaid: e.isPaid, date: e.date }))
    }

    // Fetch company name
    const user = await db.collection("user").findOne({ supabaseId: share.userId })

    return NextResponse.json({
      label: share.label,
      companyName: user?.companyName || "",
      createdAt: share.createdAt,
      expiresAt: share.expiresAt,
      data,
    })
  } catch (err) {
    console.error("[API][Share][GET]", err)
    return NextResponse.json({ error: "Failed to fetch shared data" }, { status: 500 })
  }
}

// DELETE /api/share — Revoke a share link
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get("token")
    const userId = searchParams.get("userId")

    if (!token || !userId) return NextResponse.json({ error: "token and userId required" }, { status: 400 })

    const db = await connectToDatabase()
    await db.collection("shares").deleteOne({ token, userId })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[API][Share][DELETE]", err)
    return NextResponse.json({ error: "Failed to revoke share" }, { status: 500 })
  }
}
