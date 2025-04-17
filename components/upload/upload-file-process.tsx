"use client"

import type React from "react"

import { useState, useRef } from "react"
import {
  Upload,
  File,
  X,
  FileText,
  FileIcon as FilePdf,
  FileImage,
  FileSpreadsheet,
  Sparkles,
  ArrowRight,
  Video,
  Play,
  Download,
  Share,
  Wand2,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type ProcessStep = "upload" | "processing" | "script" | "video-generation" | "result"

export default function UploadFileProcess() {
  const [files, setFiles] = useState<File[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [processingProgress, setProcessingProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState<ProcessStep>("upload")
  const [generatedScript, setGeneratedScript] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles(Array.from(e.target.files))
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFiles(Array.from(e.dataTransfer.files))
    }
  }

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index))
  }

  const handleUpload = () => {
    if (files.length === 0) return

    setIsUploading(true)
    setUploadProgress(0)

    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setIsUploading(false)
          setCurrentStep("processing")
          simulateProcessing()
          return 100
        }
        return prev + 5
      })
    }, 200)
  }

  const simulateProcessing = () => {
    setProcessingProgress(0)

    // Simulate AI processing the document
    const interval = setInterval(() => {
      setProcessingProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setGeneratedScript(`# Introduction to Biology

## Cell Structure and Function

Cells are the basic unit of life. All living organisms are composed of cells, from single-celled bacteria to complex multicellular organisms like humans.

### Key Components of a Cell:

1. **Cell Membrane**: Controls what enters and exits the cell
2. **Nucleus**: Contains the cell's genetic material (DNA)
3. **Cytoplasm**: Gel-like substance where cellular processes occur
4. **Mitochondria**: Produces energy for the cell

## Cellular Processes

Cells perform various functions essential for life:

- **Respiration**: Converting nutrients into energy
- **Protein Synthesis**: Creating proteins based on DNA instructions
- **Cell Division**: Reproduction and growth
- **Transport**: Moving substances in and out of the cell

## Types of Cells

There are two main types of cells:

1. **Prokaryotic Cells**: Simpler, lack a nucleus (e.g., bacteria)
2. **Eukaryotic Cells**: More complex, have a nucleus (e.g., plant and animal cells)

## Conclusion

Understanding cell biology is fundamental to all biological sciences and provides the foundation for studying more complex biological systems and processes.`)
          setCurrentStep("script")
          return 100
        }
        return prev + 2
      })
    }, 100)
  }

  const handleGenerateVideo = () => {
    setIsGeneratingVideo(true)
    setCurrentStep("video-generation")

    // Simulate video generation
    setTimeout(() => {
      setIsGeneratingVideo(false)
      setCurrentStep("result")
    }, 4000)
  }

  const getFileIcon = (file: File) => {
    const type = file.type

    if (type.includes("pdf")) return <FilePdf className="h-6 w-6 text-red-500" />
    if (type.includes("image")) return <FileImage className="h-6 w-6 text-purple-500" />
    if (type.includes("sheet") || type.includes("excel")) return <FileSpreadsheet className="h-6 w-6 text-green-500" />
    if (type.includes("document") || type.includes("word")) return <FileText className="h-6 w-6 text-blue-500" />

    return <File className="h-6 w-6 text-slate-500" />
  }

  const resetWorkflow = () => {
    setFiles([])
    setCurrentStep("upload")
    setGeneratedScript("")
    setUploadProgress(0)
    setProcessingProgress(0)
  }

  // Render the progress steps
  const renderProgressSteps = () => {
    const steps = [
      { id: "upload", label: "Upload" },
      { id: "processing", label: "Processing" },
      { id: "script", label: "Script" },
      { id: "result", label: "Video" },
    ]

    return (
      <div className="flex items-center justify-center mb-8">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div
              className={cn(
                "flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium",
                currentStep === step.id ||
                  (currentStep === "video-generation" && step.id === "result") ||
                  steps.findIndex((s) => s.id === currentStep) > steps.findIndex((s) => s.id === step.id)
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300"
                  : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
              )}
            >
              {index + 1}
            </div>
            <div
              className={cn(
                "ml-2 text-sm font-medium",
                currentStep === step.id ||
                  (currentStep === "video-generation" && step.id === "result") ||
                  steps.findIndex((s) => s.id === currentStep) > steps.findIndex((s) => s.id === step.id)
                  ? "text-blue-700 dark:text-blue-300"
                  : "text-slate-500 dark:text-slate-400",
              )}
            >
              {step.label}
            </div>

            {index < steps.length - 1 && (
              <div
                className={cn(
                  "mx-3 h-0.5 w-10",
                  steps.findIndex((s) => s.id === currentStep) > index
                    ? "bg-blue-300 dark:bg-blue-700"
                    : "bg-slate-200 dark:bg-slate-700",
                )}
              />
            )}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {renderProgressSteps()}

      {currentStep === "upload" && (
        <Card className="border-2 border-slate-200 dark:border-slate-800 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-blue-500" />
              Upload Documents
            </CardTitle>
            <CardDescription>Upload your documents to convert them into video lectures</CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* File upload area */}
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center ${
                isDragging
                  ? "border-blue-400 bg-blue-50 dark:border-blue-500 dark:bg-blue-900/20"
                  : "border-slate-300 dark:border-slate-700"
              } transition-colors`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                multiple
                accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.md,.xls,.xlsx,.csv"
              />

              <div className="flex flex-col items-center justify-center space-y-4 cursor-pointer">
                <div className="rounded-full bg-blue-100 dark:bg-blue-900/30 p-4">
                  <Upload className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-medium">Drag and drop your files here</p>
                  <p className="text-sm text-muted-foreground mt-1">or click to browse</p>
                </div>
                <p className="text-xs text-muted-foreground">Supports PDF, Word, PowerPoint, Excel, and text files</p>
              </div>
            </div>

            {/* File list */}
            {files.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Selected Files ({files.length})</h3>

                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
                  {files.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900"
                    >
                      <div className="flex items-center space-x-3">
                        {getFileIcon(file)}
                        <div className="overflow-hidden">
                          <p className="font-medium text-sm truncate">{file.name}</p>
                          <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation()
                          removeFile(index)
                        }}
                        className="h-8 w-8 rounded-full hover:bg-red-100 hover:text-red-500 dark:hover:bg-red-900/30"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upload options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="voice">Voice</Label>
                <Select defaultValue="sarah">
                  <SelectTrigger id="voice">
                    <SelectValue placeholder="Select a voice" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sarah">Sarah (Female)</SelectItem>
                    <SelectItem value="james">James (Male)</SelectItem>
                    <SelectItem value="emma">Emma (Female)</SelectItem>
                    <SelectItem value="david">David (Male)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="style">Script Style</Label>
                <Select defaultValue="modern">
                  <SelectTrigger id="style">
                    <SelectValue placeholder="Select a style" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="modern">Modern</SelectItem>
                    <SelectItem value="minimal">Minimal</SelectItem>
                    <SelectItem value="colorful">Colorful</SelectItem>
                    <SelectItem value="professional">Professional</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch id="ai-enhance" defaultChecked />
              <Label htmlFor="ai-enhance" className="cursor-pointer">
                AI-enhance content
              </Label>
              <span className="text-xs text-muted-foreground ml-1">
                (Improve clarity and structure of your content)
              </span>
            </div>
          </CardContent>

          <CardFooter className="flex justify-between border-t bg-slate-50/50 dark:bg-slate-800/20 p-6 mt-6">
            <Button variant="outline" onClick={() => setFiles([])}>
              Clear All
            </Button>

            <Button
              onClick={handleUpload}
              disabled={files.length === 0 || isUploading}
              className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
            >
              {isUploading ? (
                <>
                  <Sparkles className="mr-2 h-4 w-4 animate-pulse" />
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload & Process
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      )}

      {currentStep === "processing" && (
        <Card className="border-2 border-slate-200 dark:border-slate-800 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-500 animate-pulse" />
              Processing Your Document
            </CardTitle>
            <CardDescription>Our AI is analyzing your document and generating a script</CardDescription>
          </CardHeader>

          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="w-24 h-24 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-6">
              <Sparkles className="h-12 w-12 text-blue-600 dark:text-blue-400 animate-pulse" />
            </div>

            <h3 className="text-xl font-medium mb-2">AI Magic in Progress</h3>
            <p className="text-muted-foreground text-center max-w-md mb-8">
              We're extracting key information, organizing content, and creating a script for your video lecture.
            </p>

            <div className="w-full max-w-md space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Analyzing content...</span>
                <span className="text-sm font-medium">{processingProgress}%</span>
              </div>
              <Progress value={processingProgress} className="h-2" />
            </div>
          </CardContent>
        </Card>
      )}

      {currentStep === "script" && (
        <Card className="border-2 border-slate-200 dark:border-slate-800 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-500" />
              Generated Script
            </CardTitle>
            <CardDescription>AI-generated script based on your uploaded document</CardDescription>
          </CardHeader>

          <CardContent>
            <Tabs defaultValue="preview" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="preview">Preview</TabsTrigger>
                <TabsTrigger value="edit">Edit</TabsTrigger>
              </TabsList>

              <TabsContent value="preview" className="mt-0">
                <div className="prose dark:prose-invert max-w-none border rounded-md p-4 bg-slate-50 dark:bg-slate-900">
                  <div
                    dangerouslySetInnerHTML={{
                      __html: generatedScript
                        .replace(/^# (.*$)/gm, "<h1>$1</h1>")
                        .replace(/^## (.*$)/gm, "<h2>$1</h2>")
                        .replace(/^### (.*$)/gm, "<h3>$1</h3>")
                        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                        .replace(/\n- (.*)/g, "<ul><li>$1</li></ul>")
                        .replace(/<\/ul><ul>/g, "")
                        .replace(/\n/g, "<br />"),
                    }}
                  />
                </div>
              </TabsContent>

              <TabsContent value="edit" className="mt-0">
                <Textarea
                  value={generatedScript}
                  onChange={(e) => setGeneratedScript(e.target.value)}
                  className="min-h-[400px] font-mono text-sm"
                />
              </TabsContent>
            </Tabs>
          </CardContent>

          <CardFooter className="flex justify-between border-t bg-slate-50/50 dark:bg-slate-800/20 p-6 mt-6">
            <Button variant="outline" onClick={resetWorkflow}>
              Start Over
            </Button>

            <Button
              onClick={handleGenerateVideo}
              className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
            >
              <Wand2 className="mr-2 h-4 w-4" />
              Generate Video
            </Button>
          </CardFooter>
        </Card>
      )}

      {currentStep === "video-generation" && (
        <Card className="border-2 border-slate-200 dark:border-slate-800 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="h-5 w-5 text-blue-500 animate-pulse" />
              Generating Video
            </CardTitle>
            <CardDescription>Creating your video lecture from the generated script</CardDescription>
          </CardHeader>

          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="w-24 h-24 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-6">
              <Video className="h-12 w-12 text-blue-600 dark:text-blue-400 animate-pulse" />
            </div>

            <h3 className="text-xl font-medium mb-2">Creating Your Video</h3>
            <p className="text-muted-foreground text-center max-w-md mb-8">
              We're generating visuals, adding narration, and producing your video lecture.
            </p>

            <div className="w-full max-w-md space-y-2">
              <Progress value={65} className="h-2" />
            </div>
          </CardContent>
        </Card>
      )}

      {currentStep === "result" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-2 border-slate-200 dark:border-slate-800 shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-500" />
                  Generated Script
                </CardTitle>
                <Badge
                  variant="outline"
                  className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800"
                >
                  Ready
                </Badge>
              </div>
              <CardDescription>AI-generated script based on your uploaded document</CardDescription>
            </CardHeader>

            <CardContent className="h-[500px] overflow-y-auto">
              <Tabs defaultValue="preview" className="w-full">
                <TabsList className="mb-4 sticky top-0 z-10 bg-card">
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                  <TabsTrigger value="edit">Edit</TabsTrigger>
                </TabsList>

                <TabsContent value="preview" className="mt-0">
                  <div className="prose dark:prose-invert max-w-none border rounded-md p-4 bg-slate-50 dark:bg-slate-900">
                    <div
                      dangerouslySetInnerHTML={{
                        __html: generatedScript
                          .replace(/^# (.*$)/gm, "<h1>$1</h1>")
                          .replace(/^## (.*$)/gm, "<h2>$1</h2>")
                          .replace(/^### (.*$)/gm, "<h3>$1</h3>")
                          .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                          .replace(/\n- (.*)/g, "<ul><li>$1</li></ul>")
                          .replace(/<\/ul><ul>/g, "")
                          .replace(/\n/g, "<br />"),
                      }}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="edit" className="mt-0">
                  <Textarea
                    value={generatedScript}
                    onChange={(e) => setGeneratedScript(e.target.value)}
                    className="min-h-[400px] font-mono text-sm"
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <Card className="border-2 border-slate-200 dark:border-slate-800 shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <Video className="h-5 w-5 text-blue-500" />
                  Generated Video
                </CardTitle>
                <Badge
                  variant="outline"
                  className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800"
                >
                  Ready
                </Badge>
              </div>
              <CardDescription>Video lecture created from your script</CardDescription>
            </CardHeader>

            <CardContent>
              <div className="aspect-video bg-slate-800 rounded-md flex items-center justify-center overflow-hidden relative mb-4">
                <img
                  src="/placeholder.svg?height=480&width=854"
                  alt="Video preview"
                  className="w-full h-full object-cover opacity-50"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Button size="icon" variant="secondary" className="rounded-full h-16 w-16">
                    <Play className="h-8 w-8" />
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Introduction to Biology</h3>
                    <p className="text-sm text-muted-foreground">Generated from Biology_Notes.pdf</p>
                  </div>
                  <div className="text-sm text-muted-foreground">Duration: 5:24</div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                  <Button variant="outline" size="sm">
                    <Share className="mr-2 h-4 w-4" />
                    Share
                  </Button>
                  <Button variant="outline" size="sm">
                    <FileText className="mr-2 h-4 w-4" />
                    View Transcript
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="lg:col-span-2 flex justify-between">
            <Button variant="outline" onClick={resetWorkflow}>
              Create Another Video
            </Button>

            <Button className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700">
              <ArrowRight className="mr-2 h-4 w-4" />
              Go to My Videos
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
