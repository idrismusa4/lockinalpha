"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Video, Upload, Download, Edit } from "lucide-react"

export default function RecentActivity() {
  // Mock data for recent activities
  const activities = [
    {
      id: 1,
      type: "video_created",
      title: "Created a new video",
      description: "Physics Fundamentals",
      time: "Just now",
      icon: Video,
    },
    {
      id: 2,
      type: "file_uploaded",
      title: "Uploaded a document",
      description: "Chemistry Notes.pdf",
      time: "2 hours ago",
      icon: Upload,
    },
    {
      id: 3,
      type: "video_downloaded",
      title: "Downloaded a video",
      description: "Introduction to Biology",
      time: "Yesterday",
      icon: Download,
    },
    {
      id: 4,
      type: "script_edited",
      title: "Edited a script",
      description: "Advanced Mathematics Concepts",
      time: "2 days ago",
      icon: Edit,
    },
  ]

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  }

  const item = {
    hidden: { opacity: 0, x: -20 },
    show: { opacity: 1, x: 0 },
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Your latest actions and updates</CardDescription>
      </CardHeader>
      <CardContent>
        <motion.div className="space-y-6" variants={container} initial="hidden" animate="show">
          {activities.map((activity) => (
            <motion.div key={activity.id} className="flex items-start gap-4" variants={item} whileHover={{ x: 5 }}>
              <motion.div
                className={`flex h-9 w-9 items-center justify-center rounded-full ${
                  activity.type === "video_created"
                    ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                    : activity.type === "file_uploaded"
                      ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                      : activity.type === "video_downloaded"
                        ? "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
                        : "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
                }`}
                whileHover={{ scale: 1.1, rotate: 10 }}
              >
                <activity.icon className="h-5 w-5" />
              </motion.div>
              <div className="flex-1 space-y-1">
                <p className="font-medium">{activity.title}</p>
                <p className="text-sm text-muted-foreground">{activity.description}</p>
                <p className="text-xs text-muted-foreground">{activity.time}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </CardContent>
    </Card>
  )
}
