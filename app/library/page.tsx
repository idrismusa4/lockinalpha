import type { Metadata } from "next"
import { Search, Filter, SlidersHorizontal } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import VideoGallery from "@/components/library/video-gallery"
import VideoList from "@/components/library/video-list"

export const metadata: Metadata = {
  title: "My Video Library | LockIn",
  description: "View and manage all your video lectures in one place",
}

export default function LibraryPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 px-4 py-8 md:px-8 lg:px-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">
            My Video Library
          </h1>
          <p className="text-muted-foreground mt-2">View and manage all your created video lectures</p>
        </div>

        {/* Search and filter bar */}
        <div className="flex flex-col gap-4 sm:flex-row items-center justify-between mb-8">
          <div className="relative w-full sm:w-72 md:w-96">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input type="search" placeholder="Search videos..." className="w-full pl-8 bg-white dark:bg-slate-900" />
          </div>

          <div className="flex gap-3 w-full sm:w-auto">
            <Select defaultValue="newest">
              <SelectTrigger className="w-full sm:w-40 bg-white dark:bg-slate-900">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="oldest">Oldest</SelectItem>
                <SelectItem value="a-z">A-Z</SelectItem>
                <SelectItem value="views">Most Views</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" className="bg-white dark:bg-slate-900">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>

            <Button variant="outline" className="bg-white dark:bg-slate-900">
              <SlidersHorizontal className="h-4 w-4" />
              <span className="sr-only">Settings</span>
            </Button>
          </div>
        </div>

        {/* Tabs for different views */}
        <Card className="border-2 border-slate-200 dark:border-slate-800 shadow-sm mb-6">
          <CardHeader className="pb-2">
            <CardTitle>Video Collection</CardTitle>
            <CardDescription>Browse and manage your videos</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="grid" className="w-full">
              <div className="flex justify-between items-center mb-6">
                <TabsList className="bg-slate-100 dark:bg-slate-800">
                  <TabsTrigger value="grid">Grid View</TabsTrigger>
                  <TabsTrigger value="list">List View</TabsTrigger>
                  <TabsTrigger value="recent">Recent</TabsTrigger>
                  <TabsTrigger value="favorites">Favorites</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="grid" className="m-0">
                <VideoGallery />
              </TabsContent>

              <TabsContent value="list" className="m-0">
                <VideoList />
              </TabsContent>

              <TabsContent value="recent" className="m-0">
                <VideoGallery recentOnly={true} />
              </TabsContent>

              <TabsContent value="favorites" className="m-0">
                <div className="text-center py-12">
                  <p className="text-muted-foreground">You haven't favorited any videos yet.</p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
