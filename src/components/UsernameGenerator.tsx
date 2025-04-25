'use client'

import { useState } from 'react'
import { GeneratorService } from '@/lib/username-generator-service'
import { ClipboardDocumentIcon, SparklesIcon } from '@heroicons/react/24/outline'

export default function Generator() {
  // Username states
  const [keyword, setKeyword] = useState('')
  const [type, setType] = useState<'random' | 'cool' | 'funny' | 'professional' | 'gaming'>('random')
  const [generatedUsernames, setGeneratedUsernames] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copySuccess, setCopySuccess] = useState(false)
  const [usernameLength, setUsernameLength] = useState(12)
  const [includeNumbers, setIncludeNumbers] = useState(true)
  const [includeSpecial, setIncludeSpecial] = useState(false)
  const [useLeetSpeak, setUseLeetSpeak] = useState(false)

  // Password states
  const [passwordLength, setPasswordLength] = useState(12)
  const [includePasswordNumbers, setIncludePasswordNumbers] = useState(true)
  const [includeSymbols, setIncludeSymbols] = useState(true)
  const [includeUppercase, setIncludeUppercase] = useState(true)
  const [includeLowercase, setIncludeLowercase] = useState(true)
  const [excludeSimilarChars, setExcludeSimilarChars] = useState(false)
  const [generatedPassword, setGeneratedPassword] = useState('')

  // Account states
  const [generatedAccount, setGeneratedAccount] = useState<{
    username: string;
    password: string;
  } | null>(null);
  const [isGeneratingAccount, setIsGeneratingAccount] = useState(false);

  const handleGenerateUsernames = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const options = {
        keyword: keyword.trim() || 'random',
        type,
        maxLength: usernameLength,
        includeNumbers,
        includeSpecial,
        useLeetSpeak
      }
      
      const usernames = await GeneratorService.generateUsernames(options)
      setGeneratedUsernames(usernames)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to generate usernames')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGeneratePassword = () => {
    const password = GeneratorService.generatePassword({
      length: passwordLength,
      includeNumbers: includePasswordNumbers,
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
      const usernames = await GeneratorService.generateUsernames({
        keyword: keyword.trim(),
        type: 'random',
        maxLength: 20,
        includeNumbers: true,
        includeSpecial: false,
        useLeetSpeak: true
      });

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
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* Username Generator Section */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-3 mb-4">
          <SparklesIcon className="h-5 w-5 text-gray-600" />
          <h2 className="text-lg font-semibold">Username Generator</h2>
        </div>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Enter keyword (optional)"
                className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-200 bg-white/50" 
              />
            </div>
            <div>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-200 bg-white/50"
              >
                <option value="random">Random Style</option>
                <option value="cool">Cool</option>
                <option value="funny">Funny</option>
                <option value="professional">Professional</option>
                <option value="gaming">Gaming</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={includeNumbers}
                onChange={(e) => setIncludeNumbers(e.target.checked)}
                className="rounded text-gray-600"
              />
              Numbers
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={includeSpecial}
                onChange={(e) => setIncludeSpecial(e.target.checked)}
                className="rounded text-gray-600"
              />
              Special Chars
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={useLeetSpeak}
                onChange={(e) => setUseLeetSpeak(e.target.checked)}
                className="rounded text-gray-600"
              />
              Leet Speak
            </label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="4"
                max="20"
                value={usernameLength}
                onChange={(e) => setUsernameLength(parseInt(e.target.value))}
                className="flex-1 accent-gray-600"
              />
              <span className="text-sm w-8">{usernameLength}</span>
            </div>
          </div>

          <div>
            <button
              onClick={handleGenerateUsernames}
              disabled={isLoading}
              className="py-2 px-6 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-1.5"
            >
              <SparklesIcon className="h-3.5 w-3.5" />
              {isLoading ? 'Generating...' : 'Generate Usernames'}
            </button>
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          {generatedUsernames.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-4">
              {generatedUsernames.map((username, index) => (
                <div
                  key={index}
                  onClick={() => handleCopy(username)}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer group"
                >
                  <span className="font-mono text-sm">{username}</span>
                  <ClipboardDocumentIcon className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Password Generator Section */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-3 mb-4">
          <SparklesIcon className="h-5 w-5 text-gray-600" />
          <h2 className="text-lg font-semibold">Password Generator</h2>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="8"
              max="32"
              value={passwordLength}
              onChange={(e) => setPasswordLength(parseInt(e.target.value))}
              className="flex-1 accent-gray-600"
            />
            <span className="text-sm w-8">{passwordLength}</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={includePasswordNumbers}
                onChange={(e) => setIncludePasswordNumbers(e.target.checked)}
                className="rounded text-gray-600"
              />
              Numbers
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={includeSymbols}
                onChange={(e) => setIncludeSymbols(e.target.checked)}
                className="rounded text-gray-600"
              />
              Symbols
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={includeUppercase}
                onChange={(e) => setIncludeUppercase(e.target.checked)}
                className="rounded text-gray-600"
              />
              Uppercase
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={includeLowercase}
                onChange={(e) => setIncludeLowercase(e.target.checked)}
                className="rounded text-gray-600"
              />
              Lowercase
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={excludeSimilarChars}
                onChange={(e) => setExcludeSimilarChars(e.target.checked)}
                className="rounded text-gray-600"
              />
              No Similar Chars
            </label>
          </div>

          <div>
            <button
              onClick={handleGeneratePassword}
              className="py-2 px-6 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-1.5"
            >
              <SparklesIcon className="h-3.5 w-3.5" />
              Generate Password
            </button>
          </div>

          {generatedPassword && (
            <div
              onClick={() => handleCopy(generatedPassword)}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer group"
            >
              <span className="font-mono text-sm">{generatedPassword}</span>
              <ClipboardDocumentIcon className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
            </div>
          )}
        </div>
      </div>

      {/* Account Generator Section */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-3 mb-4">
          <SparklesIcon className="h-5 w-5 text-gray-600" />
          <h2 className="text-lg font-semibold">Account Generator</h2>
        </div>
        
        <div className="space-y-4">
          <div>
            <button
              onClick={handleGenerateAccount}
              disabled={isGeneratingAccount}
              className="py-2 px-6 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-1.5"
            >
              <SparklesIcon className="h-3.5 w-3.5" />
              {isGeneratingAccount ? 'Generating...' : 'Generate Random Account'}
            </button>
          </div>

          {generatedAccount && (
            <div className="space-y-2">
              <div
                onClick={() => handleCopy(generatedAccount.username)}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer group"
              >
                <div>
                  <div className="text-xs text-gray-500">Username</div>
                  <div className="font-mono text-sm">{generatedAccount.username}</div>
                </div>
                <ClipboardDocumentIcon className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
              </div>

              <div
                onClick={() => handleCopy(generatedAccount.password)}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer group"
              >
                <div>
                  <div className="text-xs text-gray-500">Password</div>
                  <div className="font-mono text-sm">{generatedAccount.password}</div>
                </div>
                <ClipboardDocumentIcon className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
              </div>

              <div className="mt-2">
                <button
                  onClick={() => handleCopy(`Username: ${generatedAccount.username}\nPassword: ${generatedAccount.password}`)}
                  className="py-1.5 px-4 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-xs text-gray-600 flex items-center gap-1.5"
                >
                  Copy both
                  <ClipboardDocumentIcon className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {copySuccess && (
        <div className="fixed bottom-4 right-4 bg-black text-white px-4 py-2 rounded-lg shadow-lg animate-fade-in-out flex items-center gap-2 text-sm">
          <ClipboardDocumentIcon className="h-4 w-4" />
          Copied to clipboard!
        </div>
      )}
    </div>
  )
}









