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

interface GrammarError {
    text: string
    suggestion: string
    explanation: string
    type: 'grammar' | 'spelling' | 'style'
    startIndex: number
    endIndex: number
}

interface EnhancementOptions {
    improveStyle: boolean
    formalLevel: 'casual' | 'neutral' | 'formal'
    tone: 'friendly' | 'professional' | 'academic'
    preserveContext: boolean
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
        } else if (this.config.model === 'google-translate') {
            try {
                // Extract target language from prompt
                const targetLangMatch = prompt.match(/translate.*to\s+(\w+)/i);
                const targetLang = targetLangMatch ? targetLangMatch[1].toLowerCase() : 'en';
                
                // Extract text to translate
                const textToTranslate = prompt.split('CONTENT TO TRANSLATE:')[1]?.trim() || prompt;

                console.log('📤 Sending request to Google Translate...');
                
                // Encode the text for URL
                const encodedText = encodeURIComponent(textToTranslate);
                
                // Create Google Translate URL
                const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodedText}`;
                
                const response = await fetch(url);
                const data = await response.json();
                
                // Extract translated text from response
                const translatedText = data[0]
                    .map((item: any[]) => item[0])
                    .join('');
                
                return translatedText;
            } catch (error) {
                console.error('❌ Google Translate error:', {
                    error: error instanceof Error ? error.message : 'Unknown error',
                    timestamp: new Date().toISOString()
                });
                throw new Error('Failed to process with Google Translate');
            }
        } else {
            throw new Error('Unsupported model');
        }
    }

    // Translation specific method
    async translate(
        text: string,
        targetLanguage: string,
        preserveContext: boolean,
        onProgress?: (current: number, total: number) => void
    ): Promise<string> {
        const MAX_CHUNK_LENGTH = 5000; // Characters per chunk
        console.log('Original text length:', text.length);

        // Split text into paragraphs first
        const paragraphs = text.split(/\n\s*\n/); // Split on empty lines
        console.log('Number of paragraphs:', paragraphs.length);

        const chunks: string[] = [];
        let currentChunk = '';
        let currentLength = 0;

        // Helper function to calculate effective length considering Chinese characters
        const getEffectiveLength = (text: string): number => {
            let length = 0;
            for (let i = 0; i < text.length; i++) {
                if (/[\u4e00-\u9fff]/.test(text[i])) {
                    length += 2; // Chinese character counts as 2 characters
                } else {
                    length += 1;
                }
            }
            return length;
        };

        // Group paragraphs into chunks
        for (const paragraph of paragraphs) {
            const paragraphLength = getEffectiveLength(paragraph);
            console.log('Paragraph length:', paragraphLength, 'Current total length:', currentLength);

            // If adding this paragraph would exceed maxLength and we have content
            if ((currentLength + paragraphLength > MAX_CHUNK_LENGTH) && currentChunk) {
                console.log('Creating new chunk, current chunk length:', currentLength);
                chunks.push(currentChunk.trim());
                currentChunk = paragraph;
                currentLength = paragraphLength;
            } else {
                if (currentChunk) {
                    currentChunk += '\n\n' + paragraph;
                } else {
                    currentChunk = paragraph;
                }
                currentLength += paragraphLength;
            }
        }

        // Add the last chunk if not empty
        if (currentChunk) {
            chunks.push(currentChunk.trim());
        }

        console.log('Number of chunks created:', chunks.length);
        chunks.forEach((chunk, i) => {
            console.log(`Chunk ${i + 1} length:`, chunk.length);
        });

        // IMPORTANT: Check if we need to force chunk splitting for very long texts
        if (chunks.length === 1 && text.length > MAX_CHUNK_LENGTH) {
            console.log('Forcing chunk split for long text');
            // Split the single chunk into smaller pieces
            const forcedChunks: string[] = [];
            const lines = chunks[0].split('\n');
            currentChunk = '';
            currentLength = 0;

            for (const line of lines) {
                const lineLength = getEffectiveLength(line);
                if (currentLength + lineLength > MAX_CHUNK_LENGTH && currentChunk) {
                    forcedChunks.push(currentChunk.trim());
                    currentChunk = line;
                    currentLength = lineLength;
                } else {
                    if (currentChunk) {
                        currentChunk += '\n' + line;
                    } else {
                        currentChunk = line;
                    }
                    currentLength += lineLength;
                }
            }

            if (currentChunk) {
                forcedChunks.push(currentChunk.trim());
            }

            if (forcedChunks.length > 1) {
                console.log('Forced splitting created', forcedChunks.length, 'chunks');
                chunks.length = 0; // Clear original chunks
                chunks.push(...forcedChunks);
            }
        }

        // If text is still in one chunk and small enough, process normally
        if (chunks.length === 1 && text.length <= MAX_CHUNK_LENGTH) {
            onProgress?.(1, 1);
            const prompt = `You are a professional translator. Your task is to accurately translate the following content to ${targetLanguage}.

TRANSLATION PRINCIPLES:
1. ABSOLUTELY ONLY RETURN THE TRANSLATION, DO NOT ADD ANY NOTES OR EXPLANATIONS
2. MUST MAINTAIN THE ORIGINAL TEXT FORMAT (line spacing, line breaks, etc.)
3. DO NOT ADD NUMBERING, BULLET POINTS OR ANY CHARACTERS NOT IN THE ORIGINAL
4. DO NOT REPLY "OK" OR CONFIRM UNDERSTANDING

CONTENT TO TRANSLATE:
${text}`;
            const result = await this.processWithAI(prompt);
            return dictionaryService.applyDictionary(result);
        }

        // Translate each chunk
        const translatedChunks = [];
        for (let i = 0; i < chunks.length; i++) {
            onProgress?.(i + 1, chunks.length);

            const chunk = chunks[i];
            console.log(`Translating chunk ${i + 1}/${chunks.length}, length:`, chunk.length);

            const prompt = `You are a professional translator. Your task is to accurately translate the following content to ${targetLanguage}. This is part ${i + 1}/${chunks.length} of the text.

TRANSLATION PRINCIPLES:
1. ABSOLUTELY ONLY RETURN THE TRANSLATION, DO NOT ADD ANY NOTES OR EXPLANATIONS
2. MUST MAINTAIN THE ORIGINAL TEXT FORMAT (line spacing, line breaks, etc.)
3. DO NOT ADD NUMBERING, BULLET POINTS OR ANY CHARACTERS NOT IN THE ORIGINAL
4. DO NOT REPLY "OK" OR CONFIRM UNDERSTANDING
5. ENSURE CONTINUITY WITH PREVIOUS PARTS (if any)

CONTENT TO TRANSLATE:
${chunk}`;

            const result = await this.processWithAI(prompt);
            const processedResult = await dictionaryService.applyDictionary(result);
            translatedChunks.push(processedResult);

            // Log translation progress
            console.log(`✓ Completed chunk ${i + 1}/${chunks.length}`);
        }

        // Log final combination
        console.log('Combining', translatedChunks.length, 'translated chunks');

        // Combine translated chunks with proper spacing
        const finalResult = translatedChunks.join('\n\n');
        console.log('Final translation length:', finalResult.length);

        return finalResult;
    }

    private splitTextIntoChunks(text: string, maxLength: number): string[] {
        const chunks: string[] = [];
        let currentChunk = '';
        let currentLength = 0;

        // Helper function to calculate effective length considering Chinese characters
        const getEffectiveLength = (text: string): number => {
            let length = 0;
            for (let i = 0; i < text.length; i++) {
                // Check if character is Chinese (CJK Unified Ideographs range)
                if (/[\u4e00-\u9fff]/.test(text[i])) {
                    length += 4; // Chinese character counts as 4 characters
                } else {
                    length += 1;
                }
            }
            return length;
        };

        // Split text into sentences
        const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];

        for (const sentence of sentences) {
            const sentenceEffectiveLength = getEffectiveLength(sentence);

            // If current chunk is empty, always add the sentence regardless of length
            if (currentChunk === '') {
                currentChunk = sentence;
                currentLength = sentenceEffectiveLength;
                continue;
            }

            // If adding this sentence would exceed maxLength
            if (currentLength + sentenceEffectiveLength > maxLength) {
                chunks.push(currentChunk.trim());
                currentChunk = sentence;
                currentLength = sentenceEffectiveLength;
            } else {
                currentChunk += sentence;
                currentLength += sentenceEffectiveLength;
            }
        }

        // Add the last chunk if it's not empty
        if (currentChunk.trim().length > 0) {
            chunks.push(currentChunk.trim());
        }

        return chunks;
    }

    // Summarization specific method
    async summarize(text: string, language: string): Promise<string> {
        const prompt = `Hãy tóm tắt văn bản sau bằng ${language} và trình bày kết quả theo định dạng markdown với cấu trúc sau:

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
    async translateSRT(
        content: string,
        targetLanguage: string,
        onProgress?: (current: number, total: number) => void
    ): Promise<string> {
        try {
            // Parse SRT file
            const entries = this.parseSRT(content);

            if (entries.length === 0) {
                throw new Error('No valid SRT entries found');
            }

            // Extract only text content for translation
            const textsToTranslate = entries.map(entry => entry.text);

            // Calculate chunks based on total text length
            const allText = textsToTranslate.join('\n');
            const chunks = this.splitTextIntoChunks(allText, 5000);

            // Translate in chunks
            let translatedText = '';
            for (let i = 0; i < chunks.length; i++) {
                // Report progress
                onProgress?.(i + 1, chunks.length);

                const chunk = chunks[i];
                const prompt = `Dịch các câu sau sang ${targetLanguage}. Đây là phần ${i + 1}/${chunks.length}. Chỉ trả về các câu đã dịch, mỗi câu một dòng:\n\n${chunk}\n\nYêu cầu:\n- Chỉ trả về các câu đã dịch\n- Mỗi câu một dòng\n- Không thêm số thứ tự\n- Không thêm bất kỳ chú thích nào khác\n- Không thêm dấu gạch đầu dòng`;

                const result = await this.processWithAI(prompt);
                translatedText += (i > 0 ? '\n' : '') + result;
            }

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

    async generateQuiz(systemPrompt: string, userPrompt: string): Promise<string> {
        try {
            const prompt = `${systemPrompt}\n\nYêu cầu: ${userPrompt}`;
            const result = await this.processWithAI(prompt);
            return result;
        } catch (error) {
            console.error('AI error:', error);
            throw new Error('Lỗi khi tạo câu hỏi');
        }
    }

    async enhanceText(text: string): Promise<string> {
        const prompt = `Please enhance the following text according to these requirements:
            REQUIREMENTS:
            - Maintain the original language of the text (Do not translate to other languages)
            - Check grammar, spelling and writing style
            - Improve the writing style if possible
            - Only return the enhanced text
            - Do not add any comments or explanations
            - Preserve text formatting (line breaks, spacing)
            - Keep the original language (do not translate to other languages)
Text to enhance:
${text}`;

        try {
            return await this.processWithAI(prompt);
        } catch (error) {
            console.error('Text enhancement error:', error);
            throw new Error('Failed to enhance text');
        }
    }
}

export const aiService = new AIService(); 