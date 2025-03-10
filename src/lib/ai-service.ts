import { GoogleGenerativeAI } from '@google/generative-ai';
import { createOpenRouterClient, isOpenRouterModel } from './api-config';
import { dictionaryService } from './dictionary-service';
import { OpenAI } from 'openai';

interface AIServiceConfig {
    model: string;
}

interface SRTEntry {
    id: number;
    timecode: string;
    text: string;
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
                console.log(`📤 Sending request to ${this.config.model}...`);
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

    // Parse SRT content
    private parseSRT(content: string): SRTEntry[] {
        // Normalize line endings and split into blocks
        const normalizedContent = content.replace(/\r\n/g, '\n');
        const blocks = normalizedContent.trim().split('\n\n').filter(block => block.trim());
        
        return blocks.map(block => {
            const lines = block.split('\n').filter(line => line.trim());
            if (lines.length < 3) {
                console.warn('Invalid SRT block:', block);
                return null;
            }
            
            const id = parseInt(lines[0]);
            const timecode = lines[1];
            const text = lines.slice(2).join(' '); // Join multiple lines of text
            
            if (isNaN(id)) {
                console.warn('Invalid SRT ID:', lines[0]);
                return null;
            }
            
            return { id, timecode, text };
        }).filter((entry): entry is SRTEntry => entry !== null);
    }

    // Format SRT content
    private formatSRT(entries: SRTEntry[]): string {
        return entries.map(entry => {
            return `${entry.id}\n${entry.timecode}\n${entry.text}`;
        }).join('\n\n') + '\n';
    }

    // SRT translation method
    async translateSRT(content: string, targetLanguage: string): Promise<string> {
        try {
            // Parse SRT file
            const entries = this.parseSRT(content);
            
            if (entries.length === 0) {
                throw new Error('No valid SRT entries found');
            }
            
            // Extract only text content for translation
            const textsToTranslate = entries.map(entry => entry.text);
            
            // Create prompt for translation
            const prompt = `Dịch các câu sau sang ${targetLanguage}. Chỉ trả về các câu đã dịch, mỗi câu một dòng:

${textsToTranslate.join('\n')}

Yêu cầu:
- Chỉ trả về các câu đã dịch
- Mỗi câu một dòng
- Không thêm số thứ tự
- Không thêm bất kỳ chú thích nào khác
- Không thêm dấu gạch đầu dòng`;

            // Get translations
            let translatedText = await this.processWithAI(prompt);
            
            // Clean up the response
            translatedText = translatedText
                .split('\n')
                .map(line => line.trim())
                .filter(line => line && !line.startsWith('-') && !line.startsWith('['))
                .join('\n');

            // Apply dictionary to the entire translated text
            translatedText = await dictionaryService.applyDictionary(translatedText);
            
            // Split into lines after dictionary application
            const translatedLines = translatedText.split('\n');

            // Ensure we have translations for all entries
            if (translatedLines.length !== entries.length) {
                console.warn(`Translation mismatch: expected ${entries.length} entries but got ${translatedLines.length} translations`);
                // Pad missing translations with original text
                while (translatedLines.length < entries.length) {
                    translatedLines.push(entries[translatedLines.length].text);
                }
            }

            // Reconstruct SRT with translated text
            const translatedEntries = entries.map((entry, index) => ({
                ...entry,
                text: translatedLines[index] || entry.text
            }));

            // Format back to SRT
            return this.formatSRT(translatedEntries);
        } catch (error) {
            console.error('❌ SRT translation error:', error);
            throw new Error('Failed to translate SRT file');
        }
    }
}

export const aiService = new AIService(); 