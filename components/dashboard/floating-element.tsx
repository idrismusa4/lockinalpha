"use client"

import { motion } from "framer-motion"

interface FloatingElementProps {
  className?: string
  size?: number
  color?: "purple" | "blue" | "green" | "amber"
  speed?: "slow" | "normal" | "fast"
}

export default function FloatingElement({
  className = "",
  size = 50,
  color = "purple",
  speed = "normal",
}: FloatingElementProps) {
  const colorMap = {
    purple: "bg-purple-500",
    blue: "bg-blue-500",
    green: "bg-green-500",
    amber: "bg-amber-500",
  }

  const speedMap = {
    slow: {
      y: [0, -15, 0],
      rotate: [0, 5, 0],
      transition: {
        duration: 12,
        repeat: Number.POSITIVE_INFINITY,
        ease: "easeInOut",
      },
    },
    normal: {
      y: [0, -15, 0],
      rotate: [0, 5, 0],
      transition: {
        duration: 8,
        repeat: Number.POSITIVE_INFINITY,
        ease: "easeInOut",
      },
    },
    fast: {
      y: [0, -15, 0],
      rotate: [0, 5, 0],
      transition: {
        duration: 6,
        repeat: Number.POSITIVE_INFINITY,
        ease: "easeInOut",
      },
    },
  }

  return (
    <motion.div
      className={`${colorMap[color]} ${className}`}
      style={{ width: size, height: size }}
      animate={speedMap[speed]}
    />
  )
}
