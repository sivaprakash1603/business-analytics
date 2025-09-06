"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { Eye, EyeOff, Sparkles, Shield, Zap, Building2 } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { UnicornScene } from 'unicornstudio-react'
import { motion } from "framer-motion"
import { MagazineCard } from "@/components/magazine-card"
import { FloatingElements } from "@/components/floating-elements"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [resetEmail, setResetEmail] = useState("")
  const [showReset, setShowReset] = useState(false)
  const [isFlipped, setIsFlipped] = useState(false)
  // Signup state variables
  const [companyName, setCompanyName] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [showGoogleDialog, setShowGoogleDialog] = useState(false)
  const [googleCompanyName, setGoogleCompanyName] = useState("")
  const { signIn, signInWithGoogle, resetPassword, signUp, user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [loginSuccess, setLoginSuccess] = useState(false)
  const loginTypeRef = useRef<"email"|"google"|null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await signIn(email, password)
      setLoginSuccess(true)
      loginTypeRef.current = "email"
    } catch (error) {
      toast({
        title: "Error",
        description: "Invalid credentials. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setLoading(true)
    try {
      await signInWithGoogle()
      router.push("/dashboard")
      setLoginSuccess(true)
      loginTypeRef.current = "google"
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign in with Google.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await resetPassword(resetEmail)
      toast({
        title: "Success",
        description: "Password reset email sent!",
      })
      setShowReset(false)
      setResetEmail("")
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send reset email.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
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

  useEffect(() => {
    if (loginSuccess && user) {
      toast({
        title: "Success",
        description:
          loginTypeRef.current === "google"
            ? "Logged in with Google successfully!"
            : "Logged in successfully!",
      })
      router.push("/dashboard")
      setLoginSuccess(false)
      loginTypeRef.current = null
    }
  }, [loginSuccess, user, router, toast])

  // Show enhanced loading animation until auth state is loaded
  if (authLoading) {
    return (
      <div className="relative min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-hidden">
        {/* Animated Background */}
        <div className="fixed inset-0 z-0 opacity-100">
          <UnicornScene projectId="tJ8pevguoGk5VRJcAqw9"/>
        </div>

        {/* Overlay for better content readability */}
        <div className="fixed inset-0 z-0 bg-gradient-to-br from-black/20 via-transparent to-black/20" />

        <FloatingElements />
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="relative z-10"
        >
          <Card className="w-full max-w-md text-center bg-white/90 dark:bg-gray-900/90 backdrop-blur-lg border-0 shadow-2xl">
            <CardContent className="p-8">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center"
              >
                <Sparkles className="h-8 w-8 text-white" />
              </motion.div>
              <motion.h2
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-xl font-semibold mb-2"
              >
                Loading...
              </motion.h2>
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-muted-foreground"
              >
                Preparing your experience...
              </motion.p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
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
          y: { duration: 3, repeat: Infinity, ease: "easeInOut" }
        }}
      />
      <motion.div
        className="absolute top-1/2 left-1/4 w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full"
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

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 w-full max-w-md mx-auto flex items-center justify-center min-h-screen p-4"
      >
        <motion.div
          className="relative w-full h-auto min-h-[600px] max-h-[90vh] preserve-3d"
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          style={{ transformStyle: "preserve-3d" }}
        >
          {/* Login Side */}
          <motion.div
            className="absolute inset-0 backface-hidden"
            style={{ backfaceVisibility: "hidden" }}
          >
            <MagazineCard
              title="Welcome Back"
              description="Sign in to your business analytics dashboard"
              icon={Shield}
              gradient="from-blue-500 to-purple-600"
              className="w-full h-full "
            >
              <CardContent className="space-y-6 p-8 h-full flex flex-col ">
            {!showReset ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="space-y-4"
              >
                <form onSubmit={handleSubmit} className="space-y-4">
                  <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="space-y-2"
                  >
                    <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="transition-all duration-300 focus:ring-2 focus:ring-blue-500"
                    />
                  </motion.div>

                  <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="space-y-2"
                  >
                    <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="transition-all duration-300 focus:ring-2 focus:ring-blue-500 pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    <Button
                      type="submit"
                      className="w-full gradient-bg text-white hover:opacity-90 transition-all duration-300 transform hover:scale-105"
                      disabled={loading}
                    >
                      {loading ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="flex items-center gap-2"
                        >
                          <Zap className="h-4 w-4" />
                          Signing in...
                        </motion.div>
                      ) : (
                        "Sign In"
                      )}
                    </Button>
                  </motion.div>
                </form>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="text-center"
                >
                  <Button
                    variant="link"
                    onClick={() => setShowReset(true)}
                    className="text-sm text-blue-600 hover:underline transition-colors duration-300"
                  >
                    Forgot your password?
                  </Button>
                </motion.div>

                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.7 }}
                  className="relative"
                >
                  <Separator />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="bg-background px-2 text-xs text-muted-foreground">or</span>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.8 }}
                >
                  <Button
                    onClick={handleGoogleSignIn}
                    variant="outline"
                    className="w-full bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm hover:bg-white/70 dark:hover:bg-gray-800/70 transition-all duration-300 transform hover:scale-105 border-2"
                    disabled={loading}
                  >
                    <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Continue with Google
                  </Button>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.9 }}
                  className="text-center text-sm"
                >
                  {"Don't have an account? "}
                  <button
                    onClick={() => setIsFlipped(true)}
                    className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors duration-300 font-medium cursor-pointer"
                  >
                    Sign up
                  </button>
                </motion.div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-4"
              >
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="resetEmail" className="text-sm font-medium">Email</Label>
                    <Input
                      id="resetEmail"
                      type="email"
                      placeholder="Enter your email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      required
                      className="transition-all duration-300 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full gradient-bg text-white hover:opacity-90 transition-all duration-300 transform hover:scale-105"
                    disabled={loading}
                  >
                    {loading ? "Sending..." : "Send Reset Email"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm hover:bg-white/70 dark:hover:bg-gray-800/70 transition-all duration-300"
                    onClick={() => setShowReset(false)}
                  >
                    Back to Login
                  </Button>
                </form>
              </motion.div>
            )}
          </CardContent>
        </MagazineCard>
        </motion.div>

        {/* Signup Side */}
        <motion.div
          className="absolute inset-0 backface-hidden"
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
          <MagazineCard
            title="Create Account"
            description="Start your business analytics journey"
            icon={Building2}
            gradient="from-purple-500 to-pink-600"
            className="w-full h-full"
          >
            <CardContent className="space-y-6 p-8 h-full flex flex-col">
              <form onSubmit={handleSignUp} className="space-y-4 flex-1">
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="space-y-2"
                >
                  <Label htmlFor="signupCompany" className="text-sm font-medium">Company Name</Label>
                  <Input
                    id="signupCompany"
                    type="text"
                    placeholder="Enter your company name"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    required
                    className="transition-all duration-300 focus:ring-2 focus:ring-purple-500"
                  />
                </motion.div>

                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="space-y-2"
                >
                  <Label htmlFor="signupEmail" className="text-sm font-medium">Email</Label>
                  <Input
                    id="signupEmail"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="transition-all duration-300 focus:ring-2 focus:ring-purple-500"
                  />
                </motion.div>

                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="space-y-2"
                >
                  <Label htmlFor="signupPassword" className="text-sm font-medium">Password</Label>
                  <div className="relative">
                    <Input
                      id="signupPassword"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="transition-all duration-300 focus:ring-2 focus:ring-purple-500 pr-10"
                    />
                  </div>
                </motion.div>

                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.55 }}
                  className="space-y-2"
                >
                  <Label htmlFor="signupConfirmPassword" className="text-sm font-medium">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      id="signupConfirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="transition-all duration-300 focus:ring-2 focus:ring-purple-500 pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="mt-auto"
                >
                  <Button
                    type="submit"
                    className="w-full gradient-bg text-white hover:opacity-90 transition-all duration-300 transform hover:scale-105"
                  >
                    Create Account
                  </Button>
                </motion.div>
              </form>

              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.7 }}
                className="relative"
              >
                <Separator />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="bg-background px-2 text-xs text-muted-foreground">or</span>
                </div>
              </motion.div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                <Button
                  onClick={handleGoogleSignUp}
                  variant="outline"
                  className="w-full bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm hover:bg-white/70 dark:hover:bg-gray-800/70 transition-all duration-300 transform hover:scale-105 border-2"
                  disabled={loading}
                >
                  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Sign up with Google
                </Button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9 }}
                className="text-center text-sm"
              >
                {"Already have an account? "}
                <button
                  onClick={() => setIsFlipped(false)}
                  className="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 transition-colors duration-300 font-medium cursor-pointer"
                >
                  Sign in
                </button>
              </motion.div>
            </CardContent>
          </MagazineCard>
        </motion.div>
        </motion.div>
      </motion.div>

      {/* Google Signup Dialog */}
      <Dialog open={showGoogleDialog} onOpenChange={setShowGoogleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Your Registration</DialogTitle>
            <DialogDescription>
              Please enter your company name to complete the signup process.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="googleCompanyName">Company Name</Label>
              <Input
                id="googleCompanyName"
                type="text"
                placeholder="Enter your company name"
                value={googleCompanyName}
                onChange={(e) => setGoogleCompanyName(e.target.value)}
                required
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleGoogleSignUpConfirm}
                disabled={loading}
                className="flex-1"
              >
                {loading ? "Creating Account..." : "Complete Signup"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowGoogleDialog(false)}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
