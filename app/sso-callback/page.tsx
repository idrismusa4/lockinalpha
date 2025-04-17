"use client"

import { useEffect } from "react"
import { Loader2 } from "lucide-react"
import { useClerk } from "@clerk/nextjs"
import { useRouter } from "next/navigation"

export default function SSOCallback() {
  const { handleRedirectCallback } = useClerk()
  const router = useRouter()

  useEffect(() => {
    async function processCallback() {
      try {
        // Process the callback from the OAuth provider
        await handleRedirectCallback({
          redirectUrl: "/dashboard",
        })
      } catch (err) {
        console.error("Error handling OAuth callback:", err)
        // Redirect to login page if there's an error
        router.push("/auth/login")
      }
    }

    processCallback()
  }, [handleRedirectCallback, router])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      <div className="flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-12 w-12 text-purple-500 animate-spin" />
        <h1 className="text-xl font-semibold">Processing your sign-in...</h1>
        <p className="text-slate-500 dark:text-slate-400">You'll be redirected soon</p>
      </div>
    </div>
  )
} 