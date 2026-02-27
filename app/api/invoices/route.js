import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongo"
import { ObjectId } from "mongodb"

// GET - Fetch invoices for a user
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get("userId")
    const status = searchParams.get("status") // "draft", "sent", "paid", "overdue"
    const clientId = searchParams.get("clientId")

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 })
    }

    const db = await connectToDatabase()
    const query = { userId }
    if (status) query.status = status
    if (clientId) query.clientId = clientId

    const invoices = await db
      .collection("invoices")
      .find(query)
      .sort({ createdAt: -1 })
      .toArray()

    // Auto-update overdue invoices
    const now = new Date()
    const updated = invoices.map((inv) => {
      if (inv.status === "sent" && inv.dueDate && new Date(inv.dueDate) < now) {
        return { ...inv, status: "overdue", id: inv._id.toString() }
      }
      return { ...inv, id: inv._id.toString() }
    })

    return NextResponse.json({ invoices: updated })
  } catch (error) {
    console.error("Error fetching invoices:", error)
    return NextResponse.json({ error: "Failed to fetch invoices" }, { status: 500 })
  }
}

// POST - Create a new invoice
export async function POST(req) {
  try {
    const body = await req.json()
    const {
      userId,
      clientId,
      clientName,
      clientEmail,
      invoiceNumber,
      items,
      subtotal,
      tax,
      total,
      currency,
      dueDate,
      notes,
      status,
    } = body

    if (!userId || !clientName || !items || items.length === 0) {
      return NextResponse.json(
        { error: "userId, clientName, and at least one item are required" },
        { status: 400 }
      )
    }

    const db = await connectToDatabase()

    // Generate invoice number if not provided
    const invNumber =
      invoiceNumber ||
      `INV-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`

    const doc = {
      userId,
      clientId: clientId || null,
      clientName,
      clientEmail: clientEmail || null,
      invoiceNumber: invNumber,
      items: items.map((item) => ({
        description: item.description,
        quantity: Number(item.quantity) || 1,
        unitPrice: Number(item.unitPrice) || 0,
        total: (Number(item.quantity) || 1) * (Number(item.unitPrice) || 0),
      })),
      subtotal: Number(subtotal) || 0,
      tax: Number(tax) || 0,
      total: Number(total) || 0,
      currency: currency || "USD",
      dueDate: dueDate || null,
      notes: notes || "",
      status: status || "draft", // "draft", "sent", "paid", "overdue", "cancelled"
      paidDate: null,
      sentDate: null,
      createdAt: new Date().toISOString(),
    }

    const result = await db.collection("invoices").insertOne(doc)
    return NextResponse.json({ success: true, id: result.insertedId.toString(), invoiceNumber: invNumber })
  } catch (error) {
    console.error("Error creating invoice:", error)
    return NextResponse.json({ error: "Failed to create invoice" }, { status: 500 })
  }
}

// PUT - Update invoice status or details
export async function PUT(req) {
  try {
    const body = await req.json()
    const { id, userId, ...updates } = body

    if (!id || !userId) {
      return NextResponse.json({ error: "id and userId are required" }, { status: 400 })
    }

    // Handle status-specific updates
    if (updates.status === "paid" && !updates.paidDate) {
      updates.paidDate = new Date().toISOString()
    }
    if (updates.status === "sent" && !updates.sentDate) {
      updates.sentDate = new Date().toISOString()
    }

    const db = await connectToDatabase()
    const result = await db.collection("invoices").updateOne(
      { _id: new ObjectId(id), userId },
      { $set: { ...updates, updatedAt: new Date().toISOString() } }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating invoice:", error)
    return NextResponse.json({ error: "Failed to update invoice" }, { status: 500 })
  }
}

// DELETE - Delete an invoice
export async function DELETE(req) {
  try {
    const body = await req.json()
    const { id, userId } = body

    if (!id || !userId) {
      return NextResponse.json({ error: "id and userId are required" }, { status: 400 })
    }

    const db = await connectToDatabase()
    const result = await db
      .collection("invoices")
      .deleteOne({ _id: new ObjectId(id), userId })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting invoice:", error)
    return NextResponse.json({ error: "Failed to delete invoice" }, { status: 500 })
  }
}
