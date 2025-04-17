"use client"

import { useState, useRef } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Video, Upload, Sparkles, ArrowRight } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import FloatingElement from "./floating-element"

export default function DashboardCTA() {
  const [activeCard, setActiveCard] = useState<string | null>(null)
  const constraintsRef = useRef(null)

  return (
    <div className="relative" ref={constraintsRef}>
      {/* Floating elements */}
      <motion.div
        className="absolute -top-10 -left-10 z-0 opacity-30 dark:opacity-20"
        drag
        dragConstraints={constraintsRef}
        whileDrag={{ scale: 1.1 }}
      >
        <FloatingElement color="purple" size={60} speed="slow" className="rounded-lg rotate-12" />
      </motion.div>

      <motion.div
        className="absolute top-20 right-10 z-0 opacity-30 dark:opacity-20"
        drag
        dragConstraints={constraintsRef}
        whileDrag={{ scale: 1.1 }}
      >
        <FloatingElement color="blue" size={40} speed="normal" className="rounded-lg -rotate-6" />
      </motion.div>

      <motion.div
        className="absolute bottom-10 left-1/4 z-0 opacity-30 dark:opacity-20"
        drag
        dragConstraints={constraintsRef}
        whileDrag={{ scale: 1.1 }}
      >
        <FloatingElement color="green" size={30} speed="fast" className="rounded-lg rotate-45" />
      </motion.div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 relative z-10">
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          <Link
            href="/create-videos"
            className="block"
            onMouseEnter={() => setActiveCard("create")}
            onMouseLeave={() => setActiveCard(null)}
          >
            <Card
              className={cn(
                "group relative overflow-hidden border-2 transition-all duration-300 hover:shadow-lg",
                activeCard === "create"
                  ? "border-purple-400 dark:border-purple-600 shadow-lg"
                  : "border-slate-200 dark:border-slate-800",
              )}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 opacity-20 group-hover:opacity-40 transition-opacity" />
              <CardContent className="p-6 md:p-8">
                <motion.div
                  className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30"
                  whileHover={{ rotate: [0, -10, 10, -10, 0] }}
                  transition={{ duration: 0.5 }}
                >
                  <Video className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </motion.div>
                <h3 className="text-xl font-semibold mb-2">Create a Video</h3>
                <p className="text-muted-foreground mb-6">
                  Write a script or use AI to generate engaging video lectures from your ideas.
                </p>
                <div className="flex items-center text-purple-600 font-medium group-hover:text-purple-700 transition-colors">
                  Start Creating
                  <motion.div
                    animate={activeCard === "create" ? { x: [0, 5, 0] } : {}}
                    transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1 }}
                  >
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </motion.div>
                </div>
                <div className="absolute bottom-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Sparkles className="h-24 w-24 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          <Link
            href="/upload-files"
            className="block"
            onMouseEnter={() => setActiveCard("upload")}
            onMouseLeave={() => setActiveCard(null)}
          >
            <Card
              className={cn(
                "group relative overflow-hidden border-2 transition-all duration-300 hover:shadow-lg",
                activeCard === "upload"
                  ? "border-blue-400 dark:border-blue-600 shadow-lg"
                  : "border-slate-200 dark:border-slate-800",
              )}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 opacity-20 group-hover:opacity-40 transition-opacity" />
              <CardContent className="p-6 md:p-8">
                <motion.div
                  className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30"
                  whileHover={{ y: [0, -5, 0] }}
                  transition={{ duration: 0.5 }}
                >
                  <Upload className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </motion.div>
                <h3 className="text-xl font-semibold mb-2">Upload Files</h3>
                <p className="text-muted-foreground mb-6">
                  Convert your study materials, notes, and documents into engaging video lectures.
                </p>
                <div className="flex items-center text-blue-600 font-medium group-hover:text-blue-700 transition-colors">
                  Upload Now
                  <motion.div
                    animate={activeCard === "upload" ? { x: [0, 5, 0] } : {}}
                    transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1 }}
                  >
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </motion.div>
                </div>
                <div className="absolute bottom-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Sparkles className="h-24 w-24 text-blue-600" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </motion.div>
      </div>
    </div>
  )
}
