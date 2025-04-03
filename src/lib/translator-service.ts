import { aiService } from './ai-service';
import { dictionaryService } from './dictionary-service';
import { TRANSLATION_TONES } from './ai-service';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface TranslationOptions {
    targetLanguage: string;
    preserveContext: boolean;
    tone: string;
    useFormat?: boolean;
    useMarkdown?: boolean;
    useMarkdownFormat?: boolean;
    useMarkdownDisplay?: boolean;
}

interface ImageTranslationOptions extends TranslationOptions {
    imageData: string;
    mimeType: string;
}

class TranslatorService {
    private createMarkdownPrompt(useMarkdown: boolean, useFormat: boolean, isImage: boolean = false): string {
        if (!useFormat) return '';

        let prompt = `
- Format the text for better readability:
  + Preserve original meaning and content
  + Ensure consistency in formatting
  + Use appropriate spacing and line breaks
  + Structure the content logically`;

        if (useMarkdown) {
            prompt += `
- CRITICAL: The response MUST be formatted using markdown syntax:
  + Use **bold** for important terms and emphasis
  + Use *italics* for special terms and foreign words
  + Use # ## ### for headings and section hierarchy
  + Use ordered lists (1. 2. 3.) for sequential items
  + Use unordered lists (- or *) for non-sequential items
  + Use > for quotes and blockquotes
  + Use \`code\` for technical terms and code snippets
  + Use --- or === for horizontal dividers
  + Use tables (| Header | Header |) when appropriate
  + Use [link text](url) for links
  + Use ![alt text](image-url) for images
  + Use ~~strikethrough~~ for deleted or corrected text
  + Use superscript^text^ for footnotes
  + Use subscript~text~ for chemical formulas
  + Use >!spoiler!< for spoiler text
  + Use Discord-style markdown when appropriate
- The response MUST be properly formatted markdown
- Do not include any explanations about markdown formatting
- Do not include any markdown syntax guides or examples
- Just return the translated and markdown-formatted text`;

            if (isImage) {
                prompt += `
- Preserve the original text structure and hierarchy
- Format headings and sections appropriately based on visual hierarchy in the image`;
            } else {
                prompt += `
- If the input text contains markdown, preserve and translate the markdown syntax appropriately`;
            }
        }

        return prompt;
    }

    private createTranslationPrompt(
        text: string,
        targetLanguage: string,
        preserveContext: boolean,
        options?: {
            previousContext?: string;
            isFirstChunk?: boolean;
            isLastChunk?: boolean;
            totalChunks?: number;
            currentChunk?: number;
            tone?: string;
            useFormat?: boolean;
            useMarkdownFormat?: boolean;
        }
    ): string {
        const translationTone = TRANSLATION_TONES[options?.tone || 'normal'];

        let prompt = `You are a translation expert. Please translate the following text to ${targetLanguage}.

Style: ${translationTone.style}

Context:
${preserveContext ? '- Maintain original context, style, tone, and terminology' : '- Focus on clarity and accuracy'}
${options?.previousContext ? `\nPrevious context:\n${options.previousContext}` : ''}
${options?.totalChunks ? `\nPart ${options.currentChunk}/${options.totalChunks}` : ''}

Requirements:
- Translate accurately while ensuring natural and coherent flow
- Maintain consistency in terminology and style
- Return only the translation, no explanations or notes
- Ensure the translation is easy to understand`;

        if (options?.useFormat) {
            prompt += `
- Format the text for better readability:
  + Preserve original meaning and content
  + Ensure consistency in formatting
  + Use appropriate spacing and line breaks
  + Structure the content logically`;
        } else {
            prompt += `
- CRITICAL: Preserve ALL original formatting:
  + Keep exact same line breaks and spacing
  + Maintain original paragraph structure
  + Preserve all indentation and alignment
  + Keep original text emphasis and styling
  + Do not modify any formatting elements`;
        }

        prompt += this.createMarkdownPrompt(options?.useMarkdownFormat || false, options?.useFormat || false);

        prompt += `\n\nText to translate:\n${text}`;

        return prompt;
    }

    private createImageTranslationPrompt(
        targetLanguage: string,
        preserveContext: boolean,
        tone: string,
        useMarkdown: boolean,
        useFormat: boolean
    ): string {
        const translationTone = TRANSLATION_TONES[tone];
        let prompt = `Vui lòng dịch các văn bản chính và quan trọng trong hình ảnh sang ${targetLanguage}.

Translation Style: ${translationTone.style}

Requirements:
- Focus ONLY on translating main and important text content
- Ignore small, decorative, or unimportant text (like watermarks, timestamps, minor UI elements,phone numbers,etc)
- Ignore text that is less than approximately 12px in size
- Maintain the original context and meaning of important text
- Only return the translated text
- Do not add any explanations or comments
- If there's no significant text in the image, respond with "No significant text found in image"`;

        if (useFormat) {
            prompt += `
- Format the text for better readability:
  + Add appropriate line breaks and spacing
  + Clearly separate paragraphs
  + Maintain the original meaning and content
  + Ensure consistency in formatting`;
        } else {
            prompt += `
- CRITICAL: Preserve ALL original formatting:
  + Keep exact same line breaks and spacing
  + Maintain original paragraph structure
  + Preserve all indentation and alignment
  + Keep original text emphasis and styling
  + Do not modify any formatting elements`;
        }

        prompt += this.createMarkdownPrompt(useMarkdown, useFormat, true);

        return prompt;
    }

    async translateText(
        text: string,
        options: TranslationOptions,
        onProgress?: (current: number, total: number) => void
    ): Promise<string> {
        if (!text.trim()) {
            return '';
        }

        try {
            // Tối ưu kích thước chunk dựa trên model
            const MAX_CHUNK_LENGTH = 3000;

            // Chuẩn hóa xuống dòng
            const normalizedText = text.replace(/\r\n/g, '\n');

            // Tách văn bản thành các đoạn dựa trên xuống dòng kép
            const paragraphs = normalizedText.split(/\n\s*\n/).filter(p => p.trim());

            // Nếu văn bản ngắn, xử lý trực tiếp
            if (text.length <= MAX_CHUNK_LENGTH) {
                onProgress?.(1, 1);
                const prompt = this.createTranslationPrompt(text, options.targetLanguage, options.preserveContext, { 
                    tone: options.tone, 
                    useFormat: options.useFormat, 
                    useMarkdownFormat: options.useMarkdownFormat 
                });
                const result = await aiService.processWithAI(prompt);
                return await dictionaryService.applyDictionary(result);
            }

            // Nhóm các đoạn thành các chunk
            const chunks: string[] = [];
            let currentChunk = '';

            for (const paragraph of paragraphs) {
                // Nếu đoạn quá dài, chia nhỏ thành các câu
                if (paragraph.length > MAX_CHUNK_LENGTH) {
                    const sentences = paragraph.match(/[^.!?]+[.!?]+/g) || [paragraph];
                    for (const sentence of sentences) {
                        if (currentChunk.length + sentence.length > MAX_CHUNK_LENGTH && currentChunk) {
                            chunks.push(currentChunk.trim());
                            currentChunk = sentence;
                        } else {
                            currentChunk = currentChunk ? `${currentChunk} ${sentence}` : sentence;
                        }
                    }
                }
                // Nếu không, thêm cả đoạn vào chunk
                else {
                    if (currentChunk.length + paragraph.length > MAX_CHUNK_LENGTH) {
                        chunks.push(currentChunk.trim());
                        currentChunk = paragraph;
                    } else {
                        currentChunk = currentChunk ? `${currentChunk}\n\n${paragraph}` : paragraph;
                    }
                }
            }

            // Thêm chunk cuối cùng nếu còn
            if (currentChunk) {
                chunks.push(currentChunk.trim());
            }

            // Dịch từng chunk
            const translatedChunks: string[] = [];
            let previousContext = '';

            for (let i = 0; i < chunks.length; i++) {
                onProgress?.(i + 1, chunks.length);

                const chunk = chunks[i];
                const isFirstChunk = i === 0;
                const isLastChunk = i === chunks.length - 1;

                // Tạo prompt với context
                let prompt = this.createTranslationPrompt(
                    chunk,
                    options.targetLanguage,
                    options.preserveContext,
                    {
                        previousContext: isFirstChunk ? '' : previousContext,
                        isFirstChunk,
                        isLastChunk,
                        totalChunks: chunks.length,
                        currentChunk: i + 1,
                        tone: options.tone,
                        useFormat: options.useFormat,
                        useMarkdownFormat: options.useMarkdownFormat
                    }
                );

                try {
                    const result = await aiService.processWithAI(prompt);
                    const processedResult = await dictionaryService.applyDictionary(result);
                    translatedChunks.push(processedResult);

                    // Lưu context cho chunk tiếp theo
                    previousContext = processedResult.slice(-200); // Lấy 200 ký tự cuối làm context

                    // Log tiến độ
                    console.log(`✓ Completed chunk ${i + 1}/${chunks.length}`);
                } catch (error) {
                    console.error(`Error translating chunk ${i + 1}:`, error);
                    // Nếu lỗi, thử lại với chunk nhỏ hơn
                    const subChunks = chunk.split(/[.!?] /).filter(Boolean);
                    let subTranslated = '';
                    for (const subChunk of subChunks) {
                        try {
                            const subPrompt = this.createTranslationPrompt(subChunk, options.targetLanguage, options.preserveContext, { 
                                tone: options.tone, 
                                useFormat: options.useFormat,
                                useMarkdownFormat: options.useMarkdownFormat
                            });
                            const subResult = await aiService.processWithAI(subPrompt);
                            subTranslated += subResult + ' ';
                        } catch (e) {
                            console.error('Sub-chunk translation failed:', e);
                            subTranslated += subChunk + ' '; // Giữ nguyên text gốc nếu lỗi
                        }
                    }
                    translatedChunks.push(subTranslated.trim());
                }
            }

            // Kết hợp các chunk đã dịch
            return translatedChunks.join('\n\n');
        } catch (error) {
            console.error('Translation error:', error);
            throw new Error('Failed to translate text');
        }
    }

    async translateImage(
        options: ImageTranslationOptions
    ): Promise<string> {
        try {
            const geminiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
            if (!geminiKey) {
                throw new Error('Gemini API key is not configured');
            }

            console.log('📤 Sending image translation request to Gemini...');
            const genAI = new GoogleGenerativeAI(geminiKey);
            const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

            const prompt = this.createImageTranslationPrompt(
                options.targetLanguage,
                options.preserveContext,
                options.tone,
                options.useMarkdownFormat || false,
                options.useFormat || false
            );

            const imagePart = {
                inlineData: {
                    data: options.imageData,
                    mimeType: options.mimeType
                }
            };

            const result = await model.generateContent([prompt, imagePart]);
            const translatedText = result.response.text();

            // Apply dictionary if needed
            return await dictionaryService.applyDictionary(translatedText);
        } catch (error) {
            console.error('Image translation error:', error);
            throw new Error('Failed to translate image');
        }
    }

    async translateFiles(
        files: File[],
        options: TranslationOptions,
        onProgress?: (current: number, total: number) => void
    ): Promise<{ name: string; content: string }[]> {
        try {
            const translatedContents = await Promise.all(
                files.map(async (file) => {
                    let content = '';
                    if (file.type === 'text/plain' || file.type === 'text/markdown' || file.type === 'application/json') {
                        const text = await file.text();
                        content = await this.translateText(text, options, onProgress);
                    } else {
                        content = 'File type not supported for translation yet';
                    }
                    return {
                        name: `translated_${file.name}`,
                        content
                    };
                })
            );
            return translatedContents;
        } catch (error) {
            console.error('File translation error:', error);
            throw new Error('Failed to translate files');
        }
    }


    getTranslationTones() {
        return TRANSLATION_TONES;
    }
}

export const translatorService = new TranslatorService();
