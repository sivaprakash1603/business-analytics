import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongo"
import { ObjectId } from "mongodb"

// GET - Fetch budgets for a user
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get("userId")
    const period = searchParams.get("period") // "monthly" or "quarterly"
    
    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 })
    }  
    const db = await connectToDatabase()
    const query = { userId }
    if (period) query.period = period

    const budgets = await db
      .collection("budgets")
      .find(query)
      .sort({ createdAt: -1 })
      .toArray()

    return NextResponse.json({
      budgets: budgets.map((b) => ({ ...b, id: b._id.toString() })),
    })
  } catch (error) {
    console.error("Error fetching budgets:", error)
    return NextResponse.json({ error: "Failed to fetch budgets" }, { status: 500 })
  }
}

// POST - Create or update a budget
export async function POST(req) {
  try {
    const body = await req.json()
    const { userId, category, targetAmount, period, month, quarter, year, alertThreshold } = body

    if (!userId || !category || !targetAmount || !period) {
      return NextResponse.json(
        { error: "userId, category, targetAmount, and period are required" },
        { status: 400 }
      )
    }

    const db = await connectToDatabase()

    // Check if budget already exists for this user+category+period+time
    const existQuery = { userId, category, period }
    if (period === "monthly") {
      existQuery.month = month || new Date().getMonth() + 1
      existQuery.year = year || new Date().getFullYear()
    } else {
      existQuery.quarter = quarter || Math.ceil((new Date().getMonth() + 1) / 3)
      existQuery.year = year || new Date().getFullYear()
    }

    const existing = await db.collection("budgets").findOne(existQuery)
    if (existing) {
      // Update existing budget
      await db.collection("budgets").updateOne(
        { _id: existing._id },
        {
          $set: {
            targetAmount: Number(targetAmount),
            alertThreshold: Number(alertThreshold) || 80,
            updatedAt: new Date().toISOString(),
          },
        }
      )
      return NextResponse.json({ success: true, id: existing._id.toString(), updated: true })
    }

    const doc = {
      userId,
      category,
      targetAmount: Number(targetAmount),
      period, // "monthly" or "quarterly"
      month: period === "monthly" ? (month || new Date().getMonth() + 1) : null,
      quarter: period === "quarterly" ? (quarter || Math.ceil((new Date().getMonth() + 1) / 3)) : null,
      year: year || new Date().getFullYear(),
      alertThreshold: Number(alertThreshold) || 80, // percentage at which to alert
      createdAt: new Date().toISOString(),
    }

    const result = await db.collection("budgets").insertOne(doc)
    return NextResponse.json({ success: true, id: result.insertedId.toString() })
  } catch (error) {
    console.error("Error creating budget:", error)
    return NextResponse.json({ error: "Failed to create budget" }, { status: 500 })
  }
}

// PUT - Update a budget
export async function PUT(req) {
  try {
    const body = await req.json()
    const { id, userId, ...updates } = body

    if (!id || !userId) {
      return NextResponse.json({ error: "id and userId are required" }, { status: 400 })
    }

    if (updates.targetAmount) updates.targetAmount = Number(updates.targetAmount)
    if (updates.alertThreshold) updates.alertThreshold = Number(updates.alertThreshold)

    const db = await connectToDatabase()
    const result = await db.collection("budgets").updateOne(
      { _id: new ObjectId(id), userId },
      { $set: { ...updates, updatedAt: new Date().toISOString() } }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Budget not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating budget:", error)
    return NextResponse.json({ error: "Failed to update budget" }, { status: 500 })
  }
}

// DELETE - Delete a budget
export async function DELETE(req) {
  try {
    const body = await req.json()
    const { id, userId } = body

    if (!id || !userId) {
      return NextResponse.json({ error: "id and userId are required" }, { status: 400 })
    }

    const db = await connectToDatabase()
    const result = await db
      .collection("budgets")
      .deleteOne({ _id: new ObjectId(id), userId })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Budget not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting budget:", error)
    return NextResponse.json({ error: "Failed to delete budget" }, { status: 500 })
  }
}
