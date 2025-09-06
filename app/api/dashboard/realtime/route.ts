import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongo'

export async function GET() {
  try {
    const db = await connectToDatabase()

    // Get real-time data from various collections with optimized queries
    const [incomeData, spendingData, loanData, clientData] = await Promise.all([
      db.collection('income').find({}).sort({ date: -1 }).limit(5).toArray(), // Reduced from 10 to 5
      db.collection('spending').find({}).sort({ date: -1 }).limit(5).toArray(), // Reduced from 10 to 5
      db.collection('loans').find({ isPaid: false }).limit(5).toArray(), // Only unpaid loans, reduced limit
      db.collection('clients').countDocuments() // Use count instead of fetching all documents
    ])

    // Calculate real-time metrics
    const totalIncome = incomeData.reduce((sum: number, item: any) => sum + (item.amount || 0), 0)
    const totalSpending = spendingData.reduce((sum: number, item: any) => sum + (item.amount || 0), 0)
    const totalLoans = loanData.filter((loan: any) => !loan.isPaid).reduce((sum: number, loan: any) => sum + (loan.amount || 0), 0)
    const totalProfit = totalIncome - totalSpending

    // Get recent transactions (last 24 hours)
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)

    const recentIncome = incomeData.filter((item: any) => new Date(item.date) > yesterday)
    const recentSpending = spendingData.filter((item: any) => new Date(item.date) > yesterday)

    const realTimeData = {
      timestamp: new Date().toISOString(),
      summary: {
        totalIncome,
        totalSpending,
        totalProfit,
        totalLoans,
        clientCount: clientData, // clientData is now a count
        profitMargin: totalIncome > 0 ? (totalProfit / totalIncome) * 100 : 0
      },
      recentActivity: {
        income: recentIncome.length,
        spending: recentSpending.length,
        total: recentIncome.length + recentSpending.length
      },
      latestTransactions: {
        income: incomeData.slice(0, 3).map((item: any) => ({ // Reduced from 5 to 3
          id: item._id,
          source: item.source,
          amount: item.amount,
          date: item.date
        })),
        spending: spendingData.slice(0, 3).map((item: any) => ({ // Reduced from 5 to 3
          id: item._id,
          reason: item.reason,
          amount: item.amount,
          date: item.date
        }))
      },
      trends: {
        incomeTrend: calculateTrend(incomeData),
        spendingTrend: calculateTrend(spendingData),
        profitTrend: totalIncome > 0 ? ((totalProfit / totalIncome) * 100) : 0
      }
    }

    return NextResponse.json(realTimeData, {
      headers: {
        'Cache-Control': 'private, max-age=30', // Cache for 30 seconds
      }
    })
  } catch (error) {
    console.error('Real-time data fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch real-time data' },
      { status: 500 }
    )
  }
}

function calculateTrend(data: any[]): number {
  if (data.length < 2) return 0

  const recent = data.slice(0, Math.min(5, data.length))
  const older = data.slice(Math.min(5, data.length), Math.min(10, data.length))

  const recentAvg = recent.reduce((sum, item) => sum + (item.amount || 0), 0) / recent.length
  const olderAvg = older.length > 0 ? older.reduce((sum, item) => sum + (item.amount || 0), 0) / older.length : recentAvg

  if (olderAvg === 0) return 0
  return ((recentAvg - olderAvg) / olderAvg) * 100
}
