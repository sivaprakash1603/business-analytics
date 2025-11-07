import { connectToDatabase } from "@/lib/mongo"
import { NextResponse } from "next/server"
import { ObjectId } from "mongodb"

export async function POST(req) {
  try {
    const body = await req.json()
    const db = await connectToDatabase()
    const spendingCollection = db.collection("spending")

    if (body.__encrypted) {
      const { encrypted, userId } = body
      if (!encrypted || !userId) {
        return NextResponse.json({ error: "Missing encrypted payload or userId" }, { status: 400 })
      }
      const result = await spendingCollection.insertOne({
        __encrypted: true,
        encrypted,
        userId,
        createdAt: new Date().toISOString(),
      })
      return NextResponse.json({ success: true, id: result.insertedId }, { status: 201 })
    } else {
      const { reason, amount, date, userId } = body
      if (!reason || amount === undefined || !date || !userId) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
      }
      // Ensure amount is always a number
      const numericAmount = typeof amount === "string" ? Number.parseFloat(amount) : Number(amount)
      if (isNaN(numericAmount)) {
        return NextResponse.json({ error: "Amount must be a valid number" }, { status: 400 })
      }
      const result = await spendingCollection.insertOne({
        reason,
        amount: numericAmount,
        date,
        userId,
        createdAt: new Date().toISOString(),
      })
      return NextResponse.json({ success: true, id: result.insertedId }, { status: 201 })
    }
  } catch (err) {
    console.error("[API][Spending][POST] Error:", err)
    return NextResponse.json({ error: "Failed to store spending entry" }, { status: 500 })
  }
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get("userId")
    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 })
    }
    const db = await connectToDatabase()
    const spendingCollection = db.collection("spending")
    let entries = await spendingCollection.find({ userId }).toArray()
    // Ensure all amounts are numbers (fix legacy string data)
    entries = entries.map(e => ({
      ...e,
      amount: typeof e.amount === "number" ? e.amount : Number.parseFloat(e.amount)
    }))
    // Log each entry for debugging
    console.log("[API][Spending][GET] Entries fetched:", entries.map(e => ({ reason: e.reason, amount: e.amount, type: typeof e.amount, date: e.date })))
    // Optionally, log if any amount is not a number
    const invalidAmounts = entries.filter(e => typeof e.amount !== "number" || isNaN(e.amount))
    if (invalidAmounts.length > 0) {
      console.warn("[API][Spending][GET] Invalid amount entries:", invalidAmounts)
    }
    return NextResponse.json({ entries }, { status: 200 })
  } catch (err) {
    console.error("[API][Spending][GET] Error:", err)
    return NextResponse.json({ error: "Failed to fetch spending entries" }, { status: 500 })
  }
}

export async function PUT(req) {
  try {
    const body = await req.json()
    const { id, userId, __encrypted, encrypted } = body
    if (!id || !userId) {
      return NextResponse.json({ error: "Missing id or userId" }, { status: 400 })
    }
    if (!__encrypted || !encrypted) {
      return NextResponse.json({ error: "Only encrypted updates supported and encrypted payload required" }, { status: 400 })
    }
    const db = await connectToDatabase()
    const spendingCollection = db.collection("spending")
    const result = await spendingCollection.updateOne({ _id: new ObjectId(id), userId }, { $set: { __encrypted: true, encrypted } })
    if (result.modifiedCount === 0) {
      return NextResponse.json({ error: "Spending entry not found or not updated" }, { status: 404 })
    }
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[API][Spending][PUT] Error:", err)
    return NextResponse.json({ error: "Failed to update spending entry" }, { status: 500 })
  }
}
