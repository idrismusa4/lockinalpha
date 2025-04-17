"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"

export default function UserProfile() {
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: "Student Creator",
    title: "Video Creator",
    email: "student@example.com",
    bio: "I'm a student who loves creating educational video content to help others learn complex topics in simple ways.",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // In a real app, you would send this data to your backend
    setIsEditing(false)
    toast({
      title: "Profile updated",
      description: "Your profile information has been updated successfully.",
    })
  }

  return (
    <Card className="border-2 border-slate-200 dark:border-slate-800 shadow-sm">
      <CardHeader>
        <CardTitle>Profile Information</CardTitle>
        <CardDescription>Update your profile information and manage how your profile appears</CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex flex-col items-center">
              <Avatar className="h-24 w-24 border-2 border-slate-200 dark:border-slate-700">
                <AvatarImage src="/placeholder.svg?height=96&width=96" alt="Profile" />
                <AvatarFallback>SC</AvatarFallback>
              </Avatar>

              <div className="mt-4 flex flex-col gap-2">
                <Button type="button" variant="outline" size="sm" className="w-full">
                  Change Photo
                </Button>
                <Button type="button" variant="ghost" size="sm" className="w-full text-red-500">
                  Remove Photo
                </Button>
              </div>
            </div>

            <div className="flex-1 space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Your name"
                    value={formData.name}
                    onChange={handleChange}
                    disabled={!isEditing}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    name="title"
                    placeholder="Your title"
                    value={formData.title}
                    onChange={handleChange}
                    disabled={!isEditing}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Your email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={!isEditing}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  name="bio"
                  placeholder="Tell us about yourself"
                  value={formData.bio}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="min-h-[100px]"
                />
              </div>
            </div>
          </div>
        </form>
      </CardContent>

      <CardFooter className="flex justify-between border-t bg-slate-50/50 dark:bg-slate-800/20 p-6 mt-6">
        {isEditing ? (
          <>
            <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              Save Changes
            </Button>
          </>
        ) : (
          <>
            <div></div> {/* Empty div for spacing */}
            <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
          </>
        )}
      </CardFooter>
    </Card>
  )
}
