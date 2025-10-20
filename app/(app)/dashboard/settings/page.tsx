"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-8xl space-y-6">
      <h1 className="text-xl font-semibold text-white">Settings</h1>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="voice">Brand Voice</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card className="bg-secondary border-border">
            <CardHeader>
              <CardTitle className="text-white">Profile</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label className="text-white">Display Name</Label>
                <Input placeholder="Creator Name" />
              </div>
              <div className="grid gap-2">
                <Label className="text-white">Contact Email</Label>
                <Input placeholder="you@domain.com" />
              </div>
              <Button className="w-fit bg-primary text-primary-foreground hover:bg-[#11e1ff]">Save</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="voice">
          <Card className="bg-secondary border-border">
            <CardHeader>
              <CardTitle className="text-white">Brand Voice</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label className="text-white">Style</Label>
                <Textarea placeholder="Conversational, clear, growth-focused..." />
              </div>
              <div className="grid gap-2">
                <Label className="text-white">Topics to Avoid</Label>
                <Textarea placeholder="Off-limit topics..." />
              </div>
              <Button className="w-fit bg-primary text-primary-foreground hover:bg-[#11e1ff]">Save</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing">
          <Card className="bg-secondary border-border">
            <CardHeader>
              <CardTitle className="text-white">Billing</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              Manage your plan and payment method from your account. Upgrading gives unlimited training and advanced
              analytics.
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
