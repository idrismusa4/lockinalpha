import type { Metadata } from "next"
import CreateVideoForm from "@/components/create-video/create-video-form"
import VideoTemplates from "@/components/create-video/video-templates"
import RecentScripts from "@/components/create-video/recent-scripts"
import { ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Create a Video | LockIn",
  description: "Create engaging video lectures from your scripts or ideas",
}

export default function CreateVideoPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 px-4 py-8 md:px-8 lg:px-12">
        <div className="flex items-center mb-8">
          <Button variant="ghost" size="sm" className="mr-4" asChild>
            <Link href="/dashboard">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Dashboard
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">
              Create a Video
            </h1>
            <p className="text-muted-foreground mt-2">Turn your ideas into engaging video lectures in minutes</p>
          </div>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {/* Main content - 2/3 width on desktop */}
          <div className="md:col-span-2 space-y-8">
            <CreateVideoForm />
            <RecentScripts />
          </div>

          {/* Sidebar - 1/3 width on desktop */}
          <div>
            <VideoTemplates />
          </div>
        </div>
      </main>
    </div>
  )
}
