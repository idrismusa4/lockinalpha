"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Sparkles, ArrowRight, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { useSignIn, useUser } from "@clerk/nextjs"
import { toast } from "sonner"

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const { signIn, isLoaded: signInLoaded, setActive } = useSignIn()
  const { isSignedIn, isLoaded: userLoaded } = useUser()
  const router = useRouter()
  
  // Redirect to dashboard if already signed in
  useEffect(() => {
    if (userLoaded && isSignedIn) {
      router.replace('/dashboard');
    }
  }, [userLoaded, isSignedIn, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!signInLoaded) return

    try {
      setIsLoading(true)
      
      // Start the sign-in process with email
      const result = await signIn.create({
        identifier: email,
        password,
      })

      if (result.status === "complete") {
        // Set the active session
        await setActive({ session: result.createdSessionId })
        // Redirect to dashboard
        router.push("/dashboard")
        toast.success("Signed in successfully!")
      } else {
        // If sign-in is not complete for some reason
        toast.error("Something went wrong. Please try again.")
        console.error("Sign-in failed:", result)
      }
    } catch (err: any) {
      toast.error(err.errors?.[0]?.message || "Failed to sign in")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const signInWithSocial = async (provider: "oauth_google" | "oauth_microsoft") => {
    if (!signInLoaded) return

    try {
      setIsLoading(true)
      await signIn.authenticateWithRedirect({
        strategy: provider,
        redirectUrl: "/sso-callback",
        redirectUrlComplete: "/dashboard"
      })
    } catch (err: any) {
      toast.error(err.errors?.[0]?.message || `Failed to sign in with ${provider.replace("oauth_", "")}`)
      console.error(err)
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 p-4 md:p-8">
      <Link href="/" className="absolute top-8 left-8 flex items-center gap-2">
        <Sparkles className="h-6 w-6 text-purple-500" />
        <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">
          LockIn
        </span>
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="border-2 border-slate-200 dark:border-slate-800 shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
            <CardDescription>Enter your credentials to access your account</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@example.com"
                  required
                  className="border-slate-200 dark:border-slate-700"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link
                    href="/auth/forgot-password"
                    className="text-xs text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    required
                    className="border-slate-200 dark:border-slate-700 pr-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 py-2 text-muted-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="remember" />
                <Label htmlFor="remember" className="text-sm font-normal">
                  Remember me for 30 days
                </Label>
              </div>
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Logging in...
                  </>
                ) : (
                  <>
                    Log In <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <Separator />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Button 
                variant="outline" 
                className="border-slate-200 dark:border-slate-700"
                onClick={() => signInWithSocial("oauth_google")}
                disabled={isLoading}
              >
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Google
              </Button>
              <Button 
                variant="outline" 
                className="border-slate-200 dark:border-slate-700"
                onClick={() => signInWithSocial("oauth_microsoft")}
                disabled={isLoading}
              >
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path d="M9.09 16.59v-9.4h2.5v9.4H9.09zm-4.16 0v-9.4h2.5v9.4H4.93z" fill="#0052CC" />
                  <path
                    d="M16.34 16.59c-1.32 0-2.5-1.12-2.5-2.5V9.68c0-1.38 1.18-2.5 2.5-2.5 1.38 0 2.5 1.12 2.5 2.5v4.41c0 1.38-1.12 2.5-2.5 2.5z"
                    fill="#2684FF"
                  />
                </svg>
                Microsoft
              </Button>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 border-t bg-slate-50/50 dark:bg-slate-800/20 p-6">
            <div className="text-center text-sm">
              Don&apos;t have an account?{" "}
              <Link
                href="/auth/signup"
                className="font-medium text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
              >
                Sign up
              </Link>
            </div>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  )
}
