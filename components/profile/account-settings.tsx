"use client"

import type React from "react"

import { useState } from "react"
import { Eye, EyeOff, Check } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/components/ui/use-toast"

export default function AccountSettings() {
  const [showPassword, setShowPassword] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState(0)
  const [password, setPassword] = useState("")

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value
    setPassword(newPassword)

    // Simple password strength calculation
    let strength = 0
    if (newPassword.length > 8) strength += 1
    if (/[A-Z]/.test(newPassword)) strength += 1
    if (/[0-9]/.test(newPassword)) strength += 1
    if (/[^A-Za-z0-9]/.test(newPassword)) strength += 1

    setPasswordStrength(strength)
  }

  const savePassword = () => {
    // In a real app, you would send this to your backend
    toast({
      title: "Password updated",
      description: "Your password has been changed successfully.",
    })
    setPassword("")
    setPasswordStrength(0)
  }

  const toggleShowPassword = () => {
    setShowPassword(!showPassword)
  }

  return (
    <>
      <Card className="border-2 border-slate-200 dark:border-slate-800 shadow-sm">
        <CardHeader>
          <CardTitle>Account Security</CardTitle>
          <CardDescription>Update your password and manage account security settings</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Change Password</h3>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Current Password</Label>
                <div className="relative">
                  <Input
                    id="current-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter current password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 py-2 text-muted-foreground"
                    onClick={toggleShowPassword}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter new password"
                    value={password}
                    onChange={handlePasswordChange}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 py-2 text-muted-foreground"
                    onClick={toggleShowPassword}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>

                {/* Password strength indicator */}
                {password && (
                  <div className="space-y-2 mt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Password strength</span>
                      <span className="text-sm font-medium">
                        {passwordStrength === 0 && "Weak"}
                        {passwordStrength === 1 && "Fair"}
                        {passwordStrength === 2 && "Good"}
                        {passwordStrength === 3 && "Strong"}
                        {passwordStrength === 4 && "Very Strong"}
                      </span>
                    </div>
                    <div className="flex gap-2 h-1.5">
                      <div
                        className={`w-1/4 rounded-full ${passwordStrength >= 1 ? "bg-red-500" : "bg-slate-200 dark:bg-slate-700"}`}
                      ></div>
                      <div
                        className={`w-1/4 rounded-full ${passwordStrength >= 2 ? "bg-orange-500" : "bg-slate-200 dark:bg-slate-700"}`}
                      ></div>
                      <div
                        className={`w-1/4 rounded-full ${passwordStrength >= 3 ? "bg-yellow-500" : "bg-slate-200 dark:bg-slate-700"}`}
                      ></div>
                      <div
                        className={`w-1/4 rounded-full ${passwordStrength >= 4 ? "bg-green-500" : "bg-slate-200 dark:bg-slate-700"}`}
                      ></div>
                    </div>

                    <ul className="space-y-1 text-sm text-muted-foreground mt-2">
                      <li className="flex items-center gap-1">
                        <span
                          className={`size-4 rounded-full flex items-center justify-center ${password.length > 8 ? "bg-green-100 text-green-500" : "bg-slate-100 text-slate-500"}`}
                        >
                          {password.length > 8 ? <Check className="size-3" /> : ""}
                        </span>
                        At least 8 characters
                      </li>
                      <li className="flex items-center gap-1">
                        <span
                          className={`size-4 rounded-full flex items-center justify-center ${/[A-Z]/.test(password) ? "bg-green-100 text-green-500" : "bg-slate-100 text-slate-500"}`}
                        >
                          {/[A-Z]/.test(password) ? <Check className="size-3" /> : ""}
                        </span>
                        At least one uppercase letter
                      </li>
                      <li className="flex items-center gap-1">
                        <span
                          className={`size-4 rounded-full flex items-center justify-center ${/[0-9]/.test(password) ? "bg-green-100 text-green-500" : "bg-slate-100 text-slate-500"}`}
                        >
                          {/[0-9]/.test(password) ? <Check className="size-3" /> : ""}
                        </span>
                        At least one number
                      </li>
                      <li className="flex items-center gap-1">
                        <span
                          className={`size-4 rounded-full flex items-center justify-center ${/[^A-Za-z0-9]/.test(password) ? "bg-green-100 text-green-500" : "bg-slate-100 text-slate-500"}`}
                        >
                          {/[^A-Za-z0-9]/.test(password) ? <Check className="size-3" /> : ""}
                        </span>
                        At least one special character
                      </li>
                    </ul>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Confirm new password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 py-2 text-muted-foreground"
                    onClick={toggleShowPassword}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Two-Factor Authentication</h3>

            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">Enable 2FA</p>
                <p className="text-sm text-muted-foreground">Add an extra layer of security to your account</p>
              </div>
              <Switch id="2fa" />
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Default Settings</h3>

            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <Select defaultValue="en">
                <SelectTrigger id="language">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Spanish</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                  <SelectItem value="de">German</SelectItem>
                  <SelectItem value="zh">Chinese</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Select defaultValue="utc-8">
                <SelectTrigger id="timezone">
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="utc-12">UTC-12:00</SelectItem>
                  <SelectItem value="utc-11">UTC-11:00</SelectItem>
                  <SelectItem value="utc-10">UTC-10:00</SelectItem>
                  <SelectItem value="utc-9">UTC-09:00</SelectItem>
                  <SelectItem value="utc-8">UTC-08:00 (Pacific Time)</SelectItem>
                  <SelectItem value="utc-7">UTC-07:00 (Mountain Time)</SelectItem>
                  <SelectItem value="utc-6">UTC-06:00 (Central Time)</SelectItem>
                  <SelectItem value="utc-5">UTC-05:00 (Eastern Time)</SelectItem>
                  <SelectItem value="utc-4">UTC-04:00</SelectItem>
                  <SelectItem value="utc-3">UTC-03:00</SelectItem>
                  <SelectItem value="utc-2">UTC-02:00</SelectItem>
                  <SelectItem value="utc-1">UTC-01:00</SelectItem>
                  <SelectItem value="utc+0">UTC+00:00</SelectItem>
                  <SelectItem value="utc+1">UTC+01:00</SelectItem>
                  <SelectItem value="utc+2">UTC+02:00</SelectItem>
                  <SelectItem value="utc+3">UTC+03:00</SelectItem>
                  <SelectItem value="utc+4">UTC+04:00</SelectItem>
                  <SelectItem value="utc+5">UTC+05:00</SelectItem>
                  <SelectItem value="utc+6">UTC+06:00</SelectItem>
                  <SelectItem value="utc+7">UTC+07:00</SelectItem>
                  <SelectItem value="utc+8">UTC+08:00</SelectItem>
                  <SelectItem value="utc+9">UTC+09:00</SelectItem>
                  <SelectItem value="utc+10">UTC+10:00</SelectItem>
                  <SelectItem value="utc+11">UTC+11:00</SelectItem>
                  <SelectItem value="utc+12">UTC+12:00</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex justify-between border-t bg-slate-50/50 dark:bg-slate-800/20 p-6 mt-6">
          <Button variant="outline">Cancel</Button>
          <Button
            onClick={savePassword}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            Save Changes
          </Button>
        </CardFooter>
      </Card>

      <Card className="border-2 border-slate-200 dark:border-slate-800 shadow-sm">
        <CardHeader>
          <CardTitle className="text-red-500">Danger Zone</CardTitle>
          <CardDescription>Permanent actions that can't be undone</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="font-medium">Delete Account</p>
              <p className="text-sm text-muted-foreground">Permanently delete your account and all associated data</p>
            </div>
            <Button variant="destructive">Delete Account</Button>
          </div>
        </CardContent>
      </Card>
    </>
  )
}
