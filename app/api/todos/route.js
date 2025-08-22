import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongo"
import { ObjectId } from "mongodb"

// GET: Fetch all todos for a user
export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get("userId")
  if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 })
  const db = await connectToDatabase()
  const todos = await db.collection("todos").find({ userId }).toArray()
  return NextResponse.json({ entries: todos })
}

// POST: Add a new todo
export async function POST(req) {
  const body = await req.json()
  const { title, description, dueDate, dueTime, completed, createdAt, userId } = body
  if (!title || !dueDate || !dueTime || !createdAt || !userId)
    return NextResponse.json({ error: "Missing fields" }, { status: 400 })
  const db = await connectToDatabase()
  const result = await db.collection("todos").insertOne({ title, description, dueDate, dueTime, completed, createdAt, userId })
  return NextResponse.json({ id: result.insertedId })
}

// PUT: Update a todo (toggle completed, edit, etc)
export async function PUT(req) {
  const body = await req.json()
  const { id, ...updateFields } = body
  if (!id)
    return NextResponse.json({ error: "Missing id" }, { status: 400 })
  const db = await connectToDatabase()
  const result = await db.collection("todos").updateOne({ _id: new ObjectId(id) }, { $set: updateFields })
  if (result.modifiedCount === 0)
    return NextResponse.json({ error: "Todo not found or not updated" }, { status: 404 })
  return NextResponse.json({ success: true })
}

// DELETE: Delete a todo
export async function DELETE(req) {
  const body = await req.json()
  const { id } = body
  if (!id)
    return NextResponse.json({ error: "Missing id" }, { status: 400 })
  const db = await connectToDatabase()
  const result = await db.collection("todos").deleteOne({ _id: new ObjectId(id) })
  if (result.deletedCount === 0)
    return NextResponse.json({ error: "Todo not found or not deleted" }, { status: 404 })
  return NextResponse.json({ success: true })
}
