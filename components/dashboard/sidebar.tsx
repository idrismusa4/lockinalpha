"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  Home,
  Video,
  Upload,
  Library,
  Settings,
  LogOut,
  Sparkles,
  Crown,
  User,
  BookOpen,
  Lightbulb,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { useUser, useAuth } from "@clerk/nextjs"
import { toast } from "sonner"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  useSidebar,
} from "@/components/ui/sidebar"

// Updated navigation array to include all pages
const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Create Video", href: "/create-videos", icon: Video },
  { name: "Upload Files", href: "/upload-files", icon: Upload },
  { name: "My Library", href: "/library", icon: Library },
  { name: "Templates", href: "/templates", icon: BookOpen },
  { name: "AI Generator", href: "/ai-generator", icon: Lightbulb },
  { name: "Profile & Settings", href: "/profile-settings", icon: User },
]

export function AppSidebar() {
  const pathname = usePathname()
  const [progress, setProgress] = useState(0)
  const { state, toggleSidebar } = useSidebar()
  const isCollapsed = state === "collapsed"
  const { isSignedIn, user, isLoaded } = useUser()
  const { signOut } = useAuth()
  const router = useRouter()
  const [isSigningOut, setIsSigningOut] = useState(false)

  // Simulate progress loading animation
  useEffect(() => {
    const timer = setTimeout(() => setProgress(70), 500)
    return () => clearTimeout(timer)
  }, [])

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true)
      // First navigate away to avoid React state issues
      router.push('/auth/login')
      // Then sign out
      await signOut()
      toast.success("Signed out successfully")
    } catch (error) {
      console.error("Error signing out:", error)
      toast.error("Failed to sign out")
    } finally {
      setIsSigningOut(false)
    }
  }

  return (
    <Sidebar variant="floating" collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center justify-between p-2">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-purple-500" />
            {!isCollapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent"
              >
                LockIn
              </motion.span>
            )}
          </Link>
          <Button variant="ghost" size="icon" onClick={toggleSidebar} className="h-8 w-8">
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* User profile summary */}
        <AnimatePresence>
          {!isCollapsed && isLoaded && isSignedIn && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-2 mb-6 flex flex-col items-center px-4"
            >
              <Avatar className="h-20 w-20 border-2 border-purple-200 dark:border-purple-900">
                <AvatarImage src={user?.imageUrl || "/placeholder.svg?height=80&width=80"} alt={user?.fullName || "User"} />
                <AvatarFallback>{user?.firstName?.charAt(0) || "U"}</AvatarFallback>
              </Avatar>
              <div className="mt-4 text-center">
                <p className="font-medium">{user?.fullName || "Student Creator"}</p>
                <Badge
                  variant="outline"
                  className="mt-1 bg-gradient-to-r from-green-200 to-yellow-300 text-amber-900 border-green-300"
                >
                  <Crown className="h-3 w-3 mr-1" /> Basic Plan
                </Badge>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Usage stats */}
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="rounded-xl bg-slate-100 dark:bg-slate-800 p-4 mb-6 mx-4"
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Video Generations</span>
                <span className="text-sm font-medium">70/100</span>
              </div>
              <Progress value={progress} className="h-2 mb-4" />
              <Button variant="outline" size="sm" className="w-full text-xs">
                Upgrade Plan
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation */}
        <SidebarMenu>
          {navigation.map((item) => (
            <SidebarMenuItem key={item.name}>
              <SidebarMenuButton
                asChild
                isActive={pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))}
                tooltip={isCollapsed ? item.name : undefined}
              >
                <Link href={item.href} className="flex items-center gap-3">
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    <item.icon className="h-5 w-5" />
                  </motion.div>
                  {!isCollapsed && item.name}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip={isCollapsed ? "Log Out" : undefined}>
              <button 
                className="flex items-center gap-3 w-full" 
                onClick={handleSignOut}
                disabled={isSigningOut}
              >
                <LogOut className="h-5 w-5 text-slate-500 dark:text-slate-400 group-hover:text-purple-600 dark:group-hover:text-purple-400" />
                {!isCollapsed && (isSigningOut ? "Signing out..." : "Log Out")}
              </button>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}

export default function DashboardSidebar() {
  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar />
    </SidebarProvider>
  )
}
