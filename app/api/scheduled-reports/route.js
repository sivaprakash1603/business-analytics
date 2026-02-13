import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongo"
import { ObjectId } from "mongodb"

// GET /api/scheduled-reports?userId=xxx — List user's report schedules
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 })

    const db = await connectToDatabase()
    const schedules = await db.collection("report_schedules").find({ userId }).sort({ createdAt: -1 }).toArray()
    return NextResponse.json({ schedules })
  } catch (err) {
    console.error("[API][ScheduledReports][GET]", err)
    return NextResponse.json({ error: "Failed to fetch schedules" }, { status: 500 })
  }
}

// POST /api/scheduled-reports — Create a new schedule
export async function POST(request) {
  try {
    const body = await request.json()
    const { userId, email, frequency, reportType, enabled = true } = body

    if (!userId || !email || !frequency) {
      return NextResponse.json({ error: "userId, email, and frequency are required" }, { status: 400 })
    }

    const db = await connectToDatabase()

    const schedule = {
      userId,
      email,
      frequency,       // 'weekly' | 'monthly'
      reportType: reportType || "full",  // 'full' | 'income' | 'spending' | 'pl'
      enabled,
      lastSentAt: null,
      nextRunAt: computeNextRun(frequency),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const result = await db.collection("report_schedules").insertOne(schedule)
    return NextResponse.json({ success: true, scheduleId: result.insertedId })
  } catch (err) {
    console.error("[API][ScheduledReports][POST]", err)
    return NextResponse.json({ error: "Failed to create schedule" }, { status: 500 })
  }
}

// PUT /api/scheduled-reports — Update a schedule
export async function PUT(request) {
  try {
    const body = await request.json()
    const { id, userId, ...updateFields } = body

    if (!id || !userId) {
      return NextResponse.json({ error: "id and userId required" }, { status: 400 })
    }

    // Recompute nextRunAt if frequency changed
    if (updateFields.frequency) {
      updateFields.nextRunAt = computeNextRun(updateFields.frequency)
    }

    const db = await connectToDatabase()
    await db.collection("report_schedules").updateOne(
      { _id: new ObjectId(id), userId },
      { $set: { ...updateFields, updatedAt: new Date().toISOString() } }
    )

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[API][ScheduledReports][PUT]", err)
    return NextResponse.json({ error: "Failed to update schedule" }, { status: 500 })
  }
}

// DELETE /api/scheduled-reports — Delete a schedule
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    const userId = searchParams.get("userId")

    if (!id || !userId) {
      return NextResponse.json({ error: "id and userId required" }, { status: 400 })
    }

    const db = await connectToDatabase()
    await db.collection("report_schedules").deleteOne({ _id: new ObjectId(id), userId })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[API][ScheduledReports][DELETE]", err)
    return NextResponse.json({ error: "Failed to delete schedule" }, { status: 500 })
  }
}

function computeNextRun(frequency) {
  const now = new Date()
  if (frequency === "weekly") {
    // Next Monday at 8am UTC
    const next = new Date(now)
    next.setDate(now.getDate() + ((1 + 7 - now.getDay()) % 7 || 7))
    next.setHours(8, 0, 0, 0)
    return next.toISOString()
  }
  // Monthly: 1st of next month at 8am UTC
  const next = new Date(now.getFullYear(), now.getMonth() + 1, 1, 8, 0, 0, 0)
  return next.toISOString()
}
