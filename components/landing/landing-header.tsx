"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Menu, X, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useUser, UserButton } from "@clerk/nextjs"

export default function LandingHeader() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const { isSignedIn, isLoaded } = useUser()
  const router = useRouter()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const navigation = [
    { name: "Features", href: "/#features" },
    { name: "How It Works", href: "/#how-it-works" },
    { name: "Pricing", href: "/#pricing" },
    { name: "Blog", href: "/blog" },
  ]

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isScrolled ? "bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-sm" : "bg-transparent",
      )}
    >
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2">
              <Sparkles className="h-8 w-8 text-purple-500" />
              <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">
                LockIn
              </span>
            </Link>
          </div>

          {/* Desktop navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-purple-600 dark:hover:text-purple-400",
                  pathname === item.href
                    ? "text-purple-600 dark:text-purple-400"
                    : "text-slate-700 dark:text-slate-300",
                )}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-4">
            {isLoaded && isSignedIn ? (
              <>
                <Button 
                  variant="ghost" 
                  onClick={() => router.push('/dashboard')}
                >
                  Dashboard
                </Button>
                <UserButton afterSignOutUrl="/" />
              </>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link href="/auth/login">Log In</Link>
                </Button>
                <Button
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  asChild
                >
                  <Link href="/auth/signup">Sign Up</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile navigation */}
      {isMobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          className="md:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800"
        >
          <div className="container mx-auto px-4 py-4">
            <nav className="flex flex-col space-y-4">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-base font-medium text-slate-700 hover:text-purple-600 dark:text-slate-300 dark:hover:text-purple-400"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col space-y-3">
                {isLoaded && isSignedIn ? (
                  <>
                    <Button 
                      onClick={() => {
                        router.push('/dashboard');
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      Dashboard
                    </Button>
                    <div className="flex justify-center py-2">
                      <UserButton afterSignOutUrl="/" />
                    </div>
                  </>
                ) : (
                  <>
                    <Button variant="outline" asChild>
                      <Link href="/auth/login" onClick={() => setIsMobileMenuOpen(false)}>
                        Log In
                      </Link>
                    </Button>
                    <Button
                      className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                      asChild
                    >
                      <Link href="/auth/signup" onClick={() => setIsMobileMenuOpen(false)}>
                        Sign Up
                      </Link>
                    </Button>
                  </>
                )}
              </div>
            </nav>
          </div>
        </motion.div>
      )}
    </header>
  )
}
