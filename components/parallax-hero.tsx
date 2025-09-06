"use client"

import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef } from 'react'
import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles } from 'lucide-react'

export function ParallaxHero() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  })

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"])
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])
  const scale = useTransform(scrollYProgress, [0, 0.3], [1, 0.8])

  return (
    <motion.div
      ref={containerRef}
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      style={{ y, opacity }}
    >
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-purple-900 to-cyan-900">
        <div className="absolute inset-0 opacity-10">
          <div className="w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
        </div>
      </div>

      {/* Floating geometric shapes */}
      <motion.div
        className="absolute top-20 left-20 w-32 h-32 border-2 border-white/20 rounded-full"
        animate={{
          rotate: 360,
          scale: [1, 1.1, 1],
        }}
        transition={{
          rotate: { duration: 20, repeat: Infinity, ease: "linear" },
          scale: { duration: 4, repeat: Infinity, ease: "easeInOut" }
        }}
      />
      <motion.div
        className="absolute bottom-32 right-32 w-24 h-24 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-lg rotate-45"
        animate={{
          rotate: [45, 135, 45],
          y: [0, -20, 0],
        }}
        transition={{
          rotate: { duration: 8, repeat: Infinity, ease: "easeInOut" },
          y: { duration: 4, repeat: Infinity, ease: "easeInOut" }
        }}
      />

      {/* Main content */}
      <motion.div
        className="relative z-10 text-center px-4 max-w-6xl mx-auto"
        style={{ scale }}
      >
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="mb-8"
        >
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-6">
            <Sparkles className="w-4 h-4 mr-2 text-cyan-400" />
            <span className="text-sm font-medium text-white">AI-Powered Business Intelligence</span>
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4 }}
          className="text-6xl md:text-8xl font-bold text-white mb-6 leading-tight"
        >
          Transform Your
          <br />
          <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
            Business Vision
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.6 }}
          className="text-xl md:text-2xl text-white/90 mb-12 max-w-3xl mx-auto leading-relaxed"
        >
          Harness the power of artificial intelligence to transform your business data into
          actionable insights. Make smarter decisions, optimize performance, and accelerate growth.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.8 }}
          className="flex flex-col sm:flex-row gap-6 justify-center items-center"
        >
          <Button
            size="lg"
            className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-8 py-4 text-lg font-semibold rounded-full shadow-2xl hover:shadow-cyan-500/25 transition-all duration-300 group"
            onClick={() => window.location.href = "/login"}
          >
            Get Started Free
            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Button>

          <Button
            size="lg"
            variant="outline"
            className="border-white/30 text-white hover:bg-white/10 bg-transparent px-8 py-4 text-lg font-semibold rounded-full backdrop-blur-sm"
            onClick={() => window.location.href = "/signup"}
          >
            Watch Demo
          </Button>
        </motion.div>

        
      </motion.div>

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
    </motion.div>
  )
}
