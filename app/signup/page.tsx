"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { Eye, EyeOff, Sparkles, Shield, Zap, Building2 } from "lucide-react"
import Link from "next/link"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { motion } from "framer-motion"
import { MagazineCard } from "@/components/magazine-card"
import { FloatingElements } from "@/components/floating-elements"

export default function SignUpPage() {
  const [companyName, setCompanyName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showGoogleDialog, setShowGoogleDialog] = useState(false)
  const [googleCompanyName, setGoogleCompanyName] = useState("")

  const { signUp, signInWithGoogle } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log("[SignUp] Form submit", { email, companyName })

    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match.",
        variant: "destructive",
      })
      return
    }

    if (password.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      await signUp(email, password, companyName)
      console.log("[SignUp] signUp success", { email, companyName })
      toast({
        title: "Success",
        description: "Account created successfully!",
      })
      router.push("/dashboard")
    } catch (error) {
      console.error("[SignUp] signUp error", error)
      toast({
        title: "Error",
        description: "Failed to create account. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignUp = () => {
    setShowGoogleDialog(true)
  }

  const handleGoogleSignUpConfirm = async () => {
    console.log("[GoogleSignUp] Confirm", { googleCompanyName })
    if (!googleCompanyName.trim()) {
      toast({
        title: "Error",
        description: "Please enter your company name.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      await signInWithGoogle(googleCompanyName)
      console.log("[GoogleSignUp] signInWithGoogle success", { googleCompanyName })
      toast({
        title: "Success",
        description: "Account created with Google successfully!",
      })
      router.push("/dashboard")
    } catch (error) {
      console.error("[GoogleSignUp] signInWithGoogle error", error)
      toast({
        title: "Error",
        description: "Failed to sign up with Google.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setShowGoogleDialog(false)
      setGoogleCompanyName("")
    }
  }

  // Redirect to login page since we now have the flip card interface
  useEffect(() => {
    router.push('/login')
  }, [router])

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-cyan-900 flex items-center justify-center p-4">
      <FloatingElements />
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="relative z-10"
      >
        <MagazineCard
          title="Redirecting to Login"
          description="Enhanced authentication experience awaits"
          className="w-full max-w-md text-center"
        >
          <CardContent className="p-8">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center"
            >
              <Sparkles className="h-8 w-8 text-white" />
            </motion.div>
            <motion.h2
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-xl font-semibold mb-2"
            >
              Redirecting...
            </motion.h2>
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-muted-foreground"
            >
              Taking you to the enhanced login experience...
            </motion.p>
          </CardContent>
        </MagazineCard>
      </motion.div>
    </div>
  )
}
