"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

interface User {
  uid: string
  email: string
  displayName?: string
  companyName?: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, companyName: string) => Promise<void>
  signInWithGoogle: (companyName?: string) => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Supabase sign in
  const signIn = async (email: string, password: string) => {
    setLoading(true)
    console.log("[AuthProvider] signIn called", { email })
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      console.error("[AuthProvider] signIn error", error)
      throw error
    }
    const { user } = data
    if (user) {
      setUser({
        uid: user.id,
        email: user.email || "",
        displayName: user.user_metadata?.full_name || user.email?.split("@")[0] || "",
      })
      // Sync to MongoDB
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, email: user.email }),
      })
      console.log("[AuthProvider] MongoDB sync response", await res.json())
    }
    setLoading(false)
  }

  const signUp = async (email: string, password: string, companyName: string) => {
    setLoading(true)
    console.log("[AuthProvider] signUp called", { email, companyName })
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { companyName } },
    })
    if (error) {
      console.error("[AuthProvider] signUp error", error)
      throw error
    }
    const { user } = data
    if (user) {
      setUser({
        uid: user.id,
        email: user.email || "",
        displayName: user.user_metadata?.full_name || user.email?.split("@")[0] || "",
        companyName,
      })
      // Sync to MongoDB
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, email: user.email }),
      })
      console.log("[AuthProvider] MongoDB sync response", await res.json())
    }
    setLoading(false)
  }

  const signInWithGoogle = async (companyName?: string) => {
    setLoading(true)
    console.log("[AuthProvider] signInWithGoogle called", { companyName })
    // Store companyName in localStorage for retrieval after redirect
    if (companyName) {
      localStorage.setItem("companyNameForGoogle", companyName);
    }
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { queryParams: { companyName: companyName || "" } },
    })
    if (error) {
      console.error("[AuthProvider] signInWithGoogle error", error)
      throw error
    }
    setLoading(false)
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  const resetPassword = async (email: string) => {
    // Simulate password reset
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  useEffect(() => {
    // Check for existing Supabase session
    const getSession = async () => {
      const { data } = await supabase.auth.getUser()
      const user = data.user
      if (user) {
        let companyName = undefined;
        // Retrieve companyName from localStorage if present (for Google sign up)
        if (typeof window !== 'undefined') {
          companyName = localStorage.getItem("companyNameForGoogle") || undefined;
          if (companyName) {
            localStorage.removeItem("companyNameForGoogle");
          }
        }
        setUser({
          uid: user.id,
          email: user.email || "",
          displayName: user.user_metadata?.full_name || user.email?.split("@")[0] || "",
          companyName,
        })
        // Sync to MongoDB
        const res = await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.id, email: user.email, companyName }),
        })
        console.log("[AuthProvider] Session MongoDB sync response", await res.json())
      }
      setLoading(false)
    }
    getSession()
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
