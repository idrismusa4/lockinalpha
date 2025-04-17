import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function UpcomingFeatures() {
  const features = [
    {
      title: "User Authentication",
      description: "Secure login and user accounts",
      status: "Coming Soon",
    },
    {
      title: "Custom Templates",
      description: "Create and save your own templates",
      status: "In Development",
    },
    {
      title: "Team Collaboration",
      description: "Share and collaborate on videos",
      status: "Planned",
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upcoming Features</CardTitle>
        <CardDescription>New features coming to LockIn</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {features.map((feature) => (
          <div key={feature.title} className="flex items-start justify-between">
            <div>
              <p className="font-medium">{feature.title}</p>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
            <Badge variant="outline">{feature.status}</Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
