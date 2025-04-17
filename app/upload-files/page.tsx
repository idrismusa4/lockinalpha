import type { Metadata } from "next"
import UploadFileProcess from "@/components/upload/upload-file-process"
import { ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Upload Files | LockIn",
  description: "Upload your documents and convert them to engaging video lectures",
}

export default function UploadFilesPage() {
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
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
              Upload Files
            </h1>
            <p className="text-muted-foreground mt-2">
              Convert your documents, slides, and notes into engaging video lectures
            </p>
          </div>
        </div>

        <UploadFileProcess />
      </main>
    </div>
  )
}
