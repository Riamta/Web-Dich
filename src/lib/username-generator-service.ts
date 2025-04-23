import { aiService } from './ai-service';

interface UsernameOptions {
  keyword: string
  type?: 'cool' | 'funny' | 'professional' | 'gaming' | 'random'
  maxLength?: number
}

interface PasswordOptions {
  length?: number
  includeNumbers?: boolean
  includeSymbols?: boolean
  includeUppercase?: boolean
  includeLowercase?: boolean
  excludeSimilarCharacters?: boolean
}

export class GeneratorService {
  static async generateUsernames(options: UsernameOptions): Promise<string[]> {
    const { 
      keyword,
      type = 'random',
      maxLength = 15 
    } = options
    
    const prompt = `Generate 10 unique and creative usernames.

Requirements:
${keyword === 'random' ? '- Random keyword' : `- Keyword: ${keyword}`}
- Style: ${type !== 'random' ? type : 'any style'} 
- Maximum length: ${maxLength} characters
- Should be creative and memorable
- Can include numbers (0-9), underscores, dots
- No spaces allowed
- Return only usernames, one per line, no explanations

Creativity guidelines:
- Mix the keyword with related words, synonyms, or antonyms
- Add relevant adjectives or descriptive words
- Use word play, puns, or rhymes when appropriate
- Can modify/shorten/extend the keyword if it improves the username
- Consider adding thematic numbers (e.g. year, lucky numbers)
- Experiment with leetspeak (e.g. 3 for E, 4 for A)
- Try different positions for the keyword (prefix, suffix, middle)
- Use alliteration or similar sounds
- Add relevant emojis if the platform allows
- Consider cultural references and trends
- Use gaming or tech terminology when appropriate
- Mix different languages or writing systems
- Create compound words or portmanteaus
- Use mythological or fantasy elements
- Add action verbs or power words
- Consider adding titles or ranks
- Use nature or elemental themes
- Add personality traits or characteristics
- Use futuristic or sci-fi elements
- Consider adding mystical or magical elements

[Timestamp: ${Date.now()}]` // Add timestamp to avoid caching

    try {
      console.info(prompt)
      const response = await aiService.processWithAI(prompt)
      return response.split('\n')
        .map(username => username.trim())
        .filter(username => username && username.length <= maxLength)
    } catch (error) {
      console.error('Username generation error:', error)
      throw new Error('Failed to generate usernames')
    }
  }

  static generatePassword(options: PasswordOptions = {}): string {
    const {
      length = 12,
      includeNumbers = true,
      includeSymbols = true,
      includeUppercase = true,
      includeLowercase = true,
      excludeSimilarCharacters = false
    } = options

    const numbers = '0123456789'
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?'
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    const lowercase = 'abcdefghijklmnopqrstuvwxyz'
    const similarCharacters = 'iIlL1oO0'

    let chars = ''
    if (includeLowercase) chars += lowercase
    if (includeUppercase) chars += uppercase
    if (includeNumbers) chars += numbers
    if (includeSymbols) chars += symbols
    if (excludeSimilarCharacters) {
      chars = chars.split('')
        .filter(char => !similarCharacters.includes(char))
        .join('')
    }

    let password = ''
    for (let i = 0; i < length; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }

    return password
  }

  static generateKeyword() {
    const prompt = `Generate 1 random keyword for creating unique usernames.
    Requirements:
    - Return a single word only, no explanations
    - Word can be:
      + Mythological creatures or beings
      + Fantasy elements or concepts
      + Nature phenomena or elements
      + Tech or gaming terms
      + Action verbs or power words
      + Personality traits
      + Cultural references
      + Historical figures
      + Scientific concepts
      + Artistic terms
      + Sports terminology
      + Food or drink names
      + Animal names or traits
      + Weather phenomena
      + Space or cosmic terms
      + Music genres or terms
      + Fashion or style terms
      + Travel or adventure terms
      + Mystical or magical terms
    - Must be in English
    - Maximum 10 characters
    - Should be creative and memorable
    - Can mix categories (e.g. cyberwolf, stormhack)
    - Avoid overused words
    - No profanity or offensive terms
    
    [Timestamp: ${Date.now()}]`; // Add timestamp to prevent caching
    console.info(prompt)
    return aiService.processWithAI(prompt)
  }
}
