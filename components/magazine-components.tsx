"use client"

import { motion, useScroll, useSpring } from 'framer-motion'
import { useEffect, useState } from 'react'

export function ScrollProgress() {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  })

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 transform-origin-left z-50"
      style={{ scaleX }}
    />
  )
}

export function PageTransition({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-blue-900 via-purple-900 to-cyan-900 flex items-center justify-center z-50">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-white border-t-transparent rounded-full mx-auto mb-4"
          />
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-white text-xl font-semibold"
          >
            Loading Experience...
          </motion.h2>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      {children}
    </motion.div>
  )
}

export function MagazineGrid({ children, className = "" }: { children: React.ReactNode[], className?: string }) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 ${className}`}>
      {children.map((child, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.6,
            delay: index * 0.1,
            ease: "easeOut"
          }}
          viewport={{ once: true }}
          whileHover={{
            scale: 1.02,
            transition: { duration: 0.2 }
          }}
          className="magazine-hover"
        >
          {child}
        </motion.div>
      ))}
    </div>
  )
}

export function FloatingAction({ children, className = "" }: { children: React.ReactNode, className?: string }) {
  return (
    <motion.div
      className={`fixed bottom-6 right-6 z-40 ${className}`}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
    >
      <div className="relative">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 1, 0.5]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full blur-lg"
        />
        <div className="relative bg-gradient-to-r from-blue-500 to-cyan-500 text-white p-4 rounded-full shadow-2xl">
          {children}
        </div>
      </div>
    </motion.div>
  )
}
