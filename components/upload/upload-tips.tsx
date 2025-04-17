import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Lightbulb, CheckCircle2 } from "lucide-react"

export default function UploadTips() {
  // Tips for better uploads
  const tips = [
    {
      title: "Use clear formatting",
      description: "Documents with clear headings and structure convert better",
    },
    {
      title: "Include images",
      description: "Images will be included in your video for visual context",
    },
    {
      title: "Keep it concise",
      description: "Shorter documents (5-10 pages) produce better videos",
    },
    {
      title: "Check for errors",
      description: "Proofread your document before uploading for best results",
    },
  ]

  // Supported file types
  const fileTypes = [
    { name: "PDF", extension: ".pdf" },
    { name: "Word", extension: ".doc, .docx" },
    { name: "PowerPoint", extension: ".ppt, .pptx" },
    { name: "Text", extension: ".txt" },
    { name: "Markdown", extension: ".md" },
    { name: "Excel", extension: ".xls, .xlsx" },
  ]

  return (
    <div className="space-y-6">
      <Card className="border-2 border-slate-200 dark:border-slate-800 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-amber-500" />
            Tips for Better Results
          </CardTitle>
          <CardDescription>Follow these tips for better video conversions</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-4">
            {tips.map((tip, index) => (
              <li key={index} className="flex gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">{tip.title}</p>
                  <p className="text-sm text-muted-foreground">{tip.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card className="border-2 border-slate-200 dark:border-slate-800 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Supported File Types</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            {fileTypes.map((type, index) => (
              <div key={index} className="rounded-md bg-slate-100 dark:bg-slate-800 p-2">
                <p className="font-medium text-sm">{type.name}</p>
                <p className="text-xs text-muted-foreground">{type.extension}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
