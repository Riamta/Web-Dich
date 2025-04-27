"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PasswordStrengthChecker } from "@/components/PasswordStrength"
import { PasswordGenerator } from "@/components/password-generator"
import { UsernameGenerator } from "@/components/username-generator"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center">
      <div className="w-full max-w-md space-y-6">
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <PasswordGenerator />
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-medium">Password Security Tips</h2>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>• Use a password manager to store and generate passwords</li>
            <li>• Avoid password reuse across websites and apps</li>
            <li>• Avoid using personal information in passwords</li>
            <li>• Consider using multi-factor authentication when available</li>
            <li>• Passwords are more secure when they are longer and use a variety of characters</li>
          </ul>
        </div>
      </div>
    </main>
  )
}
