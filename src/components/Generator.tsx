'use client'

import { useState } from 'react'
import { GeneratorService } from '@/lib/generator-service'
import { aiService } from '@/lib/ai-service'
import { ClipboardDocumentIcon, SparklesIcon } from '@heroicons/react/24/outline'

export default function Generator() {
  // Username states
  const [keyword, setKeyword] = useState('')
  const [type, setType] = useState<'random' | 'cool' | 'funny' | 'professional' | 'gaming'>('random')
  const [generatedUsernames, setGeneratedUsernames] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copySuccess, setCopySuccess] = useState(false)

  // Password states
  const [passwordLength, setPasswordLength] = useState(12)
  const [includeNumbers, setIncludeNumbers] = useState(true)
  const [includeSymbols, setIncludeSymbols] = useState(true)
  const [includeUppercase, setIncludeUppercase] = useState(true)
  const [includeLowercase, setIncludeLowercase] = useState(true)
  const [excludeSimilarChars, setExcludeSimilarChars] = useState(false)
  const [generatedPassword, setGeneratedPassword] = useState('')

  // New states for account generator
  const [generatedAccount, setGeneratedAccount] = useState<{
    username: string;
    password: string;
  } | null>(null);
  const [isGeneratingAccount, setIsGeneratingAccount] = useState(false);

  const handleGenerateUsernames = async () => {
    setIsLoading(true)
    setError(null)
    try {
      if (keyword.trim()) {
        // Nếu có keyword, sử dụng keyword đó để tạo username
        const usernames = await GeneratorService.generateUsernames({
          keyword: keyword.trim(),
          type,
          maxLength: 20
        })
        setGeneratedUsernames(usernames)
      } else {
        // Chỉ gửi 1 request để lấy nhiều username cùng lúc
        const usernames = await GeneratorService.generateUsernames({
          keyword: 'random',
          type,
          maxLength: 20
        })
        setGeneratedUsernames(usernames)
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to generate usernames')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGeneratePassword = () => {
    const password = GeneratorService.generatePassword({
      length: passwordLength,
      includeNumbers,
      includeSymbols,
      includeUppercase,
      includeLowercase,
      excludeSimilarCharacters: excludeSimilarChars
    })
    setGeneratedPassword(password)
  }

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text)
    setCopySuccess(true)
    setTimeout(() => setCopySuccess(false), 2000)
  }

  const handleGenerateAccount = async () => {
    setIsGeneratingAccount(true);
    try {
      const keyword = await GeneratorService.generateKeyword();
      console.log('Generated keyword:', keyword);

      // Generate username with the keyword
      const usernames = await GeneratorService.generateUsernames({
        keyword: keyword.trim(),
        type: 'random',
        maxLength: 20
      });
      console.log('Generated keyword:', usernames);

      // Generate a strong password
      const password = GeneratorService.generatePassword({
        length: 16,
        includeNumbers: true,
        includeSymbols: true,
        includeUppercase: true,
        includeLowercase: true,
        excludeSimilarCharacters: true
      });

      setGeneratedAccount({
        username: usernames[Math.floor(Math.random() * usernames.length)],
        password: password
      });
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to generate account');
    } finally {
      setIsGeneratingAccount(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Username Generator Section */}
      <div className="bg-gradient-to-br from-white to-gray-50/50 p-8 rounded-2xl shadow-lg border border-gray-100/50 backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary/10 rounded-lg">
            <SparklesIcon className="h-6 w-6 text-primary" />
          </div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Username Generator
          </h2>
        </div>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Enter a keyword (optional)
            </label>
            <div className="flex gap-3">
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="E.g., ninja, dragon, master..."
                className="flex-1 p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white/50 backdrop-blur-sm transition-all"
              />
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white/50 backdrop-blur-sm transition-all min-w-[160px]"
              >
                <option value="random">Random Style</option>
                <option value="cool">Cool</option>
                <option value="funny">Funny</option>
                <option value="professional">Professional</option>
                <option value="gaming">Gaming</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleGenerateUsernames}
            disabled={isLoading}
            className="w-full py-3 px-4 bg-gradient-to-r from-primary to-primary/90 text-white rounded-xl hover:from-primary/90 hover:to-primary transition-all duration-300 flex items-center justify-center gap-2 font-medium shadow-md hover:shadow-lg disabled:opacity-70"
          >
            <SparklesIcon className="h-5 w-5" />
            {isLoading ? 'Generating...' : 'Generate Usernames'}
          </button>

          {error && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}

          {generatedUsernames.length > 0 && (
            <div className="space-y-3 mt-4">
              <div className="text-sm text-gray-500 flex items-center gap-2">
                <ClipboardDocumentIcon className="h-4 w-4" />
                Click on any username to copy
              </div>
              <div className="grid gap-2">
                {generatedUsernames.map((username, index) => (
                  <div
                    key={index}
                    onClick={() => handleCopy(username)}
                    className="flex items-center justify-between p-4 bg-white rounded-xl hover:bg-gray-50 cursor-pointer transition-all border border-gray-100 group"
                  >
                    <span className="font-mono text-gray-700">{username}</span>
                    <ClipboardDocumentIcon className="h-5 w-5 text-gray-400 group-hover:text-primary transition-colors" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Password Generator Section */}
      <div className="bg-gradient-to-br from-white to-gray-50/50 p-8 rounded-2xl shadow-lg border border-gray-100/50 backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary/10 rounded-lg">
            <SparklesIcon className="h-6 w-6 text-primary" />
          </div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Password Generator
          </h2>
        </div>
        
        <div className="space-y-6">
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Password Length
                </label>
                <span className="text-primary font-medium">{passwordLength}</span>
              </div>
              <input
                type="range"
                min="8"
                max="32"
                value={passwordLength}
                onChange={(e) => setPasswordLength(parseInt(e.target.value))}
                className="w-full accent-primary"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="checkbox"
                  checked={includeNumbers}
                  onChange={(e) => setIncludeNumbers(e.target.checked)}
                  className="rounded text-primary w-4 h-4"
                />
                <span className="text-sm font-medium">Include Numbers</span>
              </label>

              <label className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="checkbox"
                  checked={includeSymbols}
                  onChange={(e) => setIncludeSymbols(e.target.checked)}
                  className="rounded text-primary w-4 h-4"
                />
                <span className="text-sm font-medium">Include Symbols</span>
              </label>

              <label className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="checkbox"
                  checked={includeUppercase}
                  onChange={(e) => setIncludeUppercase(e.target.checked)}
                  className="rounded text-primary w-4 h-4"
                />
                <span className="text-sm font-medium">Include Uppercase</span>
              </label>

              <label className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="checkbox"
                  checked={includeLowercase}
                  onChange={(e) => setIncludeLowercase(e.target.checked)}
                  className="rounded text-primary w-4 h-4"
                />
                <span className="text-sm font-medium">Include Lowercase</span>
              </label>
            </div>

            <label className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="checkbox"
                checked={excludeSimilarChars}
                onChange={(e) => setExcludeSimilarChars(e.target.checked)}
                className="rounded text-primary w-4 h-4"
              />
              <span className="text-sm font-medium">Exclude Similar Characters (i, l, 1, L, o, 0, O)</span>
            </label>
          </div>

          <button
            onClick={handleGeneratePassword}
            className="w-full py-3 px-4 bg-gradient-to-r from-primary to-primary/90 text-white rounded-xl hover:from-primary/90 hover:to-primary transition-all duration-300 flex items-center justify-center gap-2 font-medium shadow-md hover:shadow-lg"
          >
            <SparklesIcon className="h-5 w-5" />
            Generate Password
          </button>

          {generatedPassword && (
            <div
              onClick={() => handleCopy(generatedPassword)}
              className="flex items-center justify-between p-4 bg-white rounded-xl hover:bg-gray-50 cursor-pointer transition-all border border-gray-100 group"
            >
              <span className="font-mono text-gray-700">{generatedPassword}</span>
              <ClipboardDocumentIcon className="h-5 w-5 text-gray-400 group-hover:text-primary transition-colors" />
            </div>
          )}
        </div>
      </div>

      {/* Account Generator Section */}
      <div className="bg-gradient-to-br from-white to-gray-50/50 p-8 rounded-2xl shadow-lg border border-gray-100/50 backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary/10 rounded-lg">
            <SparklesIcon className="h-6 w-6 text-primary" />
          </div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Account Generator
          </h2>
        </div>
        
        <div className="space-y-6">
          <button
            onClick={handleGenerateAccount}
            disabled={isGeneratingAccount}
            className="w-full py-3 px-4 bg-gradient-to-r from-primary to-primary/90 text-white rounded-xl hover:from-primary/90 hover:to-primary transition-all duration-300 flex items-center justify-center gap-2 font-medium shadow-md hover:shadow-lg disabled:opacity-70"
          >
            <SparklesIcon className="h-5 w-5" />
            {isGeneratingAccount ? 'Generating...' : 'Generate Random Account'}
          </button>

          {generatedAccount && (
            <div className="space-y-4">
              <div className="text-sm text-gray-500 flex items-center gap-2">
                <ClipboardDocumentIcon className="h-4 w-4" />
                Click on any field to copy
              </div>
              
              <div
                onClick={() => handleCopy(generatedAccount.username)}
                className="flex items-center justify-between p-4 bg-white rounded-xl hover:bg-gray-50 cursor-pointer transition-all border border-gray-100 group"
              >
                <div className="space-y-1">
                  <div className="text-xs font-medium text-gray-500">Username</div>
                  <span className="font-mono text-gray-700">{generatedAccount.username}</span>
                </div>
                <ClipboardDocumentIcon className="h-5 w-5 text-gray-400 group-hover:text-primary transition-colors" />
              </div>

              <div
                onClick={() => handleCopy(generatedAccount.password)}
                className="flex items-center justify-between p-4 bg-white rounded-xl hover:bg-gray-50 cursor-pointer transition-all border border-gray-100 group"
              >
                <div className="space-y-1">
                  <div className="text-xs font-medium text-gray-500">Password</div>
                  <span className="font-mono text-gray-700">{generatedAccount.password}</span>
                </div>
                <ClipboardDocumentIcon className="h-5 w-5 text-gray-400 group-hover:text-primary transition-colors" />
              </div>

              <button
                onClick={() => handleCopy(`Username: ${generatedAccount.username}\nPassword: ${generatedAccount.password}`)}
                className="w-full flex items-center justify-center gap-2 p-3 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors text-sm text-gray-600 font-medium"
              >
                <span>Copy both</span>
                <ClipboardDocumentIcon className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {copySuccess && (
        <div className="fixed bottom-6 right-6 bg-green-500 text-white px-6 py-3 rounded-xl shadow-lg animate-fade-in-out flex items-center gap-2">
          <ClipboardDocumentIcon className="h-5 w-5" />
          Copied to clipboard!
        </div>
      )}
    </div>
  )
}









