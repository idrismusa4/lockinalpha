import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Upload, Video } from "lucide-react"
import Link from "next/link"

export default function QuickActions() {
  const actions = [
    {
      title: "Create Video",
      description: "Create a new video from a script",
      icon: Video,
      href: "/create-videos",
      variant: "default" as const,
    },
    {
      title: "Upload Document",
      description: "Convert documents to videos",
      icon: Upload,
      href: "/upload-files",
      variant: "outline" as const,
    },
    {
      title: "View Templates",
      description: "Use pre-made templates",
      icon: FileText,
      href: "#",
      variant: "outline" as const,
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Quickly access common features</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {actions.map((action) => (
          <Button key={action.title} variant={action.variant} className="justify-start h-auto py-3" asChild>
            <Link href={action.href}>
              <action.icon className="mr-2 h-5 w-5" />
              <div className="flex flex-col items-start text-left">
                <span>{action.title}</span>
                <span className="text-xs text-muted-foreground">{action.description}</span>
              </div>
            </Link>
          </Button>
        ))}
      </CardContent>
    </Card>
  )
}
