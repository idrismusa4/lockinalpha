"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Play, Download, Share2, MoreHorizontal, Clock, Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Mock data for videos
const videos = [
  {
    id: "vid-1",
    title: "Introduction to Biology",
    thumbnail: "/placeholder.svg?height=180&width=320",
    duration: "12:34",
    date: "2 days ago",
    status: "completed",
    views: 45,
  },
  {
    id: "vid-2",
    title: "Advanced Mathematics Concepts",
    thumbnail: "/placeholder.svg?height=180&width=320",
    duration: "18:22",
    date: "1 week ago",
    status: "completed",
    views: 32,
  },
  {
    id: "vid-3",
    title: "History of Ancient Civilizations",
    thumbnail: "/placeholder.svg?height=180&width=320",
    duration: "24:15",
    date: "2 weeks ago",
    status: "completed",
    views: 28,
  },
  {
    id: "vid-4",
    title: "Physics Fundamentals",
    thumbnail: "/placeholder.svg?height=180&width=320",
    duration: "--:--",
    date: "Just now",
    status: "processing",
    views: 0,
  },
]

export default function RecentVideos() {
  const [activeTab, setActiveTab] = useState("all")

  return (
    <div>
      <Tabs defaultValue="all" className="mb-6" onValueChange={setActiveTab}>
        <div className="flex justify-between items-center">
          <TabsList className="bg-slate-100 dark:bg-slate-800">
            <TabsTrigger value="all">All Videos</TabsTrigger>
            <TabsTrigger value="recent">Recent</TabsTrigger>
            <TabsTrigger value="popular">Popular</TabsTrigger>
          </TabsList>

          <Button variant="outline" size="sm">
            View All
          </Button>
        </div>

        <TabsContent value="all" className="mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {videos.map((video, index) => (
              <VideoCard key={video.id} video={video} index={index} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="recent" className="mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {videos.slice(0, 2).map((video, index) => (
              <VideoCard key={video.id} video={video} index={index} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="popular" className="mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {videos.slice(1, 3).map((video, index) => (
              <VideoCard key={video.id} video={video} index={index} />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function VideoCard({ video, index }: { video: any; index: number }) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ scale: 1.03 }}
      className="group relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-all card-hover"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative aspect-video bg-slate-100 dark:bg-slate-800">
        <img src={video.thumbnail || "/placeholder.svg"} alt={video.title} className="w-full h-full object-cover" />

        {video.status === "processing" ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="flex flex-col items-center">
              <Clock className="h-8 w-8 text-white animate-pulse" />
              <span className="text-white text-sm mt-2">Processing...</span>
            </div>
          </div>
        ) : (
          <motion.div
            className="absolute inset-0 flex items-center justify-center bg-black/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: isHovered ? 1 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
              <Button size="icon" variant="secondary" className="rounded-full h-12 w-12">
                <Play className="h-6 w-6" />
              </Button>
            </motion.div>
          </motion.div>
        )}

        <div className="absolute bottom-2 right-2">
          <Badge variant="secondary" className="bg-black/70 text-white border-none">
            {video.duration}
          </Badge>
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-medium line-clamp-1">{video.title}</h3>
        <div className="flex justify-between items-center mt-2">
          <span className="text-xs text-muted-foreground">{video.date}</span>
          <span className="text-xs text-muted-foreground">{video.views} views</span>
        </div>

        <div className="flex justify-between items-center mt-4">
          <div className="flex space-x-1">
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
              <Button variant="ghost" size="icon" className="h-8 w-8" disabled={video.status === "processing"}>
                <Download className="h-4 w-4" />
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
              <Button variant="ghost" size="icon" className="h-8 w-8" disabled={video.status === "processing"}>
                <Share2 className="h-4 w-4" />
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Heart className="h-4 w-4" />
              </Button>
            </motion.div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Options</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Edit</DropdownMenuItem>
              <DropdownMenuItem>Duplicate</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-500">Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </motion.div>
  )
}
