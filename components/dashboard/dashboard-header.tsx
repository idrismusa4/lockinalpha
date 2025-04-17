"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Video, Upload, LayoutDashboard, Settings } from "lucide-react"

export default function DashboardHeader() {
  const pathname = usePathname()

  const navigation = [
    { name: "Home", href: "/", icon: Home },
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Create Videos", href: "/create-videos", icon: Video },
    { name: "Upload Files", href: "/upload-files", icon: Upload },
  ]

  return (
    <header className="sticky top-0 z-10 border-b bg-background">
      <div className="flex h-16 items-center px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2 font-bold">
          <span className="text-xl">LockIn</span>
        </Link>
        <nav className="ml-auto flex items-center gap-4 sm:gap-6">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-2 text-sm font-medium ${
                pathname === item.href ? "text-primary" : "text-muted-foreground hover:text-primary"
              }`}
            >
              <item.icon className="h-4 w-4" />
              <span className="hidden md:inline-block">{item.name}</span>
            </Link>
          ))}
          <Link
            href="/settings"
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary"
          >
            <Settings className="h-4 w-4" />
            <span className="hidden md:inline-block">Settings</span>
          </Link>
        </nav>
      </div>
    </header>
  )
}
