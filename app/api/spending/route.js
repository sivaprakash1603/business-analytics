import { connectToDatabase } from "@/lib/mongo"
import { NextResponse } from "next/server"

export async function POST(req) {
  try {
    const { reason, amount, date, userId } = await req.json()
    if (!reason || amount === undefined || !date || !userId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }
    // Ensure amount is always a number
    const numericAmount = typeof amount === "string" ? Number.parseFloat(amount) : Number(amount)
    if (isNaN(numericAmount)) {
      return NextResponse.json({ error: "Amount must be a valid number" }, { status: 400 })
    }
    const db = await connectToDatabase()
    const spendingCollection = db.collection("spending")
    const result = await spendingCollection.insertOne({
      reason,
      amount: numericAmount,
      date,
      userId,
      createdAt: new Date().toISOString(),
    })
    return NextResponse.json({ success: true, id: result.insertedId }, { status: 201 })
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
