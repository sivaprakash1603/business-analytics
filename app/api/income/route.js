import { connectToDatabase } from "@/lib/mongo"

export async function POST(req) {
  try {
    const { source, amount, date, clientId, userId } = await req.json()
    if (!source || !amount || !date || !userId) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400 })
    }
    const db = await connectToDatabase()
    const incomeCollection = db.collection("income")
    const result = await incomeCollection.insertOne({
      source,
      amount,
      date,
      userId,
      clientId: clientId || null,
      createdAt: new Date().toISOString(),
    })
    return new Response(JSON.stringify({ success: true, id: result.insertedId }), { status: 201 })
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
