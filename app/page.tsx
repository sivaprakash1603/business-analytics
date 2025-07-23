"use client"

import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3, TrendingUp, Users, Brain, Sparkles, Target, Shield, Zap } from "lucide-react"
import { motion } from "framer-motion"

export default function HomePage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      router.push("/dashboard")
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-bg">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    )
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

  const features = [
    {
      icon: BarChart3,
      title: "Analytics Dashboard",
      description: "Track income, expenses, and profits with interactive charts and real-time insights",
    },
    {
      icon: Users,
      title: "Client Management",
      description: "Manage clients and track revenue from each source with detailed analytics",
    },
    {
      icon: TrendingUp,
      title: "Financial Tracking",
      description: "Monitor loans, payments, and financial obligations with smart alerts",
    },
    {
      icon: Brain,
      title: "AI Insights",
      description: "Get AI-powered suggestions to improve your business performance",
    },
    {
      icon: Target,
      title: "Goal Setting",
      description: "Set and track business goals with intelligent progress monitoring",
    },
    {
      icon: Shield,
      title: "Secure & Private",
      description: "Your business data is encrypted and stored securely with enterprise-grade security",
    },
    {
      icon: Zap,
      title: "Real-time Updates",
      description: "Get instant updates and notifications about your business metrics",
    },
    {
      icon: Sparkles,
      title: "Smart Automation",
      description: "Automate repetitive tasks and focus on growing your business",
    },
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <motion.div
        className="gradient-bg relative overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <div className="container mx-auto px-4 py-20">
          <motion.div className="text-center mb-16" variants={containerVariants} initial="hidden" animate="visible">
            <motion.h1 className="text-6xl font-bold text-white mb-6 leading-tight" variants={itemVariants}>
              Transform Your Business
              <br />
              <span className="text-cyan-200">with AI Analytics</span>
            </motion.h1>
            <motion.p className="text-xl text-white/90 mb-8 max-w-3xl mx-auto leading-relaxed" variants={itemVariants}>
              Harness the power of artificial intelligence to transform your business data into actionable insights.
              Make smarter decisions, optimize performance, and accelerate growth.
            </motion.p>
            <motion.div className="space-x-4" variants={itemVariants}>
              <Button
                size="lg"
                className="bg-white text-blue-600 hover:bg-white/90 px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                onClick={() => router.push("/login")}
              >
                Get Started Free
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white/10 bg-transparent px-8 py-3 text-lg font-semibold backdrop-blur-sm"
                onClick={() => router.push("/signup")}
              >
                Watch Demo
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>

      {/* Features Section */}
      <div className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold mb-4 gradient-text">Everything You Need to Succeed</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Comprehensive business analytics platform designed for modern entrepreneurs
            </p>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <motion.div key={index} variants={itemVariants}>
                  <Card className="glow-card h-full hover:scale-105 transition-all duration-300">
                    <CardHeader className="text-center pb-4">
                      <div className="mx-auto mb-4 p-3 rounded-full bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900 dark:to-cyan-900 w-fit">
                        <Icon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                      </div>
                      <CardTitle className="text-lg font-semibold">{feature.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <CardDescription className="text-center leading-relaxed">{feature.description}</CardDescription>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </motion.div>
        </div>
      </div>

      {/* CTA Section */}
      <motion.div
        className="gradient-bg py-20"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="container mx-auto px-4 text-center">
          <Card className="max-w-4xl mx-auto bg-white/10 backdrop-blur-lg border-white/20">
            <CardContent className="p-12">
              <motion.h2
                className="text-4xl font-bold text-white mb-6"
                initial={{ y: 20, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
              >
                Ready to Transform Your Business?
              </motion.h2>
              <motion.p
                className="text-xl text-white/90 mb-8 max-w-2xl mx-auto"
                initial={{ y: 20, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                viewport={{ once: true }}
              >
                Join thousands of businesses already using our AI-powered analytics platform to make smarter decisions
                and drive growth.
              </motion.p>
              <motion.div
                className="space-x-4"
                initial={{ y: 20, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true }}
              >
                <Button
                  size="lg"
                  className="bg-white text-blue-600 hover:bg-white/90 px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                  onClick={() => router.push("/signup")}
                >
                  Start Free Trial
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-white/10 bg-transparent px-8 py-3 text-lg font-semibold"
                  onClick={() => router.push("/login")}
                >
                  Sign In
                </Button>
              </motion.div>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </div>
  )
}
