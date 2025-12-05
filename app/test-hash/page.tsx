"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function TestHashPage() {
  const [password, setPassword] = useState("0306$$")
  const [hash, setHash] = useState("")

  const calculateHash = async () => {
    const SALT = "tiendita_barrazas_2024"
    const encoder = new TextEncoder()
    const saltedPassword = password + SALT
    const data = encoder.encode(saltedPassword)
    const hashBuffer = await crypto.subtle.digest("SHA-256", data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("")
    const shortHash = hashHex.substring(0, 32)
    setHash(shortHash)
    console.log("Full hash:", hashHex)
    console.log("Short hash (32 chars):", shortHash)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Test Hash Calculator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Password</Label>
            <Input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
            />
          </div>
          <Button onClick={calculateHash}>Calculate Hash</Button>
          {hash && (
            <div className="p-4 bg-gray-100 rounded">
              <p className="font-mono text-sm break-all">{hash}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

