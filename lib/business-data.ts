// Utility functions for business data analysis

export interface BusinessMetrics {
  totalIncome: number;
  totalSpending: number;
  totalProfit: number;
  totalLoans: number;
  clientCount: number;
  profitMargin: number;
  expenseRatio: number;
  avgRevenuePerClient: number;
}

export async function fetchBusinessData(userId: string): Promise<BusinessMetrics | null> {
  try {
    const [incomeRes, spendingRes, loansRes, clientsRes] = await Promise.all([
      fetch(`/api/income?userId=${userId}`),
      fetch(`/api/spending?userId=${userId}`),
      fetch(`/api/loans?userId=${userId}`),
      fetch(`/api/clients?userId=${userId}`)
    ]);

    const [incomeData, spendingData, loansData, clientsData] = await Promise.all([
      incomeRes.json(),
      spendingRes.json(),
      loansRes.json(),
      clientsRes.json()
    ]);

    const totalIncome = incomeData.income?.reduce((sum: number, entry: any) => sum + entry.amount, 0) || 0;
    const totalSpending = spendingData.spending?.reduce((sum: number, entry: any) => sum + entry.amount, 0) || 0;
    const totalLoans = loansData.loans?.filter((loan: any) => !loan.isPaid)
      .reduce((sum: number, loan: any) => sum + loan.amount, 0) || 0;
    const clientCount = clientsData.clients?.length || 0;

    const totalProfit = totalIncome - totalSpending;
    const profitMargin = totalIncome > 0 ? (totalProfit / totalIncome) * 100 : 0;
    const expenseRatio = totalIncome > 0 ? (totalSpending / totalIncome) * 100 : 0;
    const avgRevenuePerClient = clientCount > 0 ? totalIncome / clientCount : 0;

    return {
      totalIncome,
      totalSpending,
      totalProfit,
      totalLoans,
      clientCount,
      profitMargin,
      expenseRatio,
      avgRevenuePerClient
    };
  } catch (error) {
    console.error('Error fetching business data:', error);
    return null;
  }
}

export function generateInsights(metrics: BusinessMetrics) {
  const insights = [];

  if (metrics.profitMargin < 10) {
    insights.push({
      type: "warning",
      title: "Low Profit Margin",
      description: `Your profit margin is ${metrics.profitMargin.toFixed(1)}%. Consider cost optimization.`,
      priority: "high"
    });
  }

  if (metrics.expenseRatio > 80) {
    insights.push({
      type: "warning",
      title: "High Expense Ratio",
      description: "Expenses are very high relative to income. Immediate cost reduction needed.",
      priority: "high"
    });
  }

  if (metrics.clientCount < 5) {
    insights.push({
      type: "suggestion",
      title: "Client Diversification",
      description: "Consider expanding your client base to reduce dependency risk.",
      priority: "medium"
    });
  }

  if (metrics.profitMargin > 20) {
    insights.push({
      type: "positive",
      title: "Healthy Profit Margin",
      description: "Great job! Your business is performing well financially.",
      priority: "low"
    });
  }

  return insights;
}
