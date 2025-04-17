"use client"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Crown, Check } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"

export default function BillingSettings() {
  return (
    <>
      <Card className="border-2 border-slate-200 dark:border-slate-800 shadow-sm">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Current Plan</CardTitle>
              <CardDescription>Manage your subscription and usage</CardDescription>
            </div>
            <Badge
              variant="outline"
              className="bg-gradient-to-r from-amber-200 to-yellow-400 text-amber-900 border-amber-300"
            >
              <Crown className="h-3 w-3 mr-1" /> Pro Plan
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="rounded-lg border p-4">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-medium">Pro Plan</h3>
                <p className="text-sm text-muted-foreground">$19.99/month</p>
              </div>
              <div className="text-sm bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-1 rounded-full">
                Active
              </div>
            </div>

            <p className="text-sm text-muted-foreground mb-4">
              Your subscription renews on <strong>April 15, 2025</strong>
            </p>

            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm mb-1">
                <span>Video Generations</span>
                <span className="font-medium">70/100</span>
              </div>
              <Progress value={70} className="h-2" />
              <p className="text-xs text-muted-foreground">30 video generations remaining this billing cycle</p>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Plan Features</h3>

            <ul className="space-y-2">
              <li className="flex items-center">
                <Check className="h-4 w-4 text-green-500 mr-2" />
                <span>Up to 100 video generations per month</span>
              </li>
              <li className="flex items-center">
                <Check className="h-4 w-4 text-green-500 mr-2" />
                <span>Full HD 1080p video quality</span>
              </li>
              <li className="flex items-center">
                <Check className="h-4 w-4 text-green-500 mr-2" />
                <span>Access to all AI voices</span>
              </li>
              <li className="flex items-center">
                <Check className="h-4 w-4 text-green-500 mr-2" />
                <span>Priority video processing</span>
              </li>
              <li className="flex items-center">
                <Check className="h-4 w-4 text-green-500 mr-2" />
                <span>No watermarks</span>
              </li>
              <li className="flex items-center">
                <Check className="h-4 w-4 text-green-500 mr-2" />
                <span>Email support</span>
              </li>
            </ul>
          </div>
        </CardContent>

        <CardFooter className="flex justify-between border-t bg-slate-50/50 dark:bg-slate-800/20 p-6 mt-6">
          <Button variant="outline" className="text-red-500">
            Cancel Subscription
          </Button>
          <Button>Manage Plan</Button>
        </CardFooter>
      </Card>

      <Card className="border-2 border-slate-200 dark:border-slate-800 shadow-sm">
        <CardHeader>
          <CardTitle>Payment Method</CardTitle>
          <CardDescription>Manage your payment details and billing address</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="rounded-lg border p-4">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center">
                <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded mr-3">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22 9H2V8C2 6.34 3.34 5 5 5H19C20.66 5 22 6.34 22 8V9Z" fill="#3E4C59" />
                    <path d="M22 9H2V15C2 16.66 3.34 18 5 18H19C20.66 18 22 16.66 22 15V9Z" fill="#2D3748" />
                    <path
                      d="M5 13.5C5 13.224 5.224 13 5.5 13H7.5C7.776 13 8 13.224 8 13.5V14.5C8 14.776 7.776 15 7.5 15H5.5C5.224 15 5 14.776 5 14.5V13.5Z"
                      fill="#A0AEC0"
                    />
                  </svg>
                </div>
                <div>
                  <p className="font-medium">Visa ending in 4242</p>
                  <p className="text-sm text-muted-foreground">Expires 04/2025</p>
                </div>
              </div>
              <div className="text-sm bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-1 rounded-full">
                Default
              </div>
            </div>

            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                Edit
              </Button>
              <Button variant="outline" size="sm">
                Remove
              </Button>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <Button variant="outline">+ Add Payment Method</Button>
            <Button variant="outline">Update Billing Address</Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-2 border-slate-200 dark:border-slate-800 shadow-sm">
        <CardHeader>
          <CardTitle>Billing History</CardTitle>
          <CardDescription>View and download your billing history</CardDescription>
        </CardHeader>

        <CardContent>
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-800">
                <tr className="text-left">
                  <th className="px-4 py-3 text-sm font-medium">Date</th>
                  <th className="px-4 py-3 text-sm font-medium">Description</th>
                  <th className="px-4 py-3 text-sm font-medium">Amount</th>
                  <th className="px-4 py-3 text-sm font-medium">Status</th>
                  <th className="px-4 py-3 text-sm font-medium text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                <tr>
                  <td className="px-4 py-3 text-sm">Mar 15, 2025</td>
                  <td className="px-4 py-3 text-sm">Pro Plan Subscription</td>
                  <td className="px-4 py-3 text-sm">$19.99</td>
                  <td className="px-4 py-3 text-sm">
                    <span className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-1 rounded-full text-xs">
                      Paid
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-right">
                    <Button variant="ghost" size="sm">
                      Download
                    </Button>
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm">Feb 15, 2025</td>
                  <td className="px-4 py-3 text-sm">Pro Plan Subscription</td>
                  <td className="px-4 py-3 text-sm">$19.99</td>
                  <td className="px-4 py-3 text-sm">
                    <span className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-1 rounded-full text-xs">
                      Paid
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-right">
                    <Button variant="ghost" size="sm">
                      Download
                    </Button>
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm">Jan 15, 2025</td>
                  <td className="px-4 py-3 text-sm">Pro Plan Subscription</td>
                  <td className="px-4 py-3 text-sm">$19.99</td>
                  <td className="px-4 py-3 text-sm">
                    <span className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-1 rounded-full text-xs">
                      Paid
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-right">
                    <Button variant="ghost" size="sm">
                      Download
                    </Button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </>
  )
}
