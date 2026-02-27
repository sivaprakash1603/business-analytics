import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongo"
import { ObjectId } from "mongodb"

// GET - Fetch all recurring transactions for a user
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get("userId")
    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 })
    }
    const db = await connectToDatabase()
    const entries = await db
      .collection("recurring_transactions")
      .find({ userId })
      .sort({ createdAt: -1 })
      .toArray()
    return NextResponse.json({
      entries: entries.map((e) => ({ ...e, id: e._id.toString() })),
    })
  } catch (error) {
    console.error("Error fetching recurring transactions:", error)
    return NextResponse.json({ error: "Failed to fetch recurring transactions" }, { status: 500 })
  }
}

// POST - Create a new recurring transaction rule
export async function POST(req) {
  try {
    const body = await req.json()
    const { userId, type, name, amount, frequency, startDate, endDate, category, currency, isActive } = body

    if (!userId || !type || !name || !amount || !frequency) {
      return NextResponse.json(
        { error: "userId, type, name, amount, and frequency are required" },
        { status: 400 }
      )
    }

    const db = await connectToDatabase()
    const doc = {
      userId,
      type, // "income" or "spending"
      name,
      amount: Number(amount),
      frequency, // "daily", "weekly", "biweekly", "monthly", "quarterly", "yearly"
      startDate: startDate || new Date().toISOString(),
      endDate: endDate || null,
      category: category || null,
      currency: currency || "USD",
      isActive: isActive !== false,
      lastProcessed: null,
      nextDue: startDate || new Date().toISOString(),
      createdAt: new Date().toISOString(),
    }
    const result = await db.collection("recurring_transactions").insertOne(doc)
    return NextResponse.json({ success: true, id: result.insertedId.toString() })
  } catch (error) {
    console.error("Error creating recurring transaction:", error)
    return NextResponse.json({ error: "Failed to create recurring transaction" }, { status: 500 })
  }
}

// PUT - Update a recurring transaction
export async function PUT(req) {
  try {
    const body = await req.json()
    const { id, userId, ...updates } = body

    if (!id || !userId) {
      return NextResponse.json({ error: "id and userId are required" }, { status: 400 })
    }

    if (updates.amount) updates.amount = Number(updates.amount)

    const db = await connectToDatabase()
    const result = await db.collection("recurring_transactions").updateOne(
      { _id: new ObjectId(id), userId },
      { $set: { ...updates, updatedAt: new Date().toISOString() } }
    )
    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Recurring transaction not found" }, { status: 404 })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating recurring transaction:", error)
    return NextResponse.json({ error: "Failed to update recurring transaction" }, { status: 500 })
  }
}

// DELETE - Remove a recurring transaction
export async function DELETE(req) {
  try {
    const body = await req.json()
    const { id, userId } = body

    if (!id || !userId) {
      return NextResponse.json({ error: "id and userId are required" }, { status: 400 })
    }

    const db = await connectToDatabase()
    const result = await db
      .collection("recurring_transactions")
      .deleteOne({ _id: new ObjectId(id), userId })
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Recurring transaction not found" }, { status: 404 })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting recurring transaction:", error)
    return NextResponse.json({ error: "Failed to delete recurring transaction" }, { status: 500 })
  }
}
