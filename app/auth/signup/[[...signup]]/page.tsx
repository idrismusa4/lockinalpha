"use client";

import type React, { useEffect } from "react";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight, Eye, EyeOff, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useSignUp } from "@clerk/nextjs";
import { useUser } from "@clerk/nextjs";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { signUp, isLoaded } = useSignUp();
  const router = useRouter();
  const { isSignedIn } = useUser();

  // Redirect to dashboard if already signed in
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.replace('/dashboard');
    }
  }, [isLoaded, isSignedIn, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;

    try {
      setIsLoading(true);
      
      console.log("Creating sign-up with email only:", email);
      
      // Create a sign-up with JUST email address - Clerk rejects first_name and last_name
      const result = await signUp.create({
        emailAddress: email
        // No name parameters in the initial creation
      });
      
      console.log("Sign-up created:", result);
      
      // Prepare the verification
      await signUp.prepareEmailAddressVerification({
        strategy: "email_code"
      });
      
      console.log("Email verification prepared");
      
      // Store the name in local storage for later user profile update
      if (fullName) {
        localStorage.setItem("clerk_fullname", fullName);
      }
      
      // Redirect to verification page
      router.push("/verify-email");
      toast.success("Verification email sent! Check your inbox.");
      
    } catch (err: any) {
      console.error("Sign-up error:", err);
      toast.error(err.errors?.[0]?.message || "Failed to sign up");
    } finally {
      setIsLoading(false);
    }
  };

  const signUpWithSocial = async (provider: "oauth_google" | "oauth_microsoft") => {
    if (!email) return;

    try {
      setIsLoading(true);
      
      // Simplified social sign-up
      if (!isLoaded) {
        toast.error("Sign up form not loaded yet");
        return;
      }
      
      await signUp.authenticateWithRedirect({
        strategy: provider,
        redirectUrl: "/sso-callback",
        redirectUrlComplete: "/dashboard"
      });
    } catch (err: any) {
      toast.error(err.errors?.[0]?.message || `Failed to sign up with ${provider.replace("oauth_", "")}`);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

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
            <CardTitle className="text-2xl font-bold">Create an account</CardTitle>
            <CardDescription>Enter your information to get started</CardDescription>
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
             
              <div id="clerk-captcha" className="mt-4 mb-4"></div>
              <div className="flex items-start space-x-2">
                <Checkbox id="terms" className="mt-1" required />
                <Label htmlFor="terms" className="text-sm font-normal">
                  I agree to the{" "}
                  <Link
                    href="/terms"
                    className="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
                  >
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link
                    href="/privacy"
                    className="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
                  >
                    Privacy Policy
                  </Link>
                </Label>
              </div>
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                disabled={isLoading}
              >
                {isLoading ? (
                  "Sending verification..."
                ) : (
                  "Continue with Email"
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
                onClick={() => signUpWithSocial("oauth_google")}
                disabled={isLoading}
              >
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
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
                onClick={() => signUpWithSocial("oauth_microsoft")}
                disabled={isLoading}
              >
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path
                    d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zM24 11.4H12.6V0H24v11.4z"
                    fill="#f25022"
                  />
                </svg>
                Microsoft
              </Button>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center border-t border-slate-200 dark:border-slate-700 p-4">
            <div className="text-sm text-center">
              Already have an account?{" "}
              <Link
                href="/auth/login"
                className="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 hover:underline"
              >
                Sign in
              </Link>
            </div>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
