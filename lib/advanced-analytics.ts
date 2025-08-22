// Advanced Business Analytics Utilities

export interface ClientAnalysis {
  clientId: string;
  name: string;
  company: string;
  totalRevenue: number;
  totalTransactions: number;
  avgTransactionValue: number;
  lastTransactionDate: string;
  daysSinceLastTransaction: number;
  isAtRisk: boolean;
  riskLevel: 'low' | 'medium' | 'high';
  trend: 'growing' | 'stable' | 'declining';
  lifetimeValue: number;
}

export interface BusinessTrends {
  revenueGrowthRate: number;
  clientGrowthRate: number;
  averageTransactionTrend: number;
  seasonalPatterns: Array<{
    month: string;
    revenue: number;
    transactions: number;
  }>;
}

export interface RiskAnalysis {
  clientConcentrationRisk: number;
  topClientDependency: number;
  churnRisk: Array<{
    clientId: string;
    name: string;
    riskScore: number;
    reasons: string[];
  }>;
}

export function analyzeClients(incomeEntries: any[], clients: any[]): ClientAnalysis[] {
  const clientAnalysis: ClientAnalysis[] = [];

  clients.forEach(client => {
    const clientTransactions = incomeEntries.filter(entry => 
      entry.clientId === client.clientId || 
      entry.source.toLowerCase().includes(client.name.toLowerCase())
    );

    if (clientTransactions.length === 0) {
      clientAnalysis.push({
        clientId: client.clientId,
        name: client.name,
        company: client.company,
        totalRevenue: 0,
        totalTransactions: 0,
        avgTransactionValue: 0,
        lastTransactionDate: 'Never',
        daysSinceLastTransaction: Infinity,
        isAtRisk: true,
        riskLevel: 'high',
        trend: 'declining',
        lifetimeValue: 0
      });
      return;
    }

    const totalRevenue = clientTransactions.reduce((sum, t) => sum + t.amount, 0);
    const totalTransactions = clientTransactions.length;
    const avgTransactionValue = totalRevenue / totalTransactions;
    
    // Sort transactions by date
    const sortedTransactions = clientTransactions.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    const lastTransactionDate = sortedTransactions[0]?.date;
    const daysSinceLastTransaction = lastTransactionDate ? 
      Math.floor((Date.now() - new Date(lastTransactionDate).getTime()) / (1000 * 60 * 60 * 24)) : 
      Infinity;

    // Calculate trend (compare first half vs second half of transactions)
    let trend: 'growing' | 'stable' | 'declining' = 'stable';
    if (totalTransactions >= 4) {
      const midPoint = Math.floor(totalTransactions / 2);
      const recentHalf = sortedTransactions.slice(0, midPoint);
      const olderHalf = sortedTransactions.slice(midPoint);
      
      const recentAvg = recentHalf.reduce((sum, t) => sum + t.amount, 0) / recentHalf.length;
      const olderAvg = olderHalf.reduce((sum, t) => sum + t.amount, 0) / olderHalf.length;
      
      if (recentAvg > olderAvg * 1.1) trend = 'growing';
      else if (recentAvg < olderAvg * 0.9) trend = 'declining';
    }

    // Risk assessment
    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    let isAtRisk = false;

    if (daysSinceLastTransaction > 90) {
      riskLevel = 'high';
      isAtRisk = true;
    } else if (daysSinceLastTransaction > 60) {
      riskLevel = 'medium';
      isAtRisk = true;
    } else if (trend === 'declining') {
      riskLevel = 'medium';
      isAtRisk = true;
    }

    clientAnalysis.push({
      clientId: client.clientId,
      name: client.name,
      company: client.company,
      totalRevenue,
      totalTransactions,
      avgTransactionValue,
      lastTransactionDate,
      daysSinceLastTransaction,
      isAtRisk,
      riskLevel,
      trend,
      lifetimeValue: totalRevenue // Simple LTV calculation
    });
  });

  return clientAnalysis.sort((a, b) => b.totalRevenue - a.totalRevenue);
}

export function calculateBusinessTrends(incomeEntries: any[]): BusinessTrends {
  if (incomeEntries.length === 0) {
    return {
      revenueGrowthRate: 0,
      clientGrowthRate: 0,
      averageTransactionTrend: 0,
      seasonalPatterns: []
    };
  }

  // Sort by date
  const sortedEntries = incomeEntries.sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Calculate monthly patterns
  const monthlyData = new Map<string, { revenue: number; transactions: number }>();
  
  sortedEntries.forEach(entry => {
    const date = new Date(entry.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    const existing = monthlyData.get(monthKey) || { revenue: 0, transactions: 0 };
    monthlyData.set(monthKey, {
      revenue: existing.revenue + entry.amount,
      transactions: existing.transactions + 1
    });
  });

  const seasonalPatterns = Array.from(monthlyData.entries())
    .map(([month, data]) => ({
      month,
      revenue: data.revenue,
      transactions: data.transactions
    }))
    .sort((a, b) => a.month.localeCompare(b.month));

  // Calculate growth rates
  let revenueGrowthRate = 0;
  let averageTransactionTrend = 0;

  if (seasonalPatterns.length >= 2) {
    const firstMonth = seasonalPatterns[0];
    const lastMonth = seasonalPatterns[seasonalPatterns.length - 1];
    
    const monthsDifference = seasonalPatterns.length - 1;
    revenueGrowthRate = monthsDifference > 0 ? 
      ((lastMonth.revenue - firstMonth.revenue) / firstMonth.revenue) * 100 / monthsDifference : 0;
    
    const firstAvg = firstMonth.revenue / firstMonth.transactions;
    const lastAvg = lastMonth.revenue / lastMonth.transactions;
    averageTransactionTrend = ((lastAvg - firstAvg) / firstAvg) * 100;
  }

  return {
    revenueGrowthRate,
    clientGrowthRate: 0, // Would need client creation dates
    averageTransactionTrend,
    seasonalPatterns
  };
}

export function assessRisks(clientAnalysis: ClientAnalysis[], totalRevenue: number): RiskAnalysis {
  // Calculate client concentration risk
  const topClient = clientAnalysis[0];
  const topClientDependency = topClient ? (topClient.totalRevenue / totalRevenue) * 100 : 0;
  
  // Top 3 clients concentration
  const top3Revenue = clientAnalysis.slice(0, 3).reduce((sum, client) => sum + client.totalRevenue, 0);
  const clientConcentrationRisk = (top3Revenue / totalRevenue) * 100;

  // Identify at-risk clients
  const churnRisk = clientAnalysis
    .filter(client => client.isAtRisk)
    .map(client => {
      const reasons = [];
      if (client.daysSinceLastTransaction > 90) {
        reasons.push(`No transactions for ${client.daysSinceLastTransaction} days`);
      }
      if (client.trend === 'declining') {
        reasons.push('Declining transaction values');
      }
      if (client.totalTransactions === 0) {
        reasons.push('No transaction history');
      }

      return {
        clientId: client.clientId,
        name: client.name,
        riskScore: client.daysSinceLastTransaction > 90 ? 90 : 
                  client.trend === 'declining' ? 70 : 50,
        reasons
      };
    })
    .sort((a, b) => b.riskScore - a.riskScore);

  return {
    clientConcentrationRisk,
    topClientDependency,
    churnRisk
  };
}

export function generateInsightReport(
  clientAnalysis: ClientAnalysis[],
  trends: BusinessTrends,
  risks: RiskAnalysis,
  businessData: any
): string {
  const atRiskClients = clientAnalysis.filter(c => c.isAtRisk);
  const topPerformers = clientAnalysis.slice(0, 3).filter(c => c.totalRevenue > 0);
  
  let report = `📊 **ADVANCED BUSINESS ANALYTICS REPORT**\n\n`;

  // Executive Summary
  report += `🎯 **EXECUTIVE SUMMARY**\n`;
  report += `• Total Clients: ${clientAnalysis.length}\n`;
  report += `• Active Clients: ${clientAnalysis.filter(c => !c.isAtRisk).length}\n`;
  report += `• At-Risk Clients: ${atRiskClients.length}\n`;
  report += `• Client Concentration Risk: ${risks.clientConcentrationRisk.toFixed(1)}%\n\n`;

  // Client Performance Analysis
  if (topPerformers.length > 0) {
    report += `🏆 **TOP PERFORMING CLIENTS**\n`;
    topPerformers.forEach((client, index) => {
      const trendEmoji = client.trend === 'growing' ? '📈' : 
                        client.trend === 'declining' ? '📉' : '➖';
      report += `${index + 1}. ${client.name} (${client.company})\n`;
      report += `   • Revenue: $${client.totalRevenue.toLocaleString()}\n`;
      report += `   • Transactions: ${client.totalTransactions}\n`;
      report += `   • Avg Value: $${client.avgTransactionValue.toFixed(0)}\n`;
      report += `   • Trend: ${trendEmoji} ${client.trend}\n\n`;
    });
  }

  // Risk Analysis
  if (atRiskClients.length > 0) {
    report += `⚠️ **CLIENT RISK ANALYSIS**\n`;
    report += `${atRiskClients.length} clients need immediate attention:\n\n`;
    
    atRiskClients.slice(0, 5).forEach((client, index) => {
      const riskEmoji = client.riskLevel === 'high' ? '🔴' : '🟡';
      report += `${riskEmoji} **${client.name}** (${client.company})\n`;
      report += `   • Last transaction: ${client.daysSinceLastTransaction === Infinity ? 'Never' : `${client.daysSinceLastTransaction} days ago`}\n`;
      report += `   • Total value at risk: $${client.totalRevenue.toLocaleString()}\n`;
      report += `   • Action needed: ${client.daysSinceLastTransaction > 90 ? 'Immediate re-engagement' : 'Follow-up required'}\n\n`;
    });

    // Actionable recommendations
    report += `💡 **RETENTION STRATEGIES**\n`;
    report += `• Reach out to inactive clients (90+ days)\n`;
    report += `• Offer special promotions to declining clients\n`;
    report += `• Schedule regular check-ins with top clients\n`;
    report += `• Diversify client base to reduce concentration risk\n\n`;
  }

  // Business Trends
  if (trends.seasonalPatterns.length > 1) {
    report += `📈 **BUSINESS TRENDS**\n`;
    report += `• Revenue Growth Rate: ${trends.revenueGrowthRate.toFixed(1)}% per month\n`;
    report += `• Average Transaction Trend: ${trends.averageTransactionTrend.toFixed(1)}%\n`;
    
    const bestMonth = trends.seasonalPatterns.reduce((max, month) => 
      month.revenue > max.revenue ? month : max
    );
    report += `• Best performing month: ${bestMonth.month} ($${bestMonth.revenue.toLocaleString()})\n\n`;
  }

  // Strategic Recommendations
  report += `🎯 **STRATEGIC RECOMMENDATIONS**\n`;
  
  if (risks.topClientDependency > 30) {
    report += `• **High Client Concentration Risk** (${risks.topClientDependency.toFixed(1)}%)\n`;
    report += `  - Acquire new clients to reduce dependency\n`;
    report += `  - Develop multiple revenue streams\n\n`;
  }

  if (atRiskClients.length > clientAnalysis.length * 0.3) {
    report += `• **Client Retention Issues** (${((atRiskClients.length / clientAnalysis.length) * 100).toFixed(1)}% at risk)\n`;
    report += `  - Implement client success program\n`;
    report += `  - Regular satisfaction surveys\n`;
    report += `  - Proactive communication strategy\n\n`;
  }

  return report;
}
