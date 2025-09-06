"use client"

import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef } from 'react'

interface ScrollSectionProps {
  children: React.ReactNode
  className?: string
  background?: string
}

export function ScrollSection({ children, className = "", background = "bg-background" }: ScrollSectionProps) {
  const sectionRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"]
  })

  const y = useTransform(scrollYProgress, [0, 1], ["10%", "-10%"])
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0])

  return (
    <motion.section
      ref={sectionRef}
      className={`relative py-20 ${background} ${className}`}
      style={{ y, opacity }}
    >
      <div className="container mx-auto px-4">
        {children}
      </div>
    </motion.section>
  )
}

interface StaggeredGridProps {
  children: React.ReactNode[]
  className?: string
  staggerDelay?: number
}

export function StaggeredGrid({ children, className = "", staggerDelay = 0.1 }: StaggeredGridProps) {
  return (
    <div className={`grid md:grid-cols-2 lg:grid-cols-3 gap-8 ${className}`}>
      {children.map((child, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            duration: 0.6,
            delay: index * staggerDelay,
            ease: "easeOut"
          }}
          viewport={{ once: true }}
          whileHover={{
            scale: 1.05,
            transition: { duration: 0.2 }
          }}
        >
          {child}
        </motion.div>
      ))}
    </div>
  )
}
