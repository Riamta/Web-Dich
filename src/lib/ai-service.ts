import { GoogleGenerativeAI } from '@google/generative-ai';
import { createOpenRouterClient, isOpenRouterModel } from './api-config';
import { dictionaryService } from './dictionary-service';
import { OpenAI } from 'openai';

interface AIServiceConfig {
  model: string;
}

class AIService {
  private config: AIServiceConfig = {
    model: 'gemini-2.0-flash'
  };

  setModel(model: string) {
    this.config.model = model;
    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('preferredModel', model);
    }
  }

  getModel(): string {
    return this.config.model;
  }

  loadSavedModel() {
    if (typeof window !== 'undefined') {
      const savedModel = localStorage.getItem('preferredModel');
      if (savedModel) {
        this.config.model = savedModel;
      }
    }
  }

  async processWithAI(prompt: string): Promise<string> {
    if (isOpenRouterModel(this.config.model)) {
      return this.processWithOpenRouter(prompt);
    } else {
      return this.processWithLocalModel(prompt);
    }
  }

  private async processWithOpenRouter(prompt: string): Promise<string> {
    const openRouterKey = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;
    if (!openRouterKey) {
      throw new Error('OpenRouter API key is not configured');
    }

    const client = createOpenRouterClient(openRouterKey);
    
    try {
      console.log('📤 Sending request to OpenRouter...');
      const completion = await client.chat.completions.create({
        model: this.config.model,
        messages: [
          { role: 'user', content: prompt }
        ]
      });

      const result = completion.choices[0].message.content || '';
      return result;
    } catch (error) {
      console.error('❌ OpenRouter error:', {
        model: this.config.model,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
      throw new Error('Failed to process with OpenRouter');
    }
  }

  private async processWithLocalModel(prompt: string): Promise<string> {
    if (this.config.model === 'gemini-2.0-flash' || this.config.model === 'gemini-2.0-flash-lite') {
      const geminiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!geminiKey) {
        throw new Error('Gemini API key is not configured');
      }

      try {
        console.log('📤 Sending request to Gemini...');
        const genAI = new GoogleGenerativeAI(geminiKey);
        const geminiModel = genAI.getGenerativeModel({ model: this.config.model });
        const generationConfig = {
          temperature: 1,
          topP: 0.95,
          topK: 40,
          maxOutputTokens: 8192
        };

        const chatSession = geminiModel.startChat({
          generationConfig,
          history: []
        });

        const result = await chatSession.sendMessage(prompt);
        return result.response.text();
      } catch (error) {
        console.error('❌ Gemini error:', {
          model: this.config.model,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        });
        throw new Error('Failed to process with Gemini');
      }
    } else if (this.config.model === 'gpt-4o-mini' || this.config.model === 'gpt-4o') {
      const gptKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
      if (!gptKey) {
        throw new Error('OpenAI API key is not configured');
      }

      try {
        console.log('📤 Sending request to GPT-4o Mini...');
        const client = new OpenAI({
          apiKey: gptKey,
          dangerouslyAllowBrowser: true
        });

        const completion = await client.chat.completions.create({
          model: this.config.model,
          messages: [
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 4000
        });

        const result = completion.choices[0].message.content || '';
        return result;
      } catch (error) {
        console.error('❌ GPT error:', {
          model: this.config.model,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        });
        throw new Error('Failed to process with GPT');
      }
    } else {
      throw new Error('Unsupported model');
    }
  }

  // Translation specific method
  async translate(text: string, targetLanguage: string, preserveContext: boolean): Promise<string> {
    const prompt = `Bạn là một dịch giả, hãy dịch nội dung tôi gửi sang ${targetLanguage}.Lưu ý: Chỉ trả về phần dịch ko nói gì thêm\n${text}`;
    const result = await this.processWithAI(prompt);
    return dictionaryService.applyDictionary(result);
  }

  // Summarization specific method
  async summarize(text: string): Promise<string> {
    const prompt = `Hãy tóm tắt văn bản sau và trình bày kết quả theo định dạng markdown với cấu trúc sau:

## Tóm tắt
[Tóm tắt ngắn gọn, súc tích nội dung chính]

## Các ý chính
- [Ý chính 1]
- [Ý chính 2]
...

Văn bản cần tóm tắt:
${text}`;

    return this.processWithAI(prompt);
  }
}

export const aiService = new AIService(); 