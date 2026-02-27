import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongo"
import { ObjectId } from "mongodb"

// GET - Fetch receipts for a user, optionally by entryId
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get("userId")
    const entryId = searchParams.get("entryId")
    const entryType = searchParams.get("entryType") // "income" or "spending"

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 })
    }

    const db = await connectToDatabase()
    const query = { userId }
    if (entryId) query.entryId = entryId
    if (entryType) query.entryType = entryType

    const receipts = await db
      .collection("receipts")
      .find(query)
      .sort({ createdAt: -1 })
      .toArray()

    return NextResponse.json({
      receipts: receipts.map((r) => ({
        ...r,
        id: r._id.toString(),
        // Don't send full data blob in list view — just metadata
        data: undefined,
        hasData: !!r.data,
      })),
    })
  } catch (error) {
    console.error("Error fetching receipts:", error)
    return NextResponse.json({ error: "Failed to fetch receipts" }, { status: 500 })
  }
}

// POST - Upload a receipt (stores as base64 in MongoDB)
export async function POST(req) {
  try {
    const body = await req.json()
    const { userId, entryId, entryType, fileName, fileType, fileSize, data, description } = body

    if (!userId || !fileName || !data) {
      return NextResponse.json(
        { error: "userId, fileName, and data are required" },
        { status: 400 }
      )
    }

    // Validate file size (max 5MB when base64 encoded ~ 6.67MB string)
    if (data.length > 7_000_000) {
      return NextResponse.json({ error: "File too large. Maximum 5MB." }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = [
      "image/jpeg", "image/png", "image/gif", "image/webp",
      "application/pdf", "image/svg+xml",
    ]
    if (fileType && !allowedTypes.includes(fileType)) {
      return NextResponse.json(
        { error: "Unsupported file type. Allowed: JPEG, PNG, GIF, WebP, PDF, SVG." },
        { status: 400 }
      )
    }

    const db = await connectToDatabase()
    const doc = {
      userId,
      entryId: entryId || null,
      entryType: entryType || null, // "income" or "spending"
      fileName,
      fileType: fileType || "application/octet-stream",
      fileSize: fileSize || 0,
      data, // base64-encoded file content
      description: description || "",
      createdAt: new Date().toISOString(),
    }

    const result = await db.collection("receipts").insertOne(doc)
    return NextResponse.json({ success: true, id: result.insertedId.toString() })
  } catch (error) {
    console.error("Error uploading receipt:", error)
    return NextResponse.json({ error: "Failed to upload receipt" }, { status: 500 })
  }
}

// PUT - Get full receipt data (separate endpoint to avoid loading blobs in list)
export async function PUT(req) {
  try {
    const body = await req.json()
    const { id, userId, action } = body

    if (!id || !userId) {
      return NextResponse.json({ error: "id and userId are required" }, { status: 400 })
    }

    const db = await connectToDatabase()

    if (action === "get-data") {
      // Fetch full receipt with data
      const receipt = await db
        .collection("receipts")
        .findOne({ _id: new ObjectId(id), userId })
      if (!receipt) {
        return NextResponse.json({ error: "Receipt not found" }, { status: 404 })
      }
      return NextResponse.json({
        id: receipt._id.toString(),
        data: receipt.data,
        fileName: receipt.fileName,
        fileType: receipt.fileType,
      })
    }

    // Update description or entryId
    const { description, entryId, entryType } = body
    const updates = {}
    if (description !== undefined) updates.description = description
    if (entryId !== undefined) updates.entryId = entryId
    if (entryType !== undefined) updates.entryType = entryType

    const result = await db.collection("receipts").updateOne(
      { _id: new ObjectId(id), userId },
      { $set: { ...updates, updatedAt: new Date().toISOString() } }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Receipt not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating receipt:", error)
    return NextResponse.json({ error: "Failed to update receipt" }, { status: 500 })
  }
}

// DELETE - Delete a receipt
export async function DELETE(req) {
  try {
    const body = await req.json()
    const { id, userId } = body

    if (!id || !userId) {
      return NextResponse.json({ error: "id and userId are required" }, { status: 400 })
    }

    const db = await connectToDatabase()
    const result = await db
      .collection("receipts")
      .deleteOne({ _id: new ObjectId(id), userId })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Receipt not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting receipt:", error)
    return NextResponse.json({ error: "Failed to delete receipt" }, { status: 500 })
  }
}
