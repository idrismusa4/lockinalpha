"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Sparkles, ArrowRight, CheckCircle, RefreshCw, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useSignUp } from "@clerk/nextjs"
import { toast } from "sonner"
import { ProfileCompletionModal } from "@/components/profile/profile-completion-modal"

export default function VerifyEmailPage() {
  const [verificationCode, setVerificationCode] = useState(["", "", "", "", "", ""])
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPasswordFields, setShowPasswordFields] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [showProfileModal, setShowProfileModal] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const { isLoaded, signUp, setActive } = useSignUp()
  const router = useRouter()

  // Setup refs for verification code inputs
  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, 6)
  }, [])

  // Check if we need to show password fields immediately
  useEffect(() => {
    if (isLoaded && signUp && signUp.status === "missing_requirements") {
      const requiredFields = signUp.requiredFields || [];
      console.log("Sign-up status:", signUp.status);
      console.log("Required fields:", requiredFields);
      
      if (requiredFields.includes("password")) {
        console.log("Password is required to complete sign-up");
        setShowPasswordFields(true);
      }
    }
    
    // Focus the first input when the component mounts
    if (inputRefs.current && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [isLoaded, signUp]);

  if (!isLoaded || !signUp) {
    // If the signup object is not available, the user probably navigated 
    // directly to this page without initiating a signup. Redirect them.
    router.replace("/auth/signup")
    return null
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
    
    // Auto-focus next input if value is entered and refs exist
    if (value.length === 1 && index < 5 && inputRefs.current && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1].focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle backspace - move to previous input if current is empty and refs exist
    if (e.key === "Backspace" && !verificationCode[index] && index > 0 && 
        inputRefs.current && inputRefs.current[index - 1]) {
      inputRefs.current[index - 1].focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData("text").trim()
    
    // Check if pasted content is numbers only and correct length
    if (/^\d+$/.test(pastedData)) {
      const digits = pastedData.split("").slice(0, 6)
      
      // Fill in as many inputs as we have digits
      const newCode = [...verificationCode]
      digits.forEach((digit, index) => {
        if (index < 6) newCode[index] = digit
      })
      
      setVerificationCode(newCode)
      
      // Focus the input after the last digit entered if refs exist
      if (digits.length < 6 && inputRefs.current && inputRefs.current[digits.length]) {
        inputRefs.current[digits.length].focus()
      }
    }
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // If we need a password and it's not provided yet
    if (showPasswordFields) {
      if (!password) {
        setErrorMessage("Please enter a password");
        return;
      }
      
      if (password !== confirmPassword) {
        setErrorMessage("Passwords do not match");
        return;
      }
      
      if (password.length < 8) {
        setErrorMessage("Password must be at least 8 characters");
        return;
      }
      
      try {
        setIsLoading(true);
        console.log("Completing sign-up process with password");
        
        // Update the sign-up with password
        await signUp.update({
          password
        });
        
        // Attempt to complete sign-up directly
        try {
          // Force a complete verification of the sign-up
          const completeResult = await signUp.attemptEmailAddressVerification({
            code: verificationCode.join("")
          });
          
          console.log("Final verification result:", completeResult);
          
          if (completeResult.status === "complete") {
            // If we have a session, activate it
            if (completeResult.createdSessionId) {
              await setActive({ session: completeResult.createdSessionId });
              toast.success("Account created successfully!");
              
              // Set a flag in localStorage to show the welcome modal on dashboard
              localStorage.setItem("show_welcome_profile", "true");
              
              // Redirect to dashboard - the modal will show there
              router.push("/dashboard");
            } else {
              // If no session but signup is complete, redirect to login
              toast.success("Account created! Please log in.");
              router.push("/auth/login");
              return;
            }
          } else {
            console.log("Non-complete status after verification:", completeResult);
            // Just redirect to login as fallback
            toast.success("Setup completed - please log in");
            router.push("/auth/login");
          }
        } catch (finalErr) {
          console.error("Error in final verification:", finalErr);
          toast.error("Unable to complete account setup");
          setIsLoading(false);
          return;
        }
        
        return;
      } catch (err) {
        console.error("Error setting password:", err);
        setErrorMessage("Failed to set password. Please try again.");
        setIsLoading(false);
        return;
      }
    }
    
    // Original verify code flow for verification code entry
    const fullCode = verificationCode.join("")
    if (fullCode.length !== 6) {
      setErrorMessage("Please enter the complete 6-digit verification code")
      return
    }
    
    try {
      setIsLoading(true)
      setErrorMessage("")
      
      // Attempt verification
      console.log("Attempting verification with code:", fullCode);
      const result = await signUp.attemptEmailAddressVerification({
        code: fullCode,
      })
      
      console.log("Verification result:", result);
      
      // Check if we need to set a password
      if (result.status === "missing_requirements") {
        const requiredFields = result.requiredFields || [];
        console.log("Missing requirements:", requiredFields);
        
        if (requiredFields.includes("password")) {
          console.log("Password is required to complete sign-up");
          setShowPasswordFields(true);
          setIsLoading(false);
          return;
        }
      }
      
      if (result.status === "complete") {
        if (result.createdSessionId) {
          // Only try to activate the session if we have one
          await setActive({ session: result.createdSessionId })
          toast.success("Account created successfully!")
          
          // Set a flag in localStorage to show the welcome modal on dashboard
          localStorage.setItem("show_welcome_profile", "true");
          
          // Redirect to dashboard - the modal will show there
          router.push("/dashboard");
        } else {
          // If verification complete but no session, go to login
          toast.success("Email verified! Please log in.")
          router.push("/auth/login")
        }
      } else {
        setErrorMessage("Verification could not be completed. Please try again.")
        console.error("Unhandled verification status:", result)
        setIsLoading(false);
      }
    } catch (err: any) {
      console.error("Verification error:", err)
      
      if (err.errors && err.errors.length > 0) {
        const firstError = err.errors[0]
        
        if (firstError.code === "form_code_incorrect") {
          setErrorMessage("The verification code is incorrect. Please check and try again.")
        } else if (firstError.code === "form_code_expired") {
          setErrorMessage("This code has expired. Please request a new code.")
        } else if (firstError.message?.includes("already been verified")) {
          // Check if password is needed to complete sign-up
          console.log("Email already verified, checking if password is needed");
          setShowPasswordFields(true);
          setIsLoading(false);
          return;
        } else {
          setErrorMessage(firstError.message || "Failed to verify email")
        }
      } else {
        setErrorMessage("An unexpected error occurred. Please try again.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendCode = async () => {
    try {
      setIsResending(true)
      setErrorMessage("")
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" })
      toast.success("Verification code resent!")
      
      // Clear the inputs when resending
      setVerificationCode(["", "", "", "", "", ""])
      
      // Focus the first input
      if (inputRefs.current && inputRefs.current[0]) {
        inputRefs.current[0].focus()
      }
    } catch (err: any) {
      console.error("Error resending code:", err)
      
      if (err.errors && err.errors.length > 0) {
        toast.error(err.errors[0].message || "Failed to resend verification code")
      } else {
        toast.error("Failed to resend verification code")
      }
    } finally {
      setIsResending(false)
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
            <CardTitle className="text-2xl font-bold">Verify your email</CardTitle>
            <CardDescription>
              Enter the verification code sent to your email
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleVerify} className="space-y-6">
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
                      ref={(el) => {
                        // Safe assignment to ref array
                        if (inputRefs.current) {
                          inputRefs.current[index] = el;
                        }
                      }}
                      className="h-14 w-14 text-center text-xl font-bold border-slate-200 dark:border-slate-700"
                      value={digit}
                      onChange={(e) => handleCodeChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      onPaste={index === 0 ? handlePaste : undefined}
                      maxLength={1}
                      inputMode="numeric"
                    />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Enter the 6-digit code we sent to your email address
                </p>
              </div>
              
              {showPasswordFields && (
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 w-full text-lg font-medium border-slate-200 dark:border-slate-700"
                    required
                  />
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-12 w-full text-lg font-medium border-slate-200 dark:border-slate-700"
                    required
                  />
                </div>
              )}
              
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                disabled={isLoading}
              >
                {isLoading ? (
                  "Processing..."
                ) : (
                  showPasswordFields ? "Set Password & Complete Sign Up" : "Verify Email"
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
          <CardFooter className="flex flex-col space-y-4 border-t bg-slate-50/50 dark:bg-slate-800/20 p-6">
            <div className="text-center text-sm">
              Back to{" "}
              <Link
                href="/auth/login"
                className="font-medium text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
              >
                Login
              </Link>
            </div>
          </CardFooter>
        </Card>
      </motion.div>
      <ProfileCompletionModal 
        isOpen={showProfileModal} 
        onClose={() => {
          setShowProfileModal(false);
          router.push("/dashboard");
        }} 
      />
    </div>
  )
} 