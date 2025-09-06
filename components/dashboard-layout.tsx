"use client"

import React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { UnicornScene } from 'unicornstudio-react'
import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { BarChart3, Users, CheckSquare, Brain, LogOut, Menu, Newspaper, Sparkles, TrendingUp, Target } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { FloatingElements } from "@/components/floating-elements"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: BarChart3, color: "from-blue-500 to-cyan-500" },
  { name: "Clients", href: "/clients", icon: Users, color: "from-purple-500 to-pink-500" },
  { name: "Todo List", href: "/todos", icon: CheckSquare, color: "from-green-500 to-emerald-500" },
  { name: "News", href: "/news", icon: Newspaper, color: "from-orange-500 to-red-500" },
  { name: "AI Insights", href: "/ai-insights", icon: Brain, color: "from-indigo-500 to-purple-500" },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, signOut, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [activeSection, setActiveSection] = useState("")

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  useEffect(() => {
    const currentNav = navigation.find(item => item.href === pathname)
    setActiveSection(currentNav?.name || "")
  }, [pathname])

  const handleSignOut = async () => {
    await signOut()
    router.push("/")
  }

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

  if (!user) {
    return null
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0 opacity-100">
        <UnicornScene projectId="tJ8pevguoGk5VRJcAqw9"/>
      </div>

      {/* Overlay for better content readability */}
      <div className="fixed inset-0 z-0 bg-gradient-to-br from-black/20 via-transparent to-black/20" />

      {/* FloatingElements for background animation */}
      <FloatingElements />

      {/* Animated geometric shapes like landing page */}
      <motion.div
        className="fixed top-20 left-20 w-32 h-32 border-2 border-white/20 rounded-full -z-10"
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
        className="fixed bottom-32 right-32 w-24 h-24 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-lg rotate-45 -z-10"
        animate={{
          rotate: [45, 135, 45],
          y: [0, -20, 0],
        }}
        transition={{
          rotate: { duration: 8, repeat: Infinity, ease: "easeInOut" },
          y: { duration: 3, repeat: Infinity, ease: "easeInOut" }
        }}
      />
      <motion.div
        className="fixed top-1/2 left-1/4 w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full -z-10"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.7, 0.3],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      {/* Mobile sidebar */}
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-80 p-0 bg-gradient-to-b from-card/95 to-card/80 backdrop-blur-md border-r border-white/10 z-30">
          <div className="flex flex-col h-full">
            <motion.div
              className="p-6 border-b border-white/10"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                    {user.companyName}
                  </h2>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
              </div>
            </motion.div>

            <nav className="flex-1 p-4 space-y-3">
              {navigation.map((item, index) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <motion.div
                    key={item.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <Link
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={cn(
                        "group flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 relative overflow-hidden",
                        isActive
                          ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/25"
                          : "text-muted-foreground hover:text-foreground hover:bg-gradient-to-r hover:from-white/5 hover:to-white/10 backdrop-blur-sm"
                      )}
                    >
                      {/* Background glow effect */}
                      <div className={cn(
                        "absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-300",
                        `bg-gradient-to-r ${item.color}`
                      )} />

                      <motion.div
                        className="relative z-10 p-2 rounded-lg bg-white/10 group-hover:bg-white/20 transition-colors duration-300"
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Icon className="h-5 w-5" />
                      </motion.div>

                      <div className="relative z-10">
                        <span className="font-semibold">{item.name}</span>
                        {isActive && (
                          <motion.div
                            className="w-full h-0.5 bg-white rounded-full mt-1"
                            layoutId="activeIndicator"
                          />
                        )}
                      </div>
                    </Link>
                  </motion.div>
                )
              })}
            </nav>

            <motion.div
              className="p-4 border-t border-white/10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <Button
                variant="ghost"
                onClick={handleSignOut}
                className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-red-500/10 group"
              >
                <LogOut className="h-4 w-4 mr-3 group-hover:text-red-500" />
                Sign Out
              </Button>
            </motion.div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Desktop sidebar */}
      <motion.div
        className={cn(
          "hidden lg:fixed lg:inset-y-0 lg:flex lg:flex-col transition-all duration-500 z-20",
          isHovered ? "lg:w-80" : "lg:w-20",
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        initial={{ x: -320 }}
        animate={{ x: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="flex flex-col flex-grow bg-gradient-to-b from-card/95 to-card/80 backdrop-blur-md border-r border-white/10 shadow-2xl">
          <motion.div
            className="p-6 border-b border-white/10"
            animate={{ opacity: isHovered ? 1 : 0.7 }}
            transition={{ duration: 0.3 }}
          >
            {isHovered ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="flex items-center space-x-3"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                    {user.companyName}
                  </h2>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                className="flex justify-center"
                whileHover={{ scale: 1.1 }}
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
              </motion.div>
            )}
          </motion.div>

          <nav className="flex-1 p-4 space-y-3">
            {navigation.map((item, index) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <Link
                    href={item.href}
                    className={cn(
                      "group flex items-center px-3 py-3 rounded-xl text-sm font-medium transition-all duration-300 relative overflow-hidden",
                      isActive
                        ? `bg-gradient-to-r ${item.color} text-white shadow-lg shadow-${item.color}/25`
                        : "text-muted-foreground hover:text-foreground hover:bg-gradient-to-r hover:from-white/5 hover:to-white/10 backdrop-blur-sm",
                      isHovered ? "justify-start" : "justify-center"
                    )}
                  >
                    {/* Background glow effect */}
                    <div className={cn(
                      "absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-300",
                      `bg-gradient-to-r ${item.color}`
                    )} />

                    <motion.div
                      className="relative z-10 p-2 rounded-lg bg-white/10 group-hover:bg-white/20 transition-colors duration-300"
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Icon className="h-5 w-5" />
                    </motion.div>

                    <AnimatePresence>
                      {isHovered && (
                        <motion.div
                          className="relative z-10 ml-3 overflow-hidden"
                          initial={{ width: 0, opacity: 0 }}
                          animate={{ width: "auto", opacity: 1 }}
                          exit={{ width: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <span className="font-semibold whitespace-nowrap">{item.name}</span>
                          {isActive && (
                            <motion.div
                              className="w-full h-0.5 bg-white rounded-full mt-1"
                              layoutId="activeIndicatorDesktop"
                            />
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Link>
                </motion.div>
              )
            })}
          </nav>

          <motion.div
            className="p-4 border-t border-white/10"
            animate={{ opacity: isHovered ? 1 : 0.7 }}
            transition={{ duration: 0.3 }}
          >
            <Button
              variant="ghost"
              onClick={handleSignOut}
              className={cn(
                "w-full text-muted-foreground hover:text-foreground hover:bg-red-500/10 group transition-all duration-300",
                isHovered ? "justify-start" : "justify-center"
              )}
            >
              <LogOut className="h-4 w-4 group-hover:text-red-500" />
              {isHovered && <span className="ml-3">Sign Out</span>}
            </Button>
          </motion.div>
        </div>
      </motion.div>

      {/* Main content */}
      <motion.div
        className={cn(
          "transition-all duration-500 relative z-10",
          isHovered ? "lg:pl-80" : "lg:pl-20",
        )}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <motion.header
          className="bg-gradient-to-r from-card/95 to-card/80 border-b border-white/10 px-4 py-4 sm:px-6 lg:px-8 shadow-lg"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden hover:bg-white/10"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>

              <motion.div
                className="flex items-center space-x-3"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                  {navigation.find(item => item.href === pathname)?.icon &&
                    React.createElement(navigation.find(item => item.href === pathname)!.icon, {
                      className: "w-4 h-4 text-white"
                    })
                  }
                </div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                    {activeSection}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Welcome back, {user.companyName}
                  </p>
                </div>
              </motion.div>
            </div>

            <div className="flex items-center space-x-4">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <ThemeToggle />
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleSignOut}
                  className="hover:bg-red-500/10 hover:text-red-500"
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              </motion.div>
            </div>
          </div>
        </motion.header>

        <motion.main
          className="p-4 sm:p-6 lg:p-8 min-h-[calc(100vh-80px)]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          {children}
        </motion.main>
      </motion.div>
    </div>
  )
}
