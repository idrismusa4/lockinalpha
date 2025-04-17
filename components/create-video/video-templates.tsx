import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sparkles, Clock, Star } from "lucide-react"

export default function VideoTemplates() {
  // Mock data for templates
  const templates = [
    {
      id: 1,
      title: "Lecture Presentation",
      description: "Classic lecture format with slides and narration",
      duration: "5-10 min",
      popular: true,
      color: "from-purple-500 to-blue-500",
    },
    {
      id: 2,
      title: "Concept Explainer",
      description: "Visual explanations of complex concepts",
      duration: "3-5 min",
      popular: true,
      color: "from-blue-500 to-cyan-500",
    },
    {
      id: 3,
      title: "Problem Solver",
      description: "Step-by-step problem solving walkthrough",
      duration: "5-8 min",
      popular: false,
      color: "from-amber-500 to-orange-500",
    },
    {
      id: 4,
      title: "Quick Review",
      description: "Fast-paced review of key points",
      duration: "2-3 min",
      popular: false,
      color: "from-green-500 to-emerald-500",
    },
  ]

  return (
    <Card className="border-2 border-slate-200 dark:border-slate-800 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-500" />
          Video Templates
        </CardTitle>
        <CardDescription>Start with a template to create your video faster</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {templates.map((template) => (
          <div
            key={template.id}
            className="relative overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800 p-4 transition-all hover:shadow-md hover:border-purple-200 dark:hover:border-purple-800"
          >
            <div className={`absolute inset-0 bg-gradient-to-r ${template.color} opacity-5 dark:opacity-10`} />

            <div className="flex justify-between items-start mb-2">
              <h3 className="font-medium">{template.title}</h3>
              {template.popular && (
                <Badge
                  variant="outline"
                  className="bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800"
                >
                  <Star className="h-3 w-3 mr-1 fill-amber-500 text-amber-500" />
                  Popular
                </Badge>
              )}
            </div>

            <p className="text-sm text-muted-foreground mb-3">{template.description}</p>

            <div className="flex justify-between items-center">
              <div className="flex items-center text-xs text-muted-foreground">
                <Clock className="h-3 w-3 mr-1" />
                {template.duration}
              </div>
              <Button variant="outline" size="sm">
                Use
              </Button>
            </div>
          </div>
        ))}

        <Button variant="ghost" size="sm" className="w-full text-muted-foreground hover:text-foreground">
          View All Templates
        </Button>
      </CardContent>
    </Card>
  )
}
