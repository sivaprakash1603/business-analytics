import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongo"

// POST /api/anomaly-detection — Run anomaly detection on user data
export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 })
    }

    const db = await connectToDatabase()

    const [incomeEntries, spendingEntries] = await Promise.all([
      db.collection("income").find({ userId }).toArray(),
      db.collection("spending").find({ userId }).toArray(),
    ])

    // Import and run detection (dynamic to keep route lightweight)
    const { runFullAnomalyDetection } = await import("@/lib/anomaly-detection")

    const alerts = runFullAnomalyDetection(incomeEntries, spendingEntries)

    return NextResponse.json({ alerts })
  } catch (error: any) {
    console.error("Anomaly detection error:", error)
    return NextResponse.json(
      { error: "Failed to run anomaly detection", detail: error.message },
      { status: 500 }
    )
  }
}
