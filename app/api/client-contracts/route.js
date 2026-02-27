import { connectToDatabase } from "@/lib/mongo"
import { ObjectId } from "mongodb"
import { NextResponse } from "next/server"

// GET /api/client-contracts?userId=xxx&clientId=xxx
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
    const contracts = await db
      .collection("client_contracts")
      .find(query)
      .sort({ createdAt: -1 })
      .toArray()
    return NextResponse.json({ contracts })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// POST /api/client-contracts — Create a new contract
// Body: { userId, clientId, title, type, value, startDate, endDate?, status, description?, notes? }
export async function POST(req) {
  try {
    const body = await req.json()
    const { userId, clientId, title, type, value, startDate, endDate, status, description, notes } = body
    if (!userId || !clientId || !title || !type) {
      return NextResponse.json(
        { error: "Missing required fields: userId, clientId, title, type" },
        { status: 400 }
      )
    }
    const validTypes = ["retainer", "project", "subscription", "one-time", "nda", "sla", "other"]
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${validTypes.join(", ")}` },
        { status: 400 }
      )
    }
    const validStatuses = ["draft", "active", "expired", "cancelled", "pending", "completed"]
    const contractStatus = status && validStatuses.includes(status) ? status : "draft"

    const db = await connectToDatabase()
    const doc = {
      userId,
      clientId,
      title,
      type,
      value: typeof value === "number" ? value : parseFloat(value) || 0,
      startDate: startDate || new Date().toISOString().split("T")[0],
      endDate: endDate || null,
      status: contractStatus,
      description: description || "",
      notes: notes || "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    const result = await db.collection("client_contracts").insertOne(doc)
    return NextResponse.json({ success: true, id: result.insertedId, contract: { ...doc, _id: result.insertedId } })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// PUT /api/client-contracts — Update a contract
export async function PUT(req) {
  try {
    const body = await req.json()
    const { id, userId, ...updates } = body
    if (!id || !userId) {
      return NextResponse.json({ error: "Missing id or userId" }, { status: 400 })
    }
    const allowedFields = ["title", "type", "value", "startDate", "endDate", "status", "description", "notes"]
    const setFields = {}
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        setFields[field] = field === "value" ? (typeof updates[field] === "number" ? updates[field] : parseFloat(updates[field]) || 0) : updates[field]
      }
    }
    if (Object.keys(setFields).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 })
    }
    setFields.updatedAt = new Date().toISOString()
    const db = await connectToDatabase()
    const result = await db.collection("client_contracts").updateOne(
      { _id: new ObjectId(id), userId },
      { $set: setFields }
    )
    if (result.modifiedCount === 0) {
      return NextResponse.json({ error: "Contract not found or not updated" }, { status: 404 })
    }
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// DELETE /api/client-contracts?id=xxx&userId=xxx
export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")
    const userId = searchParams.get("userId")
    if (!id || !userId) {
      return NextResponse.json({ error: "Missing id or userId" }, { status: 400 })
    }
    const db = await connectToDatabase()
    const result = await db.collection("client_contracts").deleteOne({
      _id: new ObjectId(id),
      userId,
    })
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 })
    }
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
