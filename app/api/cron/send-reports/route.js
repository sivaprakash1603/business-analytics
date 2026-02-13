import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongo"

// POST /api/cron/send-reports — Called by Vercel Cron / GitHub Actions
// Authorization: Bearer ${CRON_SECRET}
export async function POST(request) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get("authorization")
    const cronSecret = process.env.CRON_SECRET
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const db = await connectToDatabase()
    const now = new Date()

    // Find all schedules that are due (enabled + nextRunAt <= now)
    const dueSchedules = await db.collection("report_schedules").find({
      enabled: true,
      nextRunAt: { $lte: now.toISOString() },
    }).toArray()

    if (dueSchedules.length === 0) {
      return NextResponse.json({ message: "No reports due", count: 0 })
    }

    const results = []

    for (const schedule of dueSchedules) {
      try {
        // Fetch user's financial data
        const income = await db.collection("income").find({
          userId: schedule.userId,
          __encrypted: { $ne: true }, // only non-encrypted
        }).toArray()

        const spending = await db.collection("spending").find({
          userId: schedule.userId,
          __encrypted: { $ne: true },
        }).toArray()

        const loans = await db.collection("loans").find({
          userId: schedule.userId,
          __encrypted: { $ne: true },
        }).toArray()

        // Fetch company name
        const user = await db.collection("user").findOne({ supabaseId: schedule.userId })
        const companyName = user?.companyName || "Your Business"

        // Calculate totals
        const totalIncome = income.reduce((s, e) => s + (Number(e.amount) || 0), 0)
        const totalSpending = spending.reduce((s, e) => s + (Number(e.amount) || 0), 0)
        const totalProfit = totalIncome - totalSpending
        const totalLoans = loans.filter(l => !l.isPaid).reduce((s, l) => s + (Number(l.amount) || 0), 0)

        // Get period label
        const periodLabel = schedule.frequency === "weekly"
          ? `Week of ${new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toLocaleDateString()} – ${now.toLocaleDateString()}`
          : `${new Date(now.getFullYear(), now.getMonth() - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" })}`

        // Top income sources
        const topSources = {}
        income.forEach(e => {
          const src = e.source || "Other"
          topSources[src] = (topSources[src] || 0) + (Number(e.amount) || 0)
        })
        const top5Income = Object.entries(topSources)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)

        // Top spending categories
        const topReasons = {}
        spending.forEach(e => {
          const r = e.reason || "Other"
          topReasons[r] = (topReasons[r] || 0) + (Number(e.amount) || 0)
        })
        const top5Spending = Object.entries(topReasons)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)

        // Build HTML email
        const html = buildReportEmail({
          companyName,
          periodLabel,
          frequency: schedule.frequency,
          totalIncome,
          totalSpending,
          totalProfit,
          totalLoans,
          profitMargin: totalIncome > 0 ? ((totalProfit / totalIncome) * 100).toFixed(1) : "0",
          incomeCount: income.length,
          spendingCount: spending.length,
          top5Income,
          top5Spending,
        })

        // Send email via send-email API
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL
          ? `https://${process.env.VERCEL_URL}`
          : "http://localhost:3000"

        const emailRes = await fetch(`${baseUrl}/api/send-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: schedule.email,
            subject: `📊 ${companyName} — ${schedule.frequency === "weekly" ? "Weekly" : "Monthly"} Financial Report`,
            html,
          }),
        })

        // Update schedule
        const nextRunAt = computeNextRun(schedule.frequency)
        await db.collection("report_schedules").updateOne(
          { _id: schedule._id },
          {
            $set: {
              lastSentAt: now.toISOString(),
              nextRunAt,
              updatedAt: now.toISOString(),
            },
          }
        )

        results.push({ email: schedule.email, status: emailRes.ok ? "sent" : "failed" })
      } catch (err) {
        console.error(`Failed to send report for ${schedule.email}:`, err)
        results.push({ email: schedule.email, status: "error", error: err.message })
      }
    }

    return NextResponse.json({ message: "Reports processed", count: dueSchedules.length, results })
  } catch (err) {
    console.error("[API][Cron][SendReports]", err)
    return NextResponse.json({ error: "Failed to process reports" }, { status: 500 })
  }
}

function computeNextRun(frequency) {
  const now = new Date()
  if (frequency === "weekly") {
    const next = new Date(now)
    next.setDate(now.getDate() + ((1 + 7 - now.getDay()) % 7 || 7))
    next.setHours(8, 0, 0, 0)
    return next.toISOString()
  }
  const next = new Date(now.getFullYear(), now.getMonth() + 1, 1, 8, 0, 0, 0)
  return next.toISOString()
}

function buildReportEmail({ companyName, periodLabel, frequency, totalIncome, totalSpending, totalProfit, totalLoans, profitMargin, incomeCount, spendingCount, top5Income, top5Spending }) {
  const isProfit = totalProfit >= 0

  const incomeRows = top5Income
    .map(([src, amt]) => `<tr><td style="padding:6px 12px;border-bottom:1px solid #f0f0f0">${src}</td><td style="padding:6px 12px;border-bottom:1px solid #f0f0f0;text-align:right;color:#10b981;font-weight:600">$${Number(amt).toLocaleString()}</td></tr>`)
    .join("")

  const spendingRows = top5Spending
    .map(([r, amt]) => `<tr><td style="padding:6px 12px;border-bottom:1px solid #f0f0f0">${r}</td><td style="padding:6px 12px;border-bottom:1px solid #f0f0f0;text-align:right;color:#ef4444;font-weight:600">$${Number(amt).toLocaleString()}</td></tr>`)
    .join("")

  return `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f7f8fa">
  <div style="max-width:600px;margin:0 auto;padding:20px">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#3b82f6,#8b5cf6);border-radius:12px 12px 0 0;padding:24px;text-align:center;color:white">
      <h1 style="margin:0 0 4px;font-size:20px">${companyName}</h1>
      <p style="margin:0;opacity:0.9;font-size:14px">${frequency === "weekly" ? "Weekly" : "Monthly"} Financial Report</p>
      <p style="margin:8px 0 0;opacity:0.7;font-size:12px">${periodLabel}</p>
    </div>

    <!-- Summary Cards -->
    <div style="background:white;padding:24px;border-radius:0 0 12px 12px;box-shadow:0 2px 8px rgba(0,0,0,0.05)">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td width="50%" style="padding:8px">
            <div style="background:#f0fdf4;border-radius:8px;padding:16px;text-align:center">
              <div style="font-size:12px;color:#6b7280">Total Income</div>
              <div style="font-size:24px;font-weight:700;color:#10b981">$${totalIncome.toLocaleString()}</div>
              <div style="font-size:11px;color:#9ca3af">${incomeCount} transactions</div>
            </div>
          </td>
          <td width="50%" style="padding:8px">
            <div style="background:#fef2f2;border-radius:8px;padding:16px;text-align:center">
              <div style="font-size:12px;color:#6b7280">Total Spending</div>
              <div style="font-size:24px;font-weight:700;color:#ef4444">$${totalSpending.toLocaleString()}</div>
              <div style="font-size:11px;color:#9ca3af">${spendingCount} transactions</div>
            </div>
          </td>
        </tr>
        <tr>
          <td width="50%" style="padding:8px">
            <div style="background:${isProfit ? '#eff6ff' : '#fef2f2'};border-radius:8px;padding:16px;text-align:center">
              <div style="font-size:12px;color:#6b7280">Net ${isProfit ? 'Profit' : 'Loss'}</div>
              <div style="font-size:24px;font-weight:700;color:${isProfit ? '#3b82f6' : '#ef4444'}">$${Math.abs(totalProfit).toLocaleString()}</div>
              <div style="font-size:11px;color:#9ca3af">${profitMargin}% margin</div>
            </div>
          </td>
          <td width="50%" style="padding:8px">
            <div style="background:#fff7ed;border-radius:8px;padding:16px;text-align:center">
              <div style="font-size:12px;color:#6b7280">Outstanding Loans</div>
              <div style="font-size:24px;font-weight:700;color:#f97316">$${totalLoans.toLocaleString()}</div>
            </div>
          </td>
        </tr>
      </table>

      ${incomeRows ? `
      <!-- Top Income -->
      <div style="margin-top:24px">
        <h3 style="font-size:14px;color:#374151;margin:0 0 12px">Top Income Sources</h3>
        <table width="100%" cellpadding="0" cellspacing="0" style="font-size:13px">
          ${incomeRows}
        </table>
      </div>
      ` : ''}

      ${spendingRows ? `
      <!-- Top Spending -->
      <div style="margin-top:20px">
        <h3 style="font-size:14px;color:#374151;margin:0 0 12px">Top Expenses</h3>
        <table width="100%" cellpadding="0" cellspacing="0" style="font-size:13px">
          ${spendingRows}
        </table>
      </div>
      ` : ''}

      <!-- Footer -->
      <div style="margin-top:24px;padding-top:16px;border-top:1px solid #e5e7eb;text-align:center;font-size:11px;color:#9ca3af">
        This report was auto-generated by your Business Analytics Dashboard.<br>
        You can manage your report schedule in Dashboard Settings.
      </div>
    </div>
  </div>
</body>
</html>`
}
