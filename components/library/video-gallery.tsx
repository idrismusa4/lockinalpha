"use client"

import { useState } from "react"
import { Play, Download, Share2, MoreHorizontal, Clock, Heart, Edit } from "lucide-react"
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

// Mock data for videos
const allVideos = [
  {
    id: "vid-1",
    title: "Introduction to Biology",
    thumbnail: "/placeholder.svg?height=180&width=320",
    duration: "12:34",
    date: "2 days ago",
    status: "completed",
    views: 45,
    subject: "Biology",
    favorite: false,
  },
  {
    id: "vid-2",
    title: "Advanced Mathematics Concepts",
    thumbnail: "/placeholder.svg?height=180&width=320",
    duration: "18:22",
    date: "1 week ago",
    status: "completed",
    views: 32,
    subject: "Mathematics",
    favorite: true,
  },
  {
    id: "vid-3",
    title: "History of Ancient Civilizations",
    thumbnail: "/placeholder.svg?height=180&width=320",
    duration: "24:15",
    date: "2 weeks ago",
    status: "completed",
    views: 28,
    subject: "History",
    favorite: false,
  },
  {
    id: "vid-4",
    title: "Physics Fundamentals",
    thumbnail: "/placeholder.svg?height=180&width=320",
    duration: "--:--",
    date: "Just now",
    status: "processing",
    views: 0,
    subject: "Physics",
    favorite: false,
  },
  {
    id: "vid-5",
    title: "Introduction to Chemistry",
    thumbnail: "/placeholder.svg?height=180&width=320",
    duration: "15:20",
    date: "3 days ago",
    status: "completed",
    views: 19,
    subject: "Chemistry",
    favorite: false,
  },
  {
    id: "vid-6",
    title: "English Literature Classics",
    thumbnail: "/placeholder.svg?height=180&width=320",
    duration: "22:45",
    date: "1 week ago",
    status: "completed",
    views: 27,
    subject: "Literature",
    favorite: true,
  },
  {
    id: "vid-7",
    title: "Geography: World Oceans",
    thumbnail: "/placeholder.svg?height=180&width=320",
    duration: "17:12",
    date: "5 days ago",
    status: "completed",
    views: 31,
    subject: "Geography",
    favorite: false,
  },
  {
    id: "vid-8",
    title: "Computer Science Basics",
    thumbnail: "/placeholder.svg?height=180&width=320",
    duration: "--:--",
    date: "1 hour ago",
    status: "processing",
    views: 0,
    subject: "Computer Science",
    favorite: false,
  },
]

interface VideoGalleryProps {
  recentOnly?: boolean
}

export default function VideoGallery({ recentOnly = false }: VideoGalleryProps) {
  const [videos, setVideos] = useState(allVideos)

  const toggleFavorite = (id: string) => {
    setVideos(videos.map((video) => (video.id === id ? { ...video, favorite: !video.favorite } : video)))
  }

  // If recentOnly is true, only show the first 4 videos
  const displayVideos = recentOnly ? videos.slice(0, 4) : videos

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {displayVideos.map((video) => (
        <VideoCard key={video.id} video={video} onToggleFavorite={() => toggleFavorite(video.id)} />
      ))}
    </div>
  )
}

function VideoCard({ video, onToggleFavorite }: { video: any; onToggleFavorite: () => void }) {
  return (
    <div className="group relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-all hover:shadow-md">
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
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
            <Button size="icon" variant="secondary" className="rounded-full h-12 w-12">
              <Play className="h-6 w-6" />
            </Button>
          </div>
        )}

        <div className="absolute bottom-2 right-2">
          <Badge variant="secondary" className="bg-black/70 text-white border-none">
            {video.duration}
          </Badge>
        </div>

        <div className="absolute top-2 right-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation()
              onToggleFavorite()
            }}
            className="h-8 w-8 bg-black/30 hover:bg-black/50 text-white hover:text-white"
          >
            <Heart className={`h-4 w-4 ${video.favorite ? "fill-red-500 text-red-500" : ""}`} />
          </Button>
        </div>

        <div className="absolute top-2 left-2">
          <Badge variant="outline" className="bg-black/50 text-white border-none">
            {video.subject}
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
            <Button variant="ghost" size="icon" className="h-8 w-8" disabled={video.status === "processing"}>
              <Download className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" disabled={video.status === "processing"}>
              <Share2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" disabled={video.status === "processing"}>
              <Edit className="h-4 w-4" />
            </Button>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Video Options</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Edit Video</DropdownMenuItem>
              <DropdownMenuItem>Duplicate</DropdownMenuItem>
              <DropdownMenuItem>Download</DropdownMenuItem>
              <DropdownMenuItem>Share</DropdownMenuItem>
              <DropdownMenuItem onClick={onToggleFavorite}>
                {video.favorite ? "Remove from Favorites" : "Add to Favorites"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-500">Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}
