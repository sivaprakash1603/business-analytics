"use client"

import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { BarChart3, TrendingUp, Users, Brain, Sparkles, Target, Shield, Zap, ArrowRight, Star, Award, Globe } from "lucide-react"
import { ParallaxHero } from "@/components/parallax-hero"
import { FloatingElements } from "@/components/floating-elements"
import { MagazineCard } from "@/components/magazine-card"
import { ScrollSection, StaggeredGrid } from "@/components/scroll-section"
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-purple-900 to-cyan-900">
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent"></div>
          <div className="absolute inset-0 rounded-full border-4 border-cyan-400 border-t-transparent animate-spin animation-reverse animation-duration-1500"></div>
        </div>
      </div>
    )
  }

  const features = [
    {
      icon: BarChart3,
      title: "Advanced Analytics",
      description: "Real-time business intelligence with predictive analytics and trend forecasting powered by AI.",
      gradient: "from-blue-500 to-cyan-500",
      badge: "AI-Powered"
    },
    {
      icon: Users,
      title: "Client Intelligence",
      description: "Deep insights into client behavior, churn prediction, and relationship optimization.",
      gradient: "from-purple-500 to-pink-500",
      badge: "Smart CRM"
    },
    {
      icon: TrendingUp,
      title: "Revenue Optimization",
      description: "Maximize profitability with automated recommendations and strategic insights.",
      gradient: "from-green-500 to-emerald-500",
      badge: "Growth Focus"
    },
    {
      icon: Brain,
      title: "AI Insights Engine",
      description: "Conversational AI that understands your business and provides actionable recommendations.",
      gradient: "from-orange-500 to-red-500",
      badge: "GPT-5 Ready"
    },
    {
      icon: Target,
      title: "Goal Achievement",
      description: "Set intelligent goals and track progress with automated milestone celebrations.",
      gradient: "from-indigo-500 to-purple-500",
      badge: "Achievement"
    },
    {
      icon: Shield,
      title: "Enterprise Security",
      description: "Bank-level encryption and compliance with industry security standards.",
      gradient: "from-gray-500 to-slate-500",
      badge: "Secure"
    },
    {
      icon: Zap,
      title: "Real-time Sync",
      description: "Instant updates across all devices with seamless data synchronization.",
      gradient: "from-yellow-500 to-orange-500",
      badge: "Live"
    },
    {
      icon: Sparkles,
      title: "Smart Automation",
      description: "Automate repetitive tasks and focus on strategic decision-making.",
      gradient: "from-cyan-500 to-blue-500",
      badge: "Automated"
    },
  ]

  const testimonials = [
    {
      name: "Sarah Chen",
      company: "TechStart Inc.",
      role: "CEO",
      content: "This platform transformed how we understand our business. The AI insights are incredibly accurate and actionable.",
      rating: 5
    },
    {
      name: "Marcus Rodriguez",
      company: "Growth Dynamics",
      role: "Operations Director",
      content: "The predictive analytics helped us identify at-risk clients before it was too late. Saved us thousands.",
      rating: 5
    },
    {
      name: "Emily Watson",
      company: "Innovate Labs",
      role: "Founder",
      content: "Finally, a business analytics tool that speaks our language. The AI chat feature is a game-changer.",
      rating: 5
    }
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Floating 3D Elements Background */}
      <FloatingElements />

      {/* Parallax Hero Section */}
      <ParallaxHero />

      {/* Features Section */}
      <ScrollSection background="bg-gradient-to-b from-background to-muted/20">
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-5xl font-bold mb-6 bg-gradient-to-r from-gray-900 via-blue-800 to-cyan-800 dark:from-white dark:via-blue-200 dark:to-cyan-200 bg-clip-text text-transparent"
          >
            Revolutionary Features
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            className="text-xl text-muted-foreground max-w-3xl mx-auto"
          >
            Experience the future of business intelligence with cutting-edge AI technology
            and immersive data visualization
          </motion.p>
        </div>

        <StaggeredGrid className="max-w-7xl mx-auto">
          {features.map((feature, index) => (
            <MagazineCard
              key={index}
              title={feature.title}
              description={feature.description}
              icon={feature.icon}
              badge={feature.badge}
              gradient={feature.gradient}
              delay={index * 0.1}
            />
          ))}
        </StaggeredGrid>
      </ScrollSection>

      {/* Stats Section */}
      <ScrollSection background="bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600">
        <div className="text-center text-white">
          <motion.h2
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-4xl font-bold mb-12"
          >
            Trusted by Industry Leaders
          </motion.h2>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { number: "10,000+", label: "Active Users", icon: Users },
              { number: "500+", label: "Companies", icon: Globe },
              { number: "98%", label: "Satisfaction", icon: Award }
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <stat.icon className="w-12 h-12 mx-auto mb-4 text-cyan-200" />
                <div className="text-4xl font-bold mb-2">{stat.number}</div>
                <div className="text-cyan-100">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </ScrollSection>

      {/* Testimonials Section */}
      <ScrollSection background="bg-background">
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-4xl font-bold mb-6 gradient-text"
          >
            What Our Users Say
          </motion.h2>
        </div>

        <StaggeredGrid className="max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-white/80 to-white/40 dark:from-gray-900/80 dark:to-gray-900/40 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20"
            >
              <div className="flex mb-4">
                {Array.from({ length: testimonial.rating }, (_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-700 dark:text-gray-300 mb-6 italic">
                "{testimonial.content}"
              </p>
              <div>
                <div className="font-semibold text-gray-900 dark:text-white">
                  {testimonial.name}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {testimonial.role} at {testimonial.company}
                </div>
              </div>
            </motion.div>
          ))}
        </StaggeredGrid>
      </ScrollSection>

      {/* Final CTA Section */}
      <ScrollSection background="bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
        <div className="text-center text-white">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto"
          >
            <h2 className="text-5xl font-bold mb-6">
              Ready to Transform Your Business?
            </h2>
            <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
              Join thousands of businesses already using our AI-powered analytics platform
              to make smarter decisions and drive unprecedented growth.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Button
                size="lg"
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-8 py-4 text-lg font-semibold rounded-full shadow-2xl hover:shadow-cyan-500/25 transition-all duration-300 group"
                onClick={() => router.push("/signup")}
              >
                Start Free Trial
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>

              <Button
                size="lg"
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10 bg-transparent px-8 py-4 text-lg font-semibold rounded-full backdrop-blur-sm"
                onClick={() => router.push("/login")}
              >
                Sign In
              </Button>
            </div>
          </motion.div>
        </div>
      </ScrollSection>
    </div>
  )
}
