import { connectToDatabase } from "@/lib/mongo"
import { ObjectId } from "mongodb"

export async function POST(req) {
  try {
    const body = await req.json()
    const { __encrypted } = body

    const db = await connectToDatabase()
    const incomeCollection = db.collection("income")

    if (__encrypted) {
      const { encrypted, userId, clientId } = body
      if (!encrypted || !userId) {
        return new Response(JSON.stringify({ error: "Missing encrypted payload or userId" }), { status: 400 })
      }
      const result = await incomeCollection.insertOne({
        __encrypted: true,
        encrypted,
        userId,
        clientId: clientId || null,
        createdAt: new Date().toISOString(),
      })
      return new Response(JSON.stringify({ success: true, id: result.insertedId }), { status: 201 })
    } else {
      const { source, amount, date, clientId, userId } = body
      if (!source || amount === undefined || !date || !userId) {
        return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400 })
      }
      const result = await incomeCollection.insertOne({
        source,
        amount,
        date,
        userId,
        clientId: clientId || null,
        createdAt: new Date().toISOString(),
      })
      return new Response(JSON.stringify({ success: true, id: result.insertedId }), { status: 201 })
    }
  } catch (err) {
    console.error("[API][Income][POST] Error:", err)
    return new Response(JSON.stringify({ error: "Failed to store income entry" }), { status: 500 })
  }
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get("userId")
    if (!userId) {
      return new Response(JSON.stringify({ error: "Missing userId" }), { status: 400 })
    }
    const db = await connectToDatabase()
    const incomeCollection = db.collection("income")
    const entries = await incomeCollection.find({ userId }).toArray()
    return new Response(JSON.stringify({ entries }), { status: 200 })
  } catch (err) {
    console.error("[API][Income][GET] Error:", err)
    return new Response(JSON.stringify({ error: "Failed to fetch income entries" }), { status: 500 })
  }
}

export async function PUT(req) {
  try {
    const body = await req.json()
    const { id, userId, __encrypted, encrypted } = body
    if (!id || !userId) {
      return new Response(JSON.stringify({ error: "Missing id or userId" }), { status: 400 })
    }
    const db = await connectToDatabase()
    const incomeCollection = db.collection("income")
    const setPayload = __encrypted ? { __encrypted: true, encrypted } : {}
    if (__encrypted && !encrypted) {
      return new Response(JSON.stringify({ error: "Missing encrypted payload" }), { status: 400 })
    }
    if (!__encrypted) {
      return new Response(JSON.stringify({ error: "Only encrypted updates are supported" }), { status: 400 })
    }
    const result = await incomeCollection.updateOne({ _id: new ObjectId(id), userId }, { $set: setPayload })
    if (result.modifiedCount === 0) {
      return new Response(JSON.stringify({ error: "Income entry not found or not updated" }), { status: 404 })
    }
    return new Response(JSON.stringify({ success: true }), { status: 200 })
  } catch (err) {
    console.error("[API][Income][PUT] Error:", err)
    return new Response(JSON.stringify({ error: "Failed to update income entry" }), { status: 500 })
  }
}
