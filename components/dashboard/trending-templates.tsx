"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function TrendingTemplates() {
  // Mock data for trending templates
  const templates = [
    {
      id: 1,
      title: "Science Explainer",
      description: "Perfect for explaining scientific concepts",
      color: "from-blue-500 to-cyan-500",
    },
    {
      id: 2,
      title: "Math Tutorial",
      description: "Step-by-step math problem solving",
      color: "from-purple-500 to-pink-500",
    },
    {
      id: 3,
      title: "History Timeline",
      description: "Visualize historical events in sequence",
      color: "from-amber-500 to-orange-500",
    },
  ]

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Trending Templates</CardTitle>
        <CardDescription>Popular templates to get you started quickly</CardDescription>
      </CardHeader>
      <CardContent>
        <motion.div className="space-y-4" variants={container} initial="hidden" animate="show">
          {templates.map((template) => (
            <motion.div
              key={template.id}
              className="relative overflow-hidden rounded-lg p-4 transition-all hover:shadow-md"
              variants={item}
              whileHover={{
                scale: 1.03,
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
              }}
            >
              <div className={`absolute inset-0 bg-gradient-to-r ${template.color} opacity-10`} />
              <h3 className="font-medium">{template.title}</h3>
              <p className="text-sm text-muted-foreground mb-3">{template.description}</p>
              <Button variant="outline" size="sm">
                Use Template
              </Button>
            </motion.div>
          ))}
          <motion.div variants={item} whileHover={{ scale: 1.02 }}>
            <Button variant="ghost" className="w-full text-sm">
              View All Templates
            </Button>
          </motion.div>
        </motion.div>
      </CardContent>
    </Card>
  )
}
