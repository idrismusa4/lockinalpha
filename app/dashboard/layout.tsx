"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Menu, X } from "lucide-react"
import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import DashboardSidebar from "@/components/dashboard/sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import GridBackground from "@/components/ui/grid-background"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { isSignedIn, isLoaded } = useUser()
  const router = useRouter()

  // Protect all dashboard routes
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.replace('/auth/login')
    }
  }, [isLoaded, isSignedIn, router])

  // Don't render anything until auth is checked
  if (!isLoaded) return null
  if (!isSignedIn) return null

  return (
    <GridBackground className="min-h-screen">
      <SidebarProvider>
        {/* Mobile menu button */}
        <div className="fixed top-4 right-4 z-50 lg:hidden">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="rounded-full bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/50"
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Desktop sidebar */}
        <div className="hidden lg:block">
          <DashboardSidebar />
        </div>

        {/* Mobile sidebar */}
        {isMobileMenuOpen && (
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-y-0 left-0 z-40 w-full sm:max-w-sm lg:hidden"
          >
            <DashboardSidebar />
          </motion.div>
        )}

        {/* Main content */}
        <SidebarInset>{children}</SidebarInset>
      </SidebarProvider>
    </GridBackground>
  )
}
