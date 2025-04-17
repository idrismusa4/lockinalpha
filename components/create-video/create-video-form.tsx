"use client"

import { useState } from "react"
import { Sparkles, Video, Wand2, Lightbulb } from "lucide-react"
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"

export default function CreateVideoForm() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [scriptLength, setScriptLength] = useState(300)
  const [aiPromptVisible, setAiPromptVisible] = useState(false)

  const handleGenerate = () => {
    setIsGenerating(true)
    // Simulate API call
    setTimeout(() => {
      setIsGenerating(false)
    }, 2000)
  }

  return (
    <Card className="border-2 border-slate-200 dark:border-slate-800 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Video className="h-5 w-5 text-purple-500" />
          New Video
        </CardTitle>
        <CardDescription>Create a new video by writing a script or using AI to generate content</CardDescription>
      </CardHeader>

      <Tabs defaultValue="write" className="px-6">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger
            value="write"
            className="data-[state=active]:bg-purple-100 dark:data-[state=active]:bg-purple-900/30 data-[state=active]:text-purple-700 dark:data-[state=active]:text-purple-300"
          >
            Write Script
          </TabsTrigger>
          <TabsTrigger
            value="ai"
            className="data-[state=active]:bg-blue-100 dark:data-[state=active]:bg-blue-900/30 data-[state=active]:text-blue-700 dark:data-[state=active]:text-blue-300"
          >
            AI Generate
          </TabsTrigger>
        </TabsList>

        <TabsContent value="write" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Video Title</Label>
            <Input
              id="title"
              placeholder="Enter a title for your video"
              className="border-slate-200 dark:border-slate-700"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="script">Your Script</Label>
            <Textarea
              id="script"
              placeholder="Write your script here. Be descriptive and clear about what you want to teach."
              className="min-h-[200px] border-slate-200 dark:border-slate-700"
            />
          </div>

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
        </TabsContent>

        <TabsContent value="ai" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ai-topic">Topic</Label>
            <Input
              id="ai-topic"
              placeholder="What would you like to create a video about?"
              className="border-slate-200 dark:border-slate-700"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="ai-length">Script Length (words)</Label>
              <span className="text-sm text-muted-foreground">{scriptLength}</span>
            </div>
            <Slider
              id="ai-length"
              min={100}
              max={1000}
              step={50}
              value={[scriptLength]}
              onValueChange={(value) => setScriptLength(value[0])}
              className="py-4"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="ai-advanced" className="cursor-pointer">
                Advanced Options
              </Label>
              <Switch id="ai-advanced" checked={aiPromptVisible} onCheckedChange={setAiPromptVisible} />
            </div>
          </div>

          {aiPromptVisible && (
            <div className="space-y-2 animate-in fade-in-50 duration-300">
              <Label htmlFor="ai-prompt">Custom AI Prompt</Label>
              <Textarea
                id="ai-prompt"
                placeholder="Provide specific instructions for the AI to follow when generating your script."
                className="min-h-[100px] border-slate-200 dark:border-slate-700"
              />
              <p className="text-xs text-muted-foreground">
                <Lightbulb className="inline h-3 w-3 mr-1" />
                Example: "Create a script explaining photosynthesis for high school students. Include 3 key points and a
                summary."
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ai-voice">Voice</Label>
              <Select defaultValue="sarah">
                <SelectTrigger id="ai-voice">
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
              <Label htmlFor="ai-style">Script Style</Label>
              <Select defaultValue="modern">
                <SelectTrigger id="ai-style">
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
        </TabsContent>
      </Tabs>

      <CardFooter className="flex justify-between border-t bg-slate-50/50 dark:bg-slate-800/20 p-6 mt-6">
        <Button variant="outline">Save Draft</Button>

        <Button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
        >
          {isGenerating ? (
            <>
              <Sparkles className="mr-2 h-4 w-4 animate-pulse" />
              Generating...
            </>
          ) : (
            <>
              <Wand2 className="mr-2 h-4 w-4" />
              Generate Video
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
