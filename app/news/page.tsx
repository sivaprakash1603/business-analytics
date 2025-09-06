"use client"

import DashboardLayout from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import {
  Newspaper,
  Search,
  Filter,
  Bookmark,
  ExternalLink,
  Calendar,
  Building2,
  Globe,
  RefreshCw,
  Clock,
  TrendingUp,
  Star,
  Zap
} from "lucide-react"
import { motion } from "framer-motion"
import { NewsApiService, type NewsArticle } from "@/components/news-api-service"
import { useAuth } from "@/components/auth-provider"
import { MagazineCard } from "@/components/magazine-card"
import { FloatingElements } from "@/components/floating-elements"

export default function NewsPage() {
  const { user } = useAuth()
  const { toast } = useToast()

  const [newsArticles, setNewsArticles] = useState<NewsArticle[]>([])
  const [filteredArticles, setFilteredArticles] = useState<NewsArticle[]>([])
  const [bookmarkedArticles, setBookmarkedArticles] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [sortBy, setSortBy] = useState("publishedAt")
  const [activeTab, setActiveTab] = useState("all")

  // Load bookmarked articles from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("bookmarkedNews")
    if (saved) {
      setBookmarkedArticles(JSON.parse(saved))
    }
  }, [])

  // Save bookmarked articles to localStorage
  useEffect(() => {
    localStorage.setItem("bookmarkedNews", JSON.stringify(bookmarkedArticles))
  }, [bookmarkedArticles])

  // Fetch news on component mount
  useEffect(() => {
    fetchAllNews()
  }, [])

  // Filter articles based on search and category
  useEffect(() => {
    let filtered = newsArticles

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (article) =>
          article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          article.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          article.source.name.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter((article) => {
        const title = article.title.toLowerCase()
        const description = article.description?.toLowerCase() || ""

        switch (selectedCategory) {
          case "business":
            return title.includes("business") || description.includes("business")
          case "technology":
            return (
              title.includes("tech") ||
              title.includes("ai") ||
              title.includes("digital") ||
              description.includes("technology") ||
              description.includes("ai")
            )
          case "finance":
            return (
              title.includes("finance") ||
              title.includes("financial") ||
              title.includes("money") ||
              description.includes("finance") ||
              description.includes("financial")
            )
          case "analytics":
            return (
              title.includes("analytics") ||
              title.includes("data") ||
              title.includes("insight") ||
              description.includes("analytics") ||
              description.includes("data")
            )
          default:
            return true
        }
      })
    }

    // Sort articles
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "publishedAt":
          return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
        case "title":
          return a.title.localeCompare(b.title)
        case "source":
          return a.source.name.localeCompare(b.source.name)
        default:
          return 0
      }
    })

    setFilteredArticles(filtered)
  }, [newsArticles, searchQuery, selectedCategory, sortBy])

  const fetchAllNews = async () => {
    setLoading(true)
    try {
      const [businessNews, companyNews] = await Promise.all([
        NewsApiService.fetchTopBusinessNews(),
        NewsApiService.fetchBusinessNews(user?.companyName),
      ])

      // Combine and deduplicate articles
      const allArticles = [...businessNews, ...companyNews]
      const uniqueArticles = allArticles.filter(
        (article, index, self) => index === self.findIndex((a) => a.title === article.title),
      )

      setNewsArticles(uniqueArticles)
    } catch (error) {
      console.error("Error fetching news:", error)
      toast({
        title: "Error",
        description: "Failed to fetch news articles.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const toggleBookmark = (articleTitle: string) => {
    setBookmarkedArticles((prev) => {
      const isBookmarked = prev.includes(articleTitle)
      if (isBookmarked) {
        toast({
          title: "Bookmark Removed",
          description: "Article removed from bookmarks.",
        })
        return prev.filter((title) => title !== articleTitle)
      } else {
        toast({
          title: "Bookmark Added",
          description: "Article saved to bookmarks.",
        })
        return [...prev, articleTitle]
      }
    })
  }

  const getBookmarkedArticles = () => {
    return newsArticles.filter((article) => bookmarkedArticles.includes(article.title))
  }

  const getDisplayArticles = () => {
    switch (activeTab) {
      case "bookmarked":
        return getBookmarkedArticles()
      case "company":
        return filteredArticles.filter(
          (article) =>
            article.title.toLowerCase().includes(user?.companyName?.toLowerCase() || "") ||
            article.description?.toLowerCase().includes(user?.companyName?.toLowerCase() || ""),
        )
      default:
        return filteredArticles
    }
  }

  const getTimeAgo = (dateString: string) => {
    const now = new Date()
    const publishedDate = new Date(dateString)
    const diffInHours = Math.floor((now.getTime() - publishedDate.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) return "Just now"
    if (diffInHours < 24) return `${diffInHours}h ago`
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays}d ago`
    return publishedDate.toLocaleDateString()
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
      },
    },
  }

  const displayArticles = getDisplayArticles()

  return (
    <DashboardLayout>
      <div className="relative min-h-screen">
        <FloatingElements />

        <motion.div
          className="space-y-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Hero Section */}
          <motion.div variants={itemVariants}>
            <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md rounded-2xl p-8 text-gray-900 dark:text-white mb-8 overflow-hidden relative border border-white/20 dark:border-gray-700/20 shadow-xl">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <motion.h1
                      className="text-4xl font-bold mb-3 flex items-center gap-4"
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ duration: 0.6, delay: 0.2 }}
                    >
                      <Newspaper className="h-10 w-10" />
                      Business Intelligence Hub
                    </motion.h1>
                    <motion.p
                      className="text-gray-700 dark:text-gray-300 text-lg max-w-2xl"
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ duration: 0.6, delay: 0.3 }}
                    >
                      Stay ahead of market trends with real-time business news,
                      industry insights, and competitive intelligence from trusted sources.
                    </motion.p>
                  </div>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                  >
                    <Button
                      onClick={fetchAllNews}
                      disabled={loading}
                      className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white border-0 px-6 py-3 text-lg shadow-lg"
                      size="lg"
                    >
                      {loading ? (
                        <div className="loading-dots-small">
                          <div className="dot-small"></div>
                          <div className="dot-small"></div>
                          <div className="dot-small"></div>
                        </div>
                      ) : (
                        <>
                          <RefreshCw className="h-5 w-5 mr-2" />
                          Refresh News
                        </>
                      )}
                    </Button>
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Stats Cards */}
          <div className="mb-8">
            <div className="flex flex-col lg:flex-row gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                viewport={{ once: true }}
                className="flex-1"
              >
                <MagazineCard
                  title="Total Articles"
                  value={newsArticles.length}
                  description="Business news available"
                  icon={Newspaper}
                  gradient="from-blue-500 to-cyan-500"
                  className="hover:scale-105 transition-all duration-300 h-full"
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                viewport={{ once: true }}
                className="flex-1"
              >
                <MagazineCard
                  title="Bookmarked"
                  value={bookmarkedArticles.length}
                  description="Saved for later reading"
                  icon={Bookmark}
                  gradient="from-yellow-500 to-orange-500"
                  className="hover:scale-105 transition-all duration-300 h-full"
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                viewport={{ once: true }}
                className="flex-1"
              >
                <MagazineCard
                  title="Today's News"
                  value={
                    newsArticles.filter((article) => {
                      const today = new Date().toDateString()
                      const articleDate = new Date(article.publishedAt).toDateString()
                      return today === articleDate
                    }).length
                  }
                  description="Fresh articles today"
                  icon={Clock}
                  gradient="from-green-500 to-emerald-500"
                  className="hover:scale-105 transition-all duration-300 h-full"
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                viewport={{ once: true }}
                className="flex-1"
              >
                <MagazineCard
                  title="News Sources"
                  value={new Set(newsArticles.map((article) => article.source.name)).size}
                  description="Trusted publications"
                  icon={Globe}
                  gradient="from-purple-500 to-pink-500"
                  className="hover:scale-105 transition-all duration-300 h-full"
                />
              </motion.div>
            </div>
          </div>

          {/* Search and Filters */}
          <motion.div variants={itemVariants}>
            <Card className="glow-card backdrop-blur-sm border-0 shadow-2xl">
                <CardHeader className="pb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500">
                      <Filter className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl font-bold">Smart Search & Filters</CardTitle>
                      <CardDescription className="text-lg">
                        Find exactly the business intelligence you need
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                          placeholder="Search articles, companies, or topics..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-12 text-lg py-4 border-2 focus:border-blue-500"
                        />
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger className="w-48 py-4 text-base">
                          <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Categories</SelectItem>
                          <SelectItem value="business">Business</SelectItem>
                          <SelectItem value="technology">Technology</SelectItem>
                          <SelectItem value="finance">Finance</SelectItem>
                          <SelectItem value="analytics">Analytics</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger className="w-48 py-4 text-base">
                          <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="publishedAt">Latest First</SelectItem>
                          <SelectItem value="title">Title A-Z</SelectItem>
                          <SelectItem value="source">Source A-Z</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

          {/* News Content */}
          <motion.div variants={itemVariants}>
            <Card className="glow-card backdrop-blur-sm border-0 shadow-2xl">
                <CardContent className="p-8">
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
                    <TabsList className="grid w-full grid-cols-3 h-14">
                      <TabsTrigger value="all" className="flex items-center gap-3 text-base py-4">
                        <Globe className="h-5 w-5" />
                        All News
                      </TabsTrigger>
                      <TabsTrigger value="company" className="flex items-center gap-3 text-base py-4">
                        <Building2 className="h-5 w-5" />
                        Company Related
                      </TabsTrigger>
                      <TabsTrigger value="bookmarked" className="flex items-center gap-3 text-base py-4">
                        <Bookmark className="h-5 w-5" />
                        Bookmarked
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value={activeTab} className="space-y-6">
                      {loading ? (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="flex items-center justify-center py-16"
                        >
                          <div className="text-center">
                            <div className="loading-dots mb-4">
                              <div className="dot"></div>
                              <div className="dot"></div>
                              <div className="dot"></div>
                            </div>
                            <p className="text-lg text-muted-foreground">Fetching latest business intelligence...</p>
                          </div>
                        </motion.div>
                      ) : displayArticles.length > 0 ? (
                        <div className="grid gap-8">
                          {displayArticles.map((article, index) => (
                            <motion.div
                              key={`${article.title}-${index}`}
                              className="group"
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.5, delay: index * 0.1 }}
                            >
                              <Card className="glow-card hover:scale-[1.02] transition-all duration-300 cursor-pointer overflow-hidden border-0 shadow-xl">
                                <CardContent className="p-8">
                                  <div className="flex gap-8">
                                    <div className="flex-shrink-0">
                                      <div className="relative">
                                        <img
                                          src={article.urlToImage || "/placeholder.svg?height=200&width=300"}
                                          alt={article.title}
                                          className="w-72 h-48 object-cover rounded-xl shadow-lg"
                                          onError={(e) => {
                                            const target = e.target as HTMLImageElement
                                            target.src = "/placeholder.svg?height=200&width=300"
                                          }}
                                        />
                                        <div className="absolute top-3 right-3">
                                          <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              toggleBookmark(article.title)
                                            }}
                                            className={`backdrop-blur-sm ${
                                              bookmarkedArticles.includes(article.title)
                                                ? "bg-yellow-500 text-white hover:bg-yellow-600"
                                                : "bg-white/80 hover:bg-white"
                                            }`}
                                          >
                                            <Bookmark
                                              className={`h-4 w-4 ${
                                                bookmarkedArticles.includes(article.title) ? "fill-current" : ""
                                              }`}
                                            />
                                          </Button>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex-1 space-y-4">
                                      <div className="space-y-3">
                                        <h3
                                          className="text-2xl font-bold line-clamp-2 group-hover:text-blue-600 transition-colors cursor-pointer leading-tight"
                                          onClick={() => window.open(article.url, "_blank")}
                                        >
                                          {article.title}
                                        </h3>
                                        <p className="text-muted-foreground text-lg line-clamp-3 leading-relaxed">
                                          {article.description}
                                        </p>
                                      </div>

                                      <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800">
                                        <div className="flex items-center gap-6 text-sm text-muted-foreground">
                                          <div className="flex items-center gap-2 font-medium">
                                            <Globe className="h-4 w-4" />
                                            <span className="text-base">{article.source.name}</span>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4" />
                                            <span className="text-base">{getTimeAgo(article.publishedAt)}</span>
                                          </div>
                                        </div>
                                        <Button
                                          onClick={() => window.open(article.url, "_blank")}
                                          className="gradient-bg text-white px-6 py-3 text-base font-medium"
                                          size="lg"
                                        >
                                          <ExternalLink className="h-4 w-4 mr-2" />
                                          Read Full Article
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            </motion.div>
                          ))}
                        </div>
                      ) : (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.5 }}
                          className="text-center py-16"
                        >
                          <Newspaper className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
                          <h3 className="text-2xl font-semibold mb-3">
                            {activeTab === "bookmarked"
                              ? "No bookmarked articles"
                              : activeTab === "company"
                                ? "No company-related news found"
                                : "No articles found"}
                          </h3>
                          <p className="text-muted-foreground text-lg mb-6 max-w-md mx-auto">
                            {activeTab === "bookmarked"
                              ? "Start bookmarking articles to see them here."
                              : searchQuery
                                ? "Try adjusting your search terms or filters."
                                : "Check back later for new business intelligence."}
                          </p>
                        </motion.div>
                      )}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </motion.div>
        </motion.div>
      </div>
    </DashboardLayout>
  )
}
