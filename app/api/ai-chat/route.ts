import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
});

export async function POST(req: Request) {
  try {
    const { message, businessData, context } = await req.json();

    if (!process.env.GEMINI_API_KEY) {
      console.warn('Gemini API key not found, falling back to rule-based responses');
      const response = generateEnhancedResponse(message, businessData, context);
      return NextResponse.json({ response });
    }

    // Use Gemini for AI responses
    const response = await generateGeminiResponse(message, businessData, context);
    
    return NextResponse.json({ response });
  } catch (error) {
    console.error('AI Chat API Error:', error);
    // Fallback to rule-based response if Gemini fails
    try {
      const { message, businessData, context } = await req.json();
      const fallbackResponse = generateEnhancedResponse(message, businessData, context);
      return NextResponse.json({ response: fallbackResponse });
    } catch {
      return NextResponse.json(
        { error: 'Failed to generate AI response' },
        { status: 500 }
      );
    }
  }
}

async function generateGeminiResponse(message: string, businessData: any, context: any[]): Promise<string> {
  try {
    // Create context from previous messages
    const conversationHistory = context
      .slice(-6) // Last 6 messages for context (3 pairs of user-ai)
      .map(msg => ({
        role: msg.type === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }],
      }));

    const chat = ai.chats.create({
      model: "gemini-2.0-flash-exp",
      history: [
        {
          role: "model",
          parts: [{ 
            text: `I am your expert business advisor AI assistant specializing in advanced analytics. I'll help you analyze your company's performance and make strategic decisions.

Your current business data:
- Total Income: $${businessData.totalIncome?.toLocaleString() || 0}
- Total Spending: $${businessData.totalSpending?.toLocaleString() || 0}
- Net Profit: $${(businessData.totalProfit || 0).toLocaleString()}
- Profit Margin: ${businessData.totalIncome > 0 ? ((businessData.totalProfit / businessData.totalIncome) * 100).toFixed(1) : 0}%
- Total Clients: ${businessData.clientCount || 0}
- Outstanding Loans: $${businessData.totalLoans?.toLocaleString() || 0}

Advanced Analytics Available:
${businessData.clientAnalysis ? `- Client Analysis: ${businessData.clientAnalysis.length} clients analyzed` : ''}
${businessData.atRiskClientsCount ? `- At-Risk Clients: ${businessData.atRiskClientsCount} clients need attention` : ''}
${businessData.riskAnalysis ? `- Client Concentration Risk: ${businessData.riskAnalysis.clientConcentrationRisk?.toFixed(1)}%` : ''}
${businessData.topClientName ? `- Top Client: ${businessData.topClientName} ($${businessData.topClientRevenue?.toLocaleString()})` : ''}

I can provide comprehensive analysis including:
🎯 Client churn prediction and risk assessment
📊 Business trend analysis and forecasting  
⚖️ Revenue concentration risk evaluation
🏆 Client performance ranking and insights
💡 Strategic recommendations based on data patterns

How can I help you today?` 
          }],
        },
        ...conversationHistory
      ],
    });

    const response = await chat.sendMessage({
      message: `Please analyze this business question: ${message}

Provide:
1. Specific analysis based on the actual data
2. Actionable recommendations with clear next steps
3. Use emojis and formatting for engagement
4. Keep response focused and practical (300-500 words)
5. Be direct but constructive about any concerns

Respond as a knowledgeable business consultant.`,
    });

    return response.text || "I apologize, but I couldn't generate a response. Please try again.";
  } catch (error) {
    console.error('Gemini API Error:', error);
    // Fallback to enhanced rule-based response
    return generateEnhancedResponse(message, businessData, context);
  }
}

function generateEnhancedResponse(message: string, businessData: any, context: any[]): string {
  const msg = message.toLowerCase();
  
  if (!businessData) {
    return "I'm still loading your business data. Please try again in a moment.";
  }

  // Enhanced profit analysis
  if (msg.includes("profit") || msg.includes("profitability")) {
    const profitMargin = businessData.totalIncome > 0 
      ? (businessData.totalProfit / businessData.totalIncome) * 100 
      : 0;
    
    const monthlyProfit = businessData.totalProfit / 12; // Assuming yearly data
    
    return `📊 **Profit Analysis**

Current Status:
• Profit Margin: ${profitMargin.toFixed(1)}%
• Total Profit: $${businessData.totalProfit.toLocaleString()}
• Estimated Monthly Profit: $${monthlyProfit.toFixed(0)}

${profitMargin > 20
  ? "🎉 Excellent! You have a healthy profit margin."
  : profitMargin > 10
    ? "✅ Good profit margin, but there's room for improvement."
    : profitMargin > 0
      ? "⚠️ Your profit margin is low. Action needed."
      : "🚨 Operating at a loss. Immediate intervention required."
}

**Actionable Recommendations:**
1. Analyze your top 3 expense categories
2. Review pricing strategy - consider 5-10% increase
3. Focus on high-margin services/products
4. Implement cost tracking by project/client
5. Negotiate better rates with suppliers

Would you like me to analyze any specific area in more detail?`;
  }

  // Enhanced cash flow analysis
  if (msg.includes("cash flow") || msg.includes("cash")) {
    const avgIncome = businessData.totalIncome / 12;
    const avgSpending = businessData.totalSpending / 12;
    const netCashFlow = avgIncome - avgSpending;
    
    return `💰 **Cash Flow Analysis**

Monthly Averages:
• Income: $${avgIncome.toFixed(0)}
• Spending: $${avgSpending.toFixed(0)}
• Net Cash Flow: $${netCashFlow.toFixed(0)}
• Outstanding Loans: $${businessData.totalLoans.toLocaleString()}

${netCashFlow > 0 
  ? "✅ Positive cash flow - good financial health" 
  : "⚠️ Negative cash flow - needs attention"}

**Cash Flow Optimization:**
1. Invoice immediately upon completion
2. Offer early payment discounts (2/10 net 30)
3. Set up automated payment reminders
4. Consider requiring deposits for large projects
5. Build 3-6 months expense reserve

**Next Steps:**
• Create cash flow forecast for next 6 months
• Identify seasonal patterns in your business
• Consider business credit line for smoothing cash flow`;
  }

  // Default enhanced response
  return `🤖 **AI Business Assistant**

I can help you analyze various aspects of your business:

📊 **Financial Analysis**
• "How are my profit margins?"
• "Analyze my cash flow"
• "What's my expense ratio?"

👥 **Client Management**
• "How can I improve client retention?"
• "What's my average revenue per client?"
• "Should I focus on new or existing clients?"

💡 **Growth Strategies**
• "How can I grow my business?"
• "What are my expansion opportunities?"
• "How can I increase revenue?"

📈 **Performance Insights**
• "What trends do you see in my data?"
• "Give me business recommendations"
• "How does my business compare to industry standards?"

What specific area would you like to explore? I'll provide detailed analysis based on your actual business data.`;
}
