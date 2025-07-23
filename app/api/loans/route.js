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
  const { amount, description, isPaid, date, userId } = body
  if (!amount || !description || !date || !userId)
    return NextResponse.json({ error: "Missing fields" }, { status: 400 })
  const db = await connectToDatabase()
  const result = await db.collection("loans").insertOne({ amount, description, isPaid, date, userId })
  return NextResponse.json({ id: result.insertedId })
}

// PUT: Mark loan as paid
export async function PUT(req) {
  const body = await req.json()
  const { id, isPaid, userId } = body
  if (!id || typeof isPaid !== "boolean" || !userId)
    return NextResponse.json({ error: "Missing fields" }, { status: 400 })
  const db = await connectToDatabase()
  const result = await db.collection("loans").updateOne({ _id: new ObjectId(id), userId }, { $set: { isPaid } })
  if (result.modifiedCount === 0)
    return NextResponse.json({ error: "Loan not found or not updated" }, { status: 404 })
  return NextResponse.json({ success: true })
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
