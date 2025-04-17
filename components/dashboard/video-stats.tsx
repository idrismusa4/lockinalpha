import { Film, Upload, Clock, Users } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function VideoStats() {
  // In a real app, these would come from your backend
  const stats = [
    {
      title: "Total Videos",
      value: "12",
      icon: Film,
      description: "Videos created",
      change: "+2 from last week",
      changeType: "increase",
    },
    {
      title: "Uploads",
      value: "8",
      icon: Upload,
      description: "Documents uploaded",
      change: "+3 from last week",
      changeType: "increase",
    },
    {
      title: "Processing",
      value: "2",
      icon: Clock,
      description: "Videos in progress",
      change: "No change",
      changeType: "neutral",
    },
    {
      title: "Shares",
      value: "24",
      icon: Users,
      description: "Video shares",
      change: "+5 from last week",
      changeType: "increase",
    },
  ]

  return (
    <>
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground">{stat.description}</p>
            <p
              className={`mt-1 text-xs ${
                stat.changeType === "increase"
                  ? "text-green-500"
                  : stat.changeType === "decrease"
                    ? "text-red-500"
                    : "text-muted-foreground"
              }`}
            >
              {stat.change}
            </p>
          </CardContent>
        </Card>
      ))}
    </>
  )
}
