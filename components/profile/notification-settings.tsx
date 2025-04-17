"use client"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/components/ui/use-toast"

export default function NotificationSettings() {
  const saveNotificationSettings = () => {
    // In a real app, you would send this to your backend
    toast({
      title: "Notification settings updated",
      description: "Your notification preferences have been saved.",
    })
  }

  return (
    <Card className="border-2 border-slate-200 dark:border-slate-800 shadow-sm">
      <CardHeader>
        <CardTitle>Notification Preferences</CardTitle>
        <CardDescription>Control when and how you receive notifications</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Email Notifications</h3>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div className="space-y-0.5">
                <Label htmlFor="email-video-complete">Video Complete</Label>
                <p className="text-sm text-muted-foreground">Receive notifications when your videos are ready</p>
              </div>
              <Switch id="email-video-complete" defaultChecked />
            </div>

            <div className="flex justify-between items-center">
              <div className="space-y-0.5">
                <Label htmlFor="email-new-features">New Features</Label>
                <p className="text-sm text-muted-foreground">Get notified about new features and updates</p>
              </div>
              <Switch id="email-new-features" defaultChecked />
            </div>

            <div className="flex justify-between items-center">
              <div className="space-y-0.5">
                <Label htmlFor="email-marketing">Marketing</Label>
                <p className="text-sm text-muted-foreground">Receive marketing emails and promotions</p>
              </div>
              <Switch id="email-marketing" />
            </div>
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <h3 className="text-lg font-medium">In-App Notifications</h3>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div className="space-y-0.5">
                <Label htmlFor="app-video-complete">Video Complete</Label>
                <p className="text-sm text-muted-foreground">Receive in-app notifications when your videos are ready</p>
              </div>
              <Switch id="app-video-complete" defaultChecked />
            </div>

            <div className="flex justify-between items-center">
              <div className="space-y-0.5">
                <Label htmlFor="app-new-features">New Features</Label>
                <p className="text-sm text-muted-foreground">Get notified in-app about new features and updates</p>
              </div>
              <Switch id="app-new-features" defaultChecked />
            </div>

            <div className="flex justify-between items-center">
              <div className="space-y-0.5">
                <Label htmlFor="app-comments">Comments</Label>
                <p className="text-sm text-muted-foreground">Get notified when someone comments on your videos</p>
              </div>
              <Switch id="app-comments" defaultChecked />
            </div>

            <div className="flex justify-between items-center">
              <div className="space-y-0.5">
                <Label htmlFor="app-mentions">Mentions</Label>
                <p className="text-sm text-muted-foreground">Get notified when someone mentions you</p>
              </div>
              <Switch id="app-mentions" defaultChecked />
            </div>
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Push Notifications</h3>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div className="space-y-0.5">
                <Label htmlFor="push-video-complete">Video Complete</Label>
                <p className="text-sm text-muted-foreground">Receive push notifications when your videos are ready</p>
              </div>
              <Switch id="push-video-complete" defaultChecked />
            </div>

            <div className="flex justify-between items-center">
              <div className="space-y-0.5">
                <Label htmlFor="push-new-features">New Features</Label>
                <p className="text-sm text-muted-foreground">Get push notifications about new features and updates</p>
              </div>
              <Switch id="push-new-features" />
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex justify-between border-t bg-slate-50/50 dark:bg-slate-800/20 p-6 mt-6">
        <Button variant="outline">Reset to Defaults</Button>
        <Button
          onClick={saveNotificationSettings}
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
        >
          Save Changes
        </Button>
      </CardFooter>
    </Card>
  )
}
