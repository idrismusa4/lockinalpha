"use client";

import { useEffect, useState } from "react";
import { UserProfile, UserButton } from "@clerk/nextjs";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Sparkles, ChevronLeft } from "lucide-react";
import Link from "next/link";

export default function ProfileSettingsPage() {
  const [selectedTab, setSelectedTab] = useState("profile");

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 px-4 py-8 md:px-8 lg:px-12">
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Link 
              href="/dashboard" 
              className="inline-flex items-center rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm font-medium text-slate-900 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">
                Profile & Settings
              </h1>
              <p className="text-muted-foreground mt-2">
                Manage your account, preferences, and settings
              </p>
            </div>
          </div>
          <div className="flex items-center">
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-8">
          <TabsList className="bg-slate-100 dark:bg-slate-800 p-1 mb-2 w-full md:w-auto">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
          </TabsList>

          {/* Profile Tab - Using Clerk's UserProfile component */}
          <TabsContent value="profile" className="space-y-6">
            <Card className="border-2 border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <CardHeader className="pb-4">
                <CardTitle>Profile Management</CardTitle>
                <CardDescription>
                  Update your profile information, change your email, and manage your account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <UserProfile 
                  path="/profile-settings"
                  routing="path"
                  appearance={{
                    elements: {
                      rootBox: "w-full mx-auto",
                      card: "shadow-none border-0 p-0",
                      navbar: "hidden",
                      pageScrollBox: "p-0",
                    },
                  }}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appearance Tab */}
          <TabsContent value="appearance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Theme</CardTitle>
                <CardDescription>Customize the appearance of the application.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="dark-mode">Dark Mode</Label>
                  <Switch id="dark-mode" />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="high-contrast">High Contrast</Label>
                  <Switch id="high-contrast" />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="animations">Animations</Label>
                  <Switch id="animations" defaultChecked />
                </div>
                <Button className="mt-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">Save Appearance Settings</Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Configure how you receive notifications.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="video-complete">Video Complete</Label>
                    <p className="text-sm text-muted-foreground">Receive notifications when your videos are ready</p>
                  </div>
                  <Switch id="video-complete" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="new-features">New Features</Label>
                    <p className="text-sm text-muted-foreground">Get notified about new features and updates</p>
                  </div>
                  <Switch id="new-features" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="marketing">Marketing</Label>
                    <p className="text-sm text-muted-foreground">Receive marketing emails and promotions</p>
                  </div>
                  <Switch id="marketing" />
                </div>
                <Button className="mt-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">Save Notification Settings</Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Billing Tab */}
          <TabsContent value="billing" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Billing & Subscription</CardTitle>
                <CardDescription>Manage your subscription and payment methods</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg bg-slate-50 dark:bg-slate-800 p-4 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-medium flex items-center">
                        <Sparkles className="h-4 w-4 text-purple-500 mr-2" />
                        Free Plan
                      </h3>
                      <p className="text-sm text-muted-foreground">Your current plan</p>
                    </div>
                    <div className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100 text-xs font-medium px-2.5 py-0.5 rounded">
                      Active
                    </div>
                  </div>
                  <Button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">Upgrade to Pro</Button>
                </div>
                
                <div className="border-t border-slate-200 dark:border-slate-700 pt-4 mt-4">
                  <h3 className="font-medium mb-2">Payment Methods</h3>
                  <p className="text-sm text-muted-foreground mb-4">No payment methods added yet.</p>
                  <Button variant="outline">Add Payment Method</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
