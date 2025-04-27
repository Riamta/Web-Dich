"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "./ui/radio-group"
import { Check, Copy, Wand2 } from "lucide-react"
import { aiService } from "@/lib/ai-service"

export function UsernameGenerator() {
  const [usernames, setUsernames] = useState<string[]>([])
  const [selectedUsername, setSelectedUsername] = useState("")
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [hint, setHint] = useState("")
  const [count, setCount] = useState(3)

  const generateAIUsernames = async () => {
    if (!hint.trim() || loading) return
    
    setLoading(true)
    try {
      const prompt = `Tạo ${count} tên người dùng (username) sáng tạo dựa trên gợi ý sau: "${hint}".

Yêu cầu:
- Trả về CHÍNH XÁC ${count} username, mỗi username một dòng
- Username nên ngắn gọn, tối đa 15 ký tự
- Username có thể bao gồm chữ cái, số
- KHÔNG sử dụng ký tự đặc biệt như !@#$%^&*
- Đảm bảo username dễ đọc và dễ nhớ
- Có thể sử dụng tiếng Anh hoặc kết hợp tiếng Anh và số
- CHỈ trả về danh sách ${count} username, mỗi username một dòng
- KHÔNG đánh số thứ tự
- KHÔNG có giải thích hoặc văn bản thêm

Gợi ý: "${hint}"`;

      const result = await aiService.processWithAI(prompt)
      const generatedUsernames = result
        .split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.includes(':') && !line.startsWith('-'))
        .slice(0, count)
      
      setUsernames(generatedUsernames)
      
      if (generatedUsernames.length > 0) {
        setSelectedUsername(generatedUsernames[0])
      }
    } catch (error) {
      console.error("Failed to generate AI usernames:", error)
    } finally {
      setLoading(false)
      setCopiedIndex(null)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      generateAIUsernames()
    }
  }

  const copyToClipboard = (username: string, index: number) => {
    navigator.clipboard.writeText(username)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="username-hint">Username Hint</Label>
        <div className="flex gap-2">
          <Input 
            id="username-hint" 
            placeholder="Enter a hint (e.g., gaming, nature, fantasy)" 
            value={hint} 
            onChange={(e) => setHint(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <Button 
            onClick={generateAIUsernames} 
            disabled={!hint.trim() || loading}
            className="whitespace-nowrap"
          >
            {loading ? "Generating..." : "Generate"}
            {!loading && <Wand2 className="ml-2 h-4 w-4" />}
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Enter a hint and AI will create usernames based on it
        </p>
      </div>

      <div className="space-y-2">
        <Label>Number of usernames to generate</Label>
        <div className="flex space-x-4">
          {[1, 2, 3, 4, 5].map((num) => (
            <Button 
              key={num}
              variant={count === num ? "default" : "outline"} 
              size="sm"
              onClick={() => setCount(num)}
            >
              {num}
            </Button>
          ))}
        </div>
      </div>

      {usernames.length > 0 && (
        <div className="space-y-3 pt-2">
          <Label>Generated Usernames</Label>
          
          <RadioGroup 
            value={selectedUsername} 
            onValueChange={setSelectedUsername}
            className="space-y-2"
          >
            {usernames.map((name, index) => (
              <div key={index} className="flex items-center space-x-2 rounded-md border p-3">
                <RadioGroupItem value={name} id={`username-${index}`} />
                <Label htmlFor={`username-${index}`} className="flex-1 cursor-pointer font-mono">
                  {name}
                </Label>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => copyToClipboard(name, index)}
                  className="px-2"
                >
                  {copiedIndex === index ? 
                    <Check className="h-4 w-4 text-green-500" /> : 
                    <Copy className="h-4 w-4" />
                  }
                </Button>
              </div>
            ))}
          </RadioGroup>
        </div>
      )}
    </div>
  )
}
