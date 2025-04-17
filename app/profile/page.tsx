import type { Metadata } from "next"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import UserProfile from "@/components/profile/user-profile"
import AccountSettings from "@/components/profile/account-settings"
import NotificationSettings from "@/components/profile/notification-settings"
import BillingSettings from "@/components/profile/billing-settings"

export const metadata: Metadata = {
  title: "Profile Settings | LockIn",
  description: "Manage your account, preferences, and settings",
}

export default function ProfilePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 px-4 py-8 md:px-8 lg:px-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">
            Profile Settings
          </h1>
          <p className="text-muted-foreground mt-2">Manage your account, preferences, and settings</p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="bg-slate-100 dark:bg-slate-800 p-1 mb-2">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <UserProfile />
          </TabsContent>

          <TabsContent value="account" className="space-y-6">
            <AccountSettings />
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <NotificationSettings />
          </TabsContent>

          <TabsContent value="billing" className="space-y-6">
            <BillingSettings />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
