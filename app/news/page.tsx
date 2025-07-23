"use client"

import DashboardLayout from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
} from "lucide-react"
import { motion } from "framer-motion"
import { NewsApiService, type NewsArticle } from "@/components/news-api-service"
import { useAuth } from "@/components/auth-provider"

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
      <motion.div className="space-y-6" variants={containerVariants} initial="hidden" animate="visible">
        {/* Header Section */}
        <motion.div variants={itemVariants}>
          <Card className="gradient-bg text-white border-0 overflow-hidden">
            <CardContent className="p-8">
              <div className="flex items-center justify-between">
                <div>
                  <motion.h1
                    className="text-3xl font-bold mb-2 flex items-center gap-3"
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                  >
                    <Newspaper className="h-8 w-8" />
                    Business News & Insights
                  </motion.h1>
                  <motion.p
                    className="text-white/90 text-lg"
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                  >
                    Stay updated with the latest business trends, industry news, and market insights
                  </motion.p>
                </div>
                <Button
                  onClick={fetchAllNews}
                  disabled={loading}
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30"
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
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh News
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats Cards */}
        <motion.div className="grid grid-cols-1 md:grid-cols-4 gap-6" variants={containerVariants}>
          <motion.div variants={itemVariants}>
            <Card className="glow-card hover:scale-105 transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Articles</CardTitle>
                <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900">
                  <Newspaper className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{newsArticles.length}</div>
                <p className="text-xs text-muted-foreground mt-1">Available articles</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="glow-card hover:scale-105 transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Bookmarked</CardTitle>
                <div className="p-2 rounded-full bg-yellow-100 dark:bg-yellow-900">
                  <Bookmark className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {bookmarkedArticles.length}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Saved articles</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="glow-card hover:scale-105 transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Today's News</CardTitle>
                <div className="p-2 rounded-full bg-green-100 dark:bg-green-900">
                  <Clock className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {
                    newsArticles.filter((article) => {
                      const today = new Date().toDateString()
                      const articleDate = new Date(article.publishedAt).toDateString()
                      return today === articleDate
                    }).length
                  }
                </div>
                <p className="text-xs text-muted-foreground mt-1">Published today</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="glow-card hover:scale-105 transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Sources</CardTitle>
                <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900">
                  <Globe className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {new Set(newsArticles.map((article) => article.source.name)).size}
                </div>
                <p className="text-xs text-muted-foreground mt-1">News sources</p>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Search and Filters */}
        <motion.div variants={itemVariants}>
          <Card className="glow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Search & Filters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search articles, sources, or topics..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-40">
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
                    <SelectTrigger className="w-40">
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
          <Card className="glow-card">
            <CardContent className="p-6">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="all" className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    All News
                  </TabsTrigger>
                  <TabsTrigger value="company" className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Company Related
                  </TabsTrigger>
                  <TabsTrigger value="bookmarked" className="flex items-center gap-2">
                    <Bookmark className="h-4 w-4" />
                    Bookmarked
                  </TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab} className="space-y-4">
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="loading-dots">
                        <div className="dot"></div>
                        <div className="dot"></div>
                        <div className="dot"></div>
                      </div>
                    </div>
                  ) : displayArticles.length > 0 ? (
                    <div className="grid gap-6">
                      {displayArticles.map((article, index) => (
                        <motion.div
                          key={`${article.title}-${index}`}
                          className="group"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                        >
                          <Card className="glow-card hover:scale-[1.02] transition-all duration-300 cursor-pointer">
                            <CardContent className="p-6">
                              <div className="flex gap-6">
                                <div className="flex-shrink-0">
                                  <img
                                    src={article.urlToImage || "/placeholder.svg?height=120&width=200"}
                                    alt={article.title}
                                    className="w-48 h-32 object-cover rounded-lg"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement
                                      target.src = "/placeholder.svg?height=120&width=200"
                                    }}
                                  />
                                </div>
                                <div className="flex-1 space-y-3">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <h3
                                        className="text-xl font-semibold line-clamp-2 group-hover:text-blue-600 transition-colors cursor-pointer"
                                        onClick={() => window.open(article.url, "_blank")}
                                      >
                                        {article.title}
                                      </h3>
                                      <p className="text-muted-foreground mt-2 line-clamp-3">{article.description}</p>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        toggleBookmark(article.title)
                                      }}
                                      className={`ml-4 ${
                                        bookmarkedArticles.includes(article.title)
                                          ? "text-yellow-600 hover:text-yellow-700"
                                          : "text-muted-foreground hover:text-yellow-600"
                                      }`}
                                    >
                                      <Bookmark
                                        className={`h-4 w-4 ${
                                          bookmarkedArticles.includes(article.title) ? "fill-current" : ""
                                        }`}
                                      />
                                    </Button>
                                  </div>

                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                      <div className="flex items-center gap-1">
                                        <Globe className="h-3 w-3" />
                                        <span className="font-medium">{article.source.name}</span>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        <span>{getTimeAgo(article.publishedAt)}</span>
                                      </div>
                                    </div>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => window.open(article.url, "_blank")}
                                      className="flex items-center gap-1"
                                    >
                                      <ExternalLink className="h-3 w-3" />
                                      Read More
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
                    <div className="text-center py-12">
                      <Newspaper className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">
                        {activeTab === "bookmarked"
                          ? "No bookmarked articles"
                          : activeTab === "company"
                            ? "No company-related news found"
                            : "No articles found"}
                      </h3>
                      <p className="text-muted-foreground">
                        {activeTab === "bookmarked"
                          ? "Start bookmarking articles to see them here."
                          : searchQuery
                            ? "Try adjusting your search terms or filters."
                            : "Check back later for new articles."}
                      </p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </DashboardLayout>
  )
}
