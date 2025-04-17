import type React from "react"
import { cn } from "@/lib/utils"

interface GridBackgroundProps {
  className?: string
  children?: React.ReactNode
  gridSize?: number
  lineColor?: string
}

export default function GridBackground({
  className,
  children,
  gridSize = 20,
  lineColor = "rgba(0, 0, 0, 0.05)",
}: GridBackgroundProps) {
  return (
    <div className={cn("relative overflow-hidden", className)}>
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, ${lineColor} 1px, transparent 1px),
            linear-gradient(to bottom, ${lineColor} 1px, transparent 1px)
          `,
          backgroundSize: `${gridSize}px ${gridSize}px`,
        }}
      />

      {/* Floating elements */}
      <div className="absolute top-20 left-[10%] w-12 h-12 bg-black/10 dark:bg-white/10 rounded-lg opacity-30 animate-float-slow" />

      <div className="absolute top-40 right-[15%] w-16 h-16 bg-black/10 dark:bg-white/10 rounded-lg opacity-20 animate-float" />

      <div className="absolute bottom-32 left-[30%] w-10 h-10 bg-black/10 dark:bg-white/10 rounded-lg opacity-25 animate-float-fast" />

      {children}
    </div>
  )
}
