"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UsernameGenerator } from "@/components/username-generator"

export default function Page() {
  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:p-24">
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold">Username Tools</h1>
          <p className="text-gray-500">Generate unique usernames</p>
        </div>

        <Tabs defaultValue="generate" className="w-full">
          <TabsList className="grid w-full grid-cols-1">
            <TabsTrigger value="generate">Generate Username</TabsTrigger>
          </TabsList>
          <TabsContent value="generate" className="mt-4">
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <UsernameGenerator />
            </div>
          </TabsContent>
        </Tabs>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-medium">Username Tips</h2>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>• Choose a unique username that represents you</li>
            <li>• Avoid using personal information like birth dates</li>
            <li>• Consider adding random numbers or characters</li>
            <li>• Make sure it's easy to remember and type</li>
            <li>• Check if the username is available on platforms you use</li>
          </ul>
        </div>
      </div>
    </main>
  )
}
