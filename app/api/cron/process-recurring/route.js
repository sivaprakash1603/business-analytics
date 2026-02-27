import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongo"

// POST - Process all due recurring transactions and create actual entries
// Called by cron job or manually
export async function POST(req) {
  try {
    const body = await req.json()
    const { secret } = body

    // Verify cron secret (optional — can be called manually from the UI too)
    if (secret && secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const db = await connectToDatabase()
    const now = new Date()

    // Find all active recurring transactions that are due
    const dueTransactions = await db
      .collection("recurring_transactions")
      .find({
        isActive: true,
        nextDue: { $lte: now.toISOString() },
        $or: [{ endDate: null }, { endDate: { $gte: now.toISOString() } }],
      })
      .toArray()

    let processed = 0
    const results = []

    for (const txn of dueTransactions) {
      try {
        // Create the actual income or spending entry
        const entry = {
          userId: txn.userId,
          amount: txn.amount,
          date: now.toISOString(),
          createdAt: now.toISOString(),
          recurringId: txn._id.toString(),
          currency: txn.currency || "USD",
        }

        if (txn.type === "income") {
          entry.source = txn.name
          if (txn.category) entry.category = txn.category
          await db.collection("income").insertOne(entry)
        } else {
          entry.reason = txn.name
          if (txn.category) entry.category = txn.category
          await db.collection("spending").insertOne(entry)
        }

        // Calculate the next due date
        const nextDue = calculateNextDue(txn.nextDue, txn.frequency)

        // Update the recurring transaction
        await db.collection("recurring_transactions").updateOne(
          { _id: txn._id },
          {
            $set: {
              lastProcessed: now.toISOString(),
              nextDue: nextDue,
            },
          }
        )

        processed++
        results.push({
          id: txn._id.toString(),
          name: txn.name,
          type: txn.type,
          amount: txn.amount,
          nextDue,
        })
      } catch (err) {
        console.error(`Error processing recurring txn ${txn._id}:`, err)
        results.push({
          id: txn._id.toString(),
          name: txn.name,
          error: err.message,
        })
      }
    }

    return NextResponse.json({
      success: true,
      processed,
      total: dueTransactions.length,
      results,
    })
  } catch (error) {
    console.error("Error processing recurring transactions:", error)
    return NextResponse.json({ error: "Failed to process recurring transactions" }, { status: 500 })
  }
}

function calculateNextDue(currentDue, frequency) {
  const date = new Date(currentDue)
  switch (frequency) {
    case "daily":
      date.setDate(date.getDate() + 1)
      break
    case "weekly":
      date.setDate(date.getDate() + 7)
      break
    case "biweekly":
      date.setDate(date.getDate() + 14)
      break
    case "monthly":
      date.setMonth(date.getMonth() + 1)
      break
    case "quarterly":
      date.setMonth(date.getMonth() + 3)
      break
    case "yearly":
      date.setFullYear(date.getFullYear() + 1)
      break
    default:
      date.setMonth(date.getMonth() + 1)
  }
  return date.toISOString()
}
