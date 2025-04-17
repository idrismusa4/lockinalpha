"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Sparkles, ArrowRight, Mail, CheckCircle, AlertCircle, RefreshCw, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useClerk } from "@clerk/nextjs"
import { toast } from "sonner"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [verificationCode, setVerificationCode] = useState(["", "", "", "", "", ""])
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [step, setStep] = useState<"request" | "verify" | "reset" | "success">("request")
  const [isLoading, setIsLoading] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const { client } = useClerk()
  const router = useRouter()

  // Focus first code input when the verification step is rendered
  useEffect(() => {
    if (step === "verify" && inputRefs.current[0]) {
      setTimeout(() => {
        inputRefs.current[0]?.focus()
      }, 100)
    }
  }, [step])

  // Setup refs for verification code inputs
  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, 6)
  }, [])

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setIsLoading(true)
      setErrorMessage("")
      
      // Start the password reset process
      await client.signIn.create({
        strategy: "reset_password_email_code",
        identifier: email,
      })
      
      setStep("verify")
      toast.success("Verification code sent to your email")
    } catch (err: any) {
      console.error("Password reset request error:", err)
      
      if (err.errors && err.errors.length > 0) {
        const firstError = err.errors[0]
        setErrorMessage(firstError.message || "Failed to send verification code")
      } else {
        setErrorMessage("An unexpected error occurred. Please try again.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleCodeChange = (index: number, value: string) => {
    // Clear any error message when user starts typing
    if (errorMessage) setErrorMessage("")
    
    // Only allow numbers
    if (value && !/^\d*$/.test(value)) return
    
    // Update the code array
    const newCode = [...verificationCode]
    newCode[index] = value
    setVerificationCode(newCode)
    
    // Auto-focus next input if value is entered
    if (value.length === 1 && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1].focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle backspace - move to previous input if current is empty
    if (e.key === "Backspace" && !verificationCode[index] && index > 0 && inputRefs.current[index - 1]) {
      inputRefs.current[index - 1].focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData("text").trim()
    
    // Check if pasted content is numbers only
    if (/^\d+$/.test(pastedData)) {
      const digits = pastedData.split("").slice(0, 6)
      
      // Fill in as many inputs as we have digits
      const newCode = [...verificationCode]
      digits.forEach((digit, index) => {
        if (index < 6) newCode[index] = digit
      })
      
      setVerificationCode(newCode)
      
      // Focus the input after the last digit entered
      if (digits.length < 6 && inputRefs.current[digits.length]) {
        inputRefs.current[digits.length].focus()
      }
    }
  }

  const handleResendCode = async () => {
    try {
      setIsResending(true)
      setErrorMessage("")
      
      // Resend the verification code
      await client.signIn.create({
        strategy: "reset_password_email_code",
        identifier: email,
      })
      
      toast.success("Verification code resent to your email")
      
      // Clear the inputs when resending
      setVerificationCode(["", "", "", "", "", ""])
      
      // Focus the first input
      if (inputRefs.current[0]) {
        inputRefs.current[0].focus()
      }
    } catch (err: any) {
      console.error("Code resend error:", err)
      
      if (err.errors && err.errors.length > 0) {
        toast.error(err.errors[0].message || "Failed to resend verification code")
      } else {
        toast.error("Failed to resend verification code")
      }
    } finally {
      setIsResending(false)
    }
  }

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const fullCode = verificationCode.join("")
    if (fullCode.length !== 6) {
      setErrorMessage("Please enter the complete 6-digit verification code")
      return
    }
    
    try {
      setIsLoading(true)
      setErrorMessage("")
      
      // Verify the code but don't reset the password yet
      await client.signIn.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code: fullCode,
      })
      
      // If verification is successful, move to password reset step
      setStep("reset")
    } catch (err: any) {
      console.error("Code verification error:", err)
      
      if (err.errors && err.errors.length > 0) {
        const firstError = err.errors[0]
        
        // Set user-friendly error messages
        if (firstError.code === "form_code_incorrect") {
          setErrorMessage("The verification code is incorrect. Please check and try again.")
        } else if (firstError.code === "form_code_expired") {
          setErrorMessage("This code has expired. Please request a new code.")
        } else {
          setErrorMessage(firstError.message || "Failed to verify code")
        }
      } else {
        setErrorMessage("An unexpected error occurred. Please try again.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (newPassword !== confirmPassword) {
      setErrorMessage("Passwords do not match")
      return
    }
    
    if (newPassword.length < 8) {
      setErrorMessage("Password must be at least 8 characters long")
      return
    }
    
    try {
      setIsLoading(true)
      setErrorMessage("")
      
      // Reset the password
      const result = await client.signIn.resetPassword({
        password: newPassword,
      })
      
      if (result.status === "complete") {
        setStep("success")
        toast.success("Password reset successful!")
      } else {
        setErrorMessage("Something went wrong. Please try again.")
      }
    } catch (err: any) {
      console.error("Password reset error:", err)
      
      if (err.errors && err.errors.length > 0) {
        setErrorMessage(err.errors[0].message || "Failed to reset password")
      } else {
        setErrorMessage("An unexpected error occurred. Please try again.")
      }
    } finally {
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
          {step === "request" && (
            <>
              <CardHeader className="space-y-1">
                <CardTitle className="text-2xl font-bold">Reset your password</CardTitle>
                <CardDescription>
                  Enter your email and we'll send you a verification code
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleRequestReset} className="space-y-6">
                  {errorMessage && (
                    <Alert variant="destructive" className="mb-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Error</AlertTitle>
                      <AlertDescription>{errorMessage}</AlertDescription>
                    </Alert>
                  )}
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email address</Label>
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
                        Sending code...
                      </>
                    ) : (
                      <>
                        Send verification code <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </>
          )}

          {step === "verify" && (
            <>
              <CardHeader className="space-y-1">
                <CardTitle className="text-2xl font-bold">Verify your code</CardTitle>
                <CardDescription>
                  Enter the verification code sent to {email}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleVerifyCode} className="space-y-6">
                  {errorMessage && (
                    <Alert variant="destructive" className="mb-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Error</AlertTitle>
                      <AlertDescription>{errorMessage}</AlertDescription>
                    </Alert>
                  )}
                  
                  <div className="space-y-2">
                    <Label htmlFor="verification-code-0">Verification code</Label>
                    <div className="flex gap-2 justify-between">
                      {verificationCode.map((digit, index) => (
                        <Input
                          key={index}
                          id={`verification-code-${index}`}
                          type="text"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleCodeChange(index, e.target.value)}
                          onKeyDown={(e) => handleKeyDown(index, e)}
                          onPaste={index === 0 ? handlePaste : undefined}
                          ref={(el) => (inputRefs.current[index] = el)}
                          className="h-12 w-12 text-center text-xl font-semibold border-slate-200 dark:border-slate-700"
                          required
                        />
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Enter the 6-digit code we sent to your email address
                    </p>
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
                        Verifying...
                      </>
                    ) : (
                      <>
                        Verify Code <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </form>

                <div className="mt-6 text-center">
                  <p className="text-sm text-muted-foreground mb-2">Didn't receive a code?</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleResendCode}
                    disabled={isResending}
                    className="gap-1.5"
                  >
                    {isResending ? (
                      <>
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Resending...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-3.5 w-3.5" /> Resend Code
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </>
          )}

          {step === "reset" && (
            <>
              <CardHeader className="space-y-1">
                <CardTitle className="text-2xl font-bold">Create new password</CardTitle>
                <CardDescription>
                  Create a new password for your account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleResetPassword} className="space-y-6">
                  {errorMessage && (
                    <Alert variant="destructive" className="mb-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Error</AlertTitle>
                      <AlertDescription>{errorMessage}</AlertDescription>
                    </Alert>
                  )}
                  
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New password</Label>
                    <div className="relative">
                      <Input
                        id="new-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        required
                        className="border-slate-200 dark:border-slate-700 pr-10"
                        value={newPassword}
                        onChange={(e) => {
                          setNewPassword(e.target.value)
                          if (errorMessage) setErrorMessage("")
                        }}
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Password must be at least 8 characters
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm password</Label>
                    <Input
                      id="confirm-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      required
                      className="border-slate-200 dark:border-slate-700"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value)
                        if (errorMessage) setErrorMessage("")
                      }}
                    />
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
                        Resetting password...
                      </>
                    ) : (
                      <>
                        Reset password <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </>
          )}

          {step === "success" && (
            <>
              <CardHeader className="space-y-1">
                <CardTitle className="text-2xl font-bold">Password reset successful</CardTitle>
                <CardDescription>
                  Your password has been reset successfully
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 text-center">
                  <div className="mx-auto w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    You can now log in with your new password.
                  </p>
                  <Button 
                    className="mt-4 w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                    onClick={() => router.push("/auth/login")}
                  >
                    Back to login <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </>
          )}

          <CardFooter className="flex flex-col space-y-4 border-t bg-slate-50/50 dark:bg-slate-800/20 p-6">
            <div className="text-center text-sm">
              Remember your password?{" "}
              <Link
                href="/auth/login"
                className="font-medium text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
              >
                Back to login
              </Link>
            </div>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  )
} 