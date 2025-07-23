"use client"

// News API Service - Replace with your actual API key
const NEWS_API_KEY = process.env.NEXT_PUBLIC_NEWS_API_KEY || "your-api-key-here"
const NEWS_API_BASE_URL = "https://newsapi.org/v2"

export interface NewsArticle {
  title: string
  description: string
  url: string
  urlToImage: string
  publishedAt: string
  source: {
    name: string
  }
}

export class NewsApiService {
  static async fetchBusinessNews(companyName?: string): Promise<NewsArticle[]> {
    try {
      // If no API key is provided, return mock data
      if (!NEWS_API_KEY || NEWS_API_KEY === "your-api-key-here") {
        return this.getMockNews()
      }

      const query = companyName
        ? `${companyName} OR business analytics OR financial technology`
        : "business analytics OR financial technology OR small business"

      const response = await fetch(
        `${NEWS_API_BASE_URL}/everything?q=${encodeURIComponent(query)}&sortBy=publishedAt&language=en&pageSize=20&apiKey=${NEWS_API_KEY}`,
      )

      if (!response.ok) {
        throw new Error("Failed to fetch news")
      }

      const data = await response.json()
      return data.articles || []
    } catch (error) {
      console.error("Error fetching news:", error)
      return this.getMockNews()
    }
  }

  static async fetchTopBusinessNews(): Promise<NewsArticle[]> {
    try {
      if (!NEWS_API_KEY || NEWS_API_KEY === "your-api-key-here") {
        return this.getMockTopNews()
      }

      const response = await fetch(
        `${NEWS_API_BASE_URL}/top-headlines?category=business&language=en&pageSize=20&apiKey=${NEWS_API_KEY}`,
      )

      if (!response.ok) {
        throw new Error("Failed to fetch top news")
      }

      const data = await response.json()
      return data.articles || []
    } catch (error) {
      console.error("Error fetching top news:", error)
      return this.getMockTopNews()
    }
  }

  static async fetchTechnologyNews(): Promise<NewsArticle[]> {
    try {
      if (!NEWS_API_KEY || NEWS_API_KEY === "your-api-key-here") {
        return this.getMockTechNews()
      }

      const response = await fetch(
        `${NEWS_API_BASE_URL}/everything?q=technology OR AI OR fintech OR digital transformation&sortBy=publishedAt&language=en&pageSize=15&apiKey=${NEWS_API_KEY}`,
      )

      if (!response.ok) {
        throw new Error("Failed to fetch technology news")
      }

      const data = await response.json()
      return data.articles || []
    } catch (error) {
      console.error("Error fetching technology news:", error)
      return this.getMockTechNews()
    }
  }

  private static getMockNews(): NewsArticle[] {
    return [
      {
        title: "AI-Powered Business Analytics Transforms Small Business Operations",
        description:
          "Small businesses are increasingly adopting AI-powered analytics tools to gain competitive advantages and make data-driven decisions that drive growth.",
        url: "https://example.com/ai-business-analytics",
        urlToImage: "/placeholder.svg?height=200&width=300",
        publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        source: { name: "Business Technology Today" },
      },
      {
        title: "Financial Dashboard Solutions See 300% Growth in SME Adoption",
        description:
          "The demand for comprehensive financial dashboard solutions has skyrocketed as small and medium enterprises seek better visibility into their financial performance.",
        url: "https://example.com/financial-dashboard-growth",
        urlToImage: "/placeholder.svg?height=200&width=300",
        publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        source: { name: "SME Finance Weekly" },
      },
      {
        title: "Cloud-Based Analytics Platforms Revolutionize Business Intelligence",
        description:
          "Modern cloud-based analytics platforms are making sophisticated business intelligence tools accessible to businesses of all sizes, democratizing data insights.",
        url: "https://example.com/cloud-analytics-revolution",
        urlToImage: "/placeholder.svg?height=200&width=300",
        publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        source: { name: "Cloud Computing News" },
      },
    ]
  }

  private static getMockTopNews(): NewsArticle[] {
    return [
      {
        title: "Global Markets Rally as Tech Stocks Lead Recovery",
        description:
          "Technology stocks are driving a broad market recovery as investors show renewed confidence in digital transformation initiatives across industries.",
        url: "https://example.com/market-rally",
        urlToImage: "/placeholder.svg?height=200&width=300",
        publishedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        source: { name: "Financial Times" },
      },
      {
        title: "Small Business Lending Reaches Record Highs in Q4",
        description:
          "Banks and alternative lenders are providing unprecedented levels of funding to small businesses, signaling strong confidence in the SME sector.",
        url: "https://example.com/lending-record",
        urlToImage: "/placeholder.svg?height=200&width=300",
        publishedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        source: { name: "Business Journal" },
      },
      {
        title: "Remote Work Policies Drive New Business Software Demand",
        description:
          "Companies are investing heavily in business management software as remote and hybrid work models become permanent fixtures in the corporate landscape.",
        url: "https://example.com/remote-work-software",
        urlToImage: "/placeholder.svg?height=200&width=300",
        publishedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        source: { name: "Tech Business Review" },
      },
    ]
  }

  private static getMockTechNews(): NewsArticle[] {
    return [
      {
        title: "Artificial Intelligence Adoption Accelerates in Financial Services",
        description:
          "Financial institutions are rapidly implementing AI solutions for fraud detection, risk assessment, and customer service automation.",
        url: "https://example.com/ai-financial-services",
        urlToImage: "/placeholder.svg?height=200&width=300",
        publishedAt: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(),
        source: { name: "FinTech Weekly" },
      },
      {
        title: "Blockchain Technology Gains Traction in Supply Chain Management",
        description:
          "Companies are leveraging blockchain for enhanced transparency and traceability in their supply chain operations.",
        url: "https://example.com/blockchain-supply-chain",
        urlToImage: "/placeholder.svg?height=200&width=300",
        publishedAt: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString(),
        source: { name: "Supply Chain Tech" },
      },
    ]
  }
}
