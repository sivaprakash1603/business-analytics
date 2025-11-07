import { ObjectId } from "mongodb"
import { NextResponse } from "next/server"

import { connectToDatabase } from "@/lib/mongo"

// GET: Fetch all loans for a user
export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get("userId")
  if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 })
  const db = await connectToDatabase()
  const loans = await db.collection("loans").find({ userId }).toArray()
  return NextResponse.json({ entries: loans })
}

// POST: Add a new loan
export async function POST(req) {
  const body = await req.json()
  const db = await connectToDatabase()
  if (body.__encrypted) {
    const { encrypted, isPaid = false, userId } = body
    if (!encrypted || !userId)
      return NextResponse.json({ error: "Missing encrypted payload or userId" }, { status: 400 })
    // Keep isPaid outside encryption to allow server-side toggling
    const result = await db.collection("loans").insertOne({ __encrypted: true, encrypted, isPaid, userId, createdAt: new Date().toISOString() })
    return NextResponse.json({ id: result.insertedId })
  } else {
    const { amount, description, isPaid, date, userId } = body
    if (!amount || !description || !date || !userId)
      return NextResponse.json({ error: "Missing fields" }, { status: 400 })
    const result = await db.collection("loans").insertOne({ amount, description, isPaid, date, userId })
    return NextResponse.json({ id: result.insertedId })
  }
}

// PUT: Mark loan as paid
export async function PUT(req) {
  const body = await req.json()
  const { id, userId, __encrypted, encrypted, isPaid } = body
  if (!id || !userId) {
    return NextResponse.json({ error: "Missing id or userId" }, { status: 400 })
  }
  const db = await connectToDatabase()
  if (__encrypted) {
    if (!encrypted) return NextResponse.json({ error: "Missing encrypted payload" }, { status: 400 })
    const result = await db.collection("loans").updateOne({ _id: new ObjectId(id), userId }, { $set: { __encrypted: true, encrypted } })
    if (result.modifiedCount === 0)
      return NextResponse.json({ error: "Loan not found or not updated" }, { status: 404 })
    return NextResponse.json({ success: true })
  }
  if (typeof isPaid === "boolean") {
    const result = await db.collection("loans").updateOne({ _id: new ObjectId(id), userId }, { $set: { isPaid } })
    if (result.modifiedCount === 0)
      return NextResponse.json({ error: "Loan not found or not updated" }, { status: 404 })
    return NextResponse.json({ success: true })
  }
  return NextResponse.json({ error: "Unsupported update payload" }, { status: 400 })
}

// DELETE: Delete a loan
export async function DELETE(req) {
  const body = await req.json()
  const { id, userId } = body
  if (!id || !userId)
    return NextResponse.json({ error: "Missing fields" }, { status: 400 })
  const db = await connectToDatabase()
  const result = await db.collection("loans").deleteOne({ _id: db.toObjectId(id), userId })
  if (result.deletedCount === 0)
    return NextResponse.json({ error: "Loan not found or not deleted" }, { status: 404 })
  return NextResponse.json({ success: true })
}
