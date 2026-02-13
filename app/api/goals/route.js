import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongo"
import { ObjectId } from "mongodb"

// GET /api/goals?userId=xxx — Fetch all goals for user
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 })

    const db = await connectToDatabase()
    const goals = await db.collection("goals").find({ userId }).sort({ createdAt: -1 }).toArray()
    return NextResponse.json({ goals })
  } catch (err) {
    console.error("[API][Goals][GET]", err)
    return NextResponse.json({ error: "Failed to fetch goals" }, { status: 500 })
  }
}

// POST /api/goals — Create a new goal
export async function POST(request) {
  try {
    const body = await request.json()
    const { userId, title, type, target, startDate, endDate, milestones } = body

    if (!userId || !title || !type || !target) {
      return NextResponse.json({ error: "userId, title, type, target are required" }, { status: 400 })
    }

    const db = await connectToDatabase()
    const goal = {
      userId,
      title,
      type,          // 'revenue' | 'profit' | 'clients' | 'savings' | 'custom'
      target: Number(target),
      current: 0,
      startDate: startDate || new Date().toISOString(),
      endDate: endDate || null,
      milestones: milestones || [],  // [{ percent: 25, label: "Q1 Target", reached: false }]
      status: 'active', // 'active' | 'completed' | 'paused'
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const result = await db.collection("goals").insertOne(goal)
    return NextResponse.json({ success: true, goalId: result.insertedId })
  } catch (err) {
    console.error("[API][Goals][POST]", err)
    return NextResponse.json({ error: "Failed to create goal" }, { status: 500 })
  }
}

// PUT /api/goals — Update a goal
export async function PUT(request) {
  try {
    const body = await request.json()
    const { id, userId, ...updateFields } = body

    if (!id || !userId) {
      return NextResponse.json({ error: "id and userId required" }, { status: 400 })
    }

    const db = await connectToDatabase()
    const result = await db.collection("goals").updateOne(
      { _id: new ObjectId(id), userId },
      { $set: { ...updateFields, updatedAt: new Date().toISOString() } }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[API][Goals][PUT]", err)
    return NextResponse.json({ error: "Failed to update goal" }, { status: 500 })
  }
}

// DELETE /api/goals — Delete a goal
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    const userId = searchParams.get("userId")

    if (!id || !userId) {
      return NextResponse.json({ error: "id and userId required" }, { status: 400 })
    }

    const db = await connectToDatabase()
    await db.collection("goals").deleteOne({ _id: new ObjectId(id), userId })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[API][Goals][DELETE]", err)
    return NextResponse.json({ error: "Failed to delete goal" }, { status: 500 })
  }
}
