import { connectToDatabase } from "@/lib/mongo"
import { ObjectId } from "mongodb"
import { NextResponse } from "next/server"

// GET /api/client-activity?userId=xxx&clientId=xxx — Get all activity for a client
// GET /api/client-activity?userId=xxx — Get all activity across all clients
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get("userId")
    const clientId = searchParams.get("clientId")
    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 })
    }
    const db = await connectToDatabase()
    const query = { userId }
    if (clientId) query.clientId = clientId
    const activities = await db
      .collection("client_activity")
      .find(query)
      .sort({ timestamp: -1 })
      .limit(200)
      .toArray()
    return NextResponse.json({ activities })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// POST /api/client-activity — Create a new activity entry
// Body: { userId, clientId, type, title, content, metadata? }
// type: "note" | "call" | "email" | "meeting" | "task" | "contract" | "other"
export async function POST(req) {
  try {
    const body = await req.json()
    const { userId, clientId, type, title, content, metadata } = body
    if (!userId || !clientId || !type || !title) {
      return NextResponse.json(
        { error: "Missing required fields: userId, clientId, type, title" },
        { status: 400 }
      )
    }
    const validTypes = ["note", "call", "email", "meeting", "task", "contract", "other"]
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${validTypes.join(", ")}` },
        { status: 400 }
      )
    }
    const db = await connectToDatabase()
    const doc = {
      userId,
      clientId,
      type,
      title,
      content: content || "",
      metadata: metadata || {},
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    }
    const result = await db.collection("client_activity").insertOne(doc)
    return NextResponse.json({ success: true, id: result.insertedId, activity: { ...doc, _id: result.insertedId } })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// PUT /api/client-activity — Update an activity entry
// Body: { id, userId, title?, content?, metadata? }
export async function PUT(req) {
  try {
    const body = await req.json()
    const { id, userId, ...updates } = body
    if (!id || !userId) {
      return NextResponse.json({ error: "Missing id or userId" }, { status: 400 })
    }
    const allowedFields = ["title", "content", "metadata"]
    const setFields = {}
    for (const field of allowedFields) {
      if (updates[field] !== undefined) setFields[field] = updates[field]
    }
    if (Object.keys(setFields).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 })
    }
    setFields.updatedAt = new Date().toISOString()
    const db = await connectToDatabase()
    const result = await db.collection("client_activity").updateOne(
      { _id: new ObjectId(id), userId },
      { $set: setFields }
    )
    if (result.modifiedCount === 0) {
      return NextResponse.json({ error: "Activity not found or not updated" }, { status: 404 })
    }
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// DELETE /api/client-activity?id=xxx&userId=xxx
export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")
    const userId = searchParams.get("userId")
    if (!id || !userId) {
      return NextResponse.json({ error: "Missing id or userId" }, { status: 400 })
    }
    const db = await connectToDatabase()
    const result = await db.collection("client_activity").deleteOne({
      _id: new ObjectId(id),
      userId,
    })
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Activity not found" }, { status: 404 })
    }
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
