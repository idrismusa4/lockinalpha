"use client"

import { useState } from "react"
import { MoreHorizontal, Play, Heart, Edit, Download, Share2, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Mock data for videos - same as in video-gallery.tsx
const allVideos = [
  {
    id: "vid-1",
    title: "Introduction to Biology",
    thumbnail: "/placeholder.svg?height=60&width=80",
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
    thumbnail: "/placeholder.svg?height=60&width=80",
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
    thumbnail: "/placeholder.svg?height=60&width=80",
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
    thumbnail: "/placeholder.svg?height=60&width=80",
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
    thumbnail: "/placeholder.svg?height=60&width=80",
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
    thumbnail: "/placeholder.svg?height=60&width=80",
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
    thumbnail: "/placeholder.svg?height=60&width=80",
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
    thumbnail: "/placeholder.svg?height=60&width=80",
    duration: "--:--",
    date: "1 hour ago",
    status: "processing",
    views: 0,
    subject: "Computer Science",
    favorite: false,
  },
]

export default function VideoList() {
  const [videos, setVideos] = useState(allVideos)

  const toggleFavorite = (id: string) => {
    setVideos(videos.map((video) => (video.id === id ? { ...video, favorite: !video.favorite } : video)))
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[80px]"></TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Subject</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Views</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {videos.map((video) => (
            <TableRow key={video.id}>
              <TableCell>
                <div className="relative aspect-video w-20 bg-slate-100 dark:bg-slate-800 rounded overflow-hidden">
                  <img
                    src={video.thumbnail || "/placeholder.svg"}
                    alt={video.title}
                    className="w-full h-full object-cover"
                  />
                  {video.status === "completed" && (
                    <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity bg-black/50 flex items-center justify-center">
                      <Play className="h-4 w-4 text-white" />
                    </div>
                  )}
                  {video.status === "processing" && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <Clock className="h-4 w-4 text-white animate-pulse" />
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell className="font-medium">{video.title}</TableCell>
              <TableCell>{video.subject}</TableCell>
              <TableCell>{video.duration}</TableCell>
              <TableCell>{video.date}</TableCell>
              <TableCell>{video.views}</TableCell>
              <TableCell>
                <Badge
                  variant={video.status === "completed" ? "default" : "secondary"}
                  className={video.status === "processing" ? "animate-pulse" : ""}
                >
                  {video.status === "completed" ? "Completed" : "Processing"}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground"
                    onClick={() => toggleFavorite(video.id)}
                  >
                    <Heart className={`h-4 w-4 ${video.favorite ? "fill-red-500 text-red-500" : ""}`} />
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Video Options</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        <Play className="mr-2 h-4 w-4" />
                        Play Video
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Video
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Share2 className="mr-2 h-4 w-4" />
                        Share
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => toggleFavorite(video.id)}>
                        <Heart className={`mr-2 h-4 w-4 ${video.favorite ? "fill-red-500 text-red-500" : ""}`} />
                        {video.favorite ? "Remove from Favorites" : "Add to Favorites"}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-red-500">Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
