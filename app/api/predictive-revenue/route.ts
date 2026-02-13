import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongo"

// POST /api/predictive-revenue — Generate revenue forecast
export async function POST(request: NextRequest) {
  try {
    const { userId, forecastMonths } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 })
    }

    const db = await connectToDatabase()
    const incomeEntries = await db.collection("income").find({ userId }).toArray()

    const { generateRevenueForecast } = await import("@/lib/predictive-revenue")

    const forecast = generateRevenueForecast(incomeEntries, forecastMonths || 6)

    return NextResponse.json({ forecast })
  } catch (error: any) {
    console.error("Predictive revenue error:", error)
    return NextResponse.json(
      { error: "Failed to generate forecast", detail: error.message },
      { status: 500 }
    )
  }
}
