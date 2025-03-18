'use client';

import { useState, useRef, ChangeEvent, useEffect } from 'react';
import { aiService } from '@/lib/ai-service';
import { MdImage, MdDelete, MdAdd, MdSend, MdAutoFixHigh, MdVideoCameraBack, MdAudiotrack, MdUpload } from 'react-icons/md';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface MediaFile {
  id: string;
  file: File;
  preview: string;
  type: 'image' | 'video' | 'audio';
}

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

export default function MediaQA() {
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const mediaInputRef = useRef<HTMLInputElement>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [followUpQuestion, setFollowUpQuestion] = useState('');
  const [isFollowUpLoading, setIsFollowUpLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const detectFileType = (file: File): 'image' | 'video' | 'audio' => {
    const mimeType = file.type.toLowerCase();
    if (mimeType.startsWith('image/')) {
      return 'image';
    } else if (mimeType.startsWith('video/')) {
      return 'video';
    } else if (mimeType.startsWith('audio/')) {
      return 'audio';
    }
    
    // Fallback to extension check
    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'tiff', 'tif', 'heif', 'ico'];
    const videoExtensions = ['mp4', 'webm', 'ogg', 'mov', 'avi', 'wmv', 'flv', 'mkv'];
    const audioExtensions = ['mp3', 'wav', 'ogg', 'aac', 'flac', 'm4a'];
    
    if (imageExtensions.includes(extension)) {
      return 'image';
    } else if (videoExtensions.includes(extension)) {
      return 'video';
    } else if (audioExtensions.includes(extension)) {
      return 'audio';
    }
    
    // Default to image if can't determine
    return 'image';
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).map(file => {
        return {
          id: Math.random().toString(36).substring(2, 9),
          file,
          preview: URL.createObjectURL(file),
          type: detectFileType(file)
        };
      });
      
      setMediaFiles(prev => [...prev, ...newFiles]);
    }
    
    // Reset file input
    if (e.target instanceof HTMLInputElement) {
      e.target.value = '';
    }
  };

  const removeMedia = (id: string) => {
    setMediaFiles(prev => {
      const filtered = prev.filter(media => media.id !== id);
      // Revoke object URLs to avoid memory leaks
      const removed = prev.find(media => media.id === id);
      if (removed) {
        URL.revokeObjectURL(removed.preview);
      }
      return filtered;
    });
  };

  const handleSubmit = async () => {
    if (mediaFiles.length === 0) {
      toast.error('Vui lòng tải lên ít nhất một tệp phương tiện');
      return;
    }

    if (!question.trim()) {
      toast.error('Vui lòng nhập câu hỏi của bạn');
      return;
    }

    setIsLoading(true);
    setAnswer('');
    
    // Add user question to messages
    const userMessageId = Math.random().toString(36).substring(2, 9);
    const userMessage: Message = {
      id: userMessageId,
      content: question,
      isUser: true,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);

    try {
      // Convert media files to base64
      const mediaPromises = mediaFiles.map(async (media) => {
        return new Promise<{data: string, mimeType: string, type: 'image' | 'video' | 'audio'}>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            // Extract base64 data without the prefix
            const base64Data = result.split(',')[1];
            resolve({
              data: base64Data,
              mimeType: media.file.type,
              type: media.type
            });
          };
          reader.onerror = reject;
          reader.readAsDataURL(media.file);
        });
      });

      const mediaData = await Promise.all(mediaPromises);

      let result: string;
      
      // Check if we have a single video file
      const videoFile = mediaData.find(media => media.type === 'video');
      // Check if we have a single audio file
      const audioFile = mediaData.find(media => media.type === 'audio');
      
      if (videoFile) {
        // Process video
        result = await aiService.analyzeVideo(
          videoFile.data,
          videoFile.mimeType,
          question
        );
      } else if (audioFile) {
        // Process audio
        result = await aiService.analyzeAudio(
          audioFile.data,
          audioFile.mimeType,
          question
        );
      } else if (mediaData.length === 1) {
        // Single image analysis
        result = await aiService.analyzeImage(
          mediaData[0].data,
          mediaData[0].mimeType,
          question
        );
      } else {
        // Multiple images analysis
        result = await aiService.analyzeMultipleImages(
          mediaData.map(m => ({ data: m.data, mimeType: m.mimeType })),
          question
        );
      }

      setAnswer(result);
      
      // Add AI response to messages
      const aiMessageId = Math.random().toString(36).substring(2, 9);
      const aiMessage: Message = {
        id: aiMessageId,
        content: result,
        isUser: false,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiMessage]);
      
      // Clear the question input
      setQuestion('');
    } catch (error) {
      console.error('Error analyzing media:', error);
      toast.error('Đã xảy ra lỗi khi phân tích phương tiện');
      
      // Add error message to chat
      const errorMessageId = Math.random().toString(36).substring(2, 9);
      const errorMessage: Message = {
        id: errorMessageId,
        content: 'Đã xảy ra lỗi khi phân tích phương tiện. Vui lòng thử lại.',
        isUser: false,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFollowUpQuestion = async () => {
    if (!followUpQuestion.trim()) {
      toast.error('Vui lòng nhập câu hỏi của bạn');
      return;
    }

    setIsFollowUpLoading(true);
    
    // Add user follow-up question to messages
    const userMessageId = Math.random().toString(36).substring(2, 9);
    const userMessage: Message = {
      id: userMessageId,
      content: followUpQuestion,
      isUser: true,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);

    try {
      // Create a context from previous messages
      const context = messages
        .map(msg => `${msg.isUser ? 'User' : 'AI'}: ${msg.content}`)
        .join('\n\n');
      
      // Prepare the prompt with context
      const prompt = `Dựa trên cuộc trò chuyện trước đó và phương tiện đã được phân tích, hãy trả lời câu hỏi sau:
      
Ngữ cảnh trước đó:
${context}

Câu hỏi mới: ${followUpQuestion}

Lưu ý: Nếu câu hỏi liên quan đến phương tiện đã phân tích, hãy trả lời dựa trên kiến thức của bạn về phương tiện đó. Nếu không thể trả lời chính xác, hãy cho biết bạn không có đủ thông tin.`;

      // Get response from AI
      const result = await aiService.processWithAI(prompt);
      
      // Add AI response to messages
      const aiMessageId = Math.random().toString(36).substring(2, 9);
      const aiMessage: Message = {
        id: aiMessageId,
        content: result,
        isUser: false,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiMessage]);
      
      // Clear the follow-up question input
      setFollowUpQuestion('');
    } catch (error) {
      console.error('Error processing follow-up question:', error);
      toast.error('Đã xảy ra lỗi khi xử lý câu hỏi. Vui lòng thử lại.');
      
      // Add error message to chat
      const errorMessageId = Math.random().toString(36).substring(2, 9);
      const errorMessage: Message = {
        id: errorMessageId,
        content: 'Đã xảy ra lỗi khi xử lý câu hỏi. Vui lòng thử lại.',
        isUser: false,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsFollowUpLoading(false);
    }
  };

  return (
    <div className="container py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Hỏi đáp về hình ảnh, video và âm thanh</h1>
        
        <Card className="p-6 mb-6">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium">Tải lên phương tiện</h2>
              <Button 
                variant="default"
                onClick={() => mediaInputRef.current?.click()}
                className="flex items-center gap-1"
              >
                <MdUpload className="h-4 w-4" />
                Tải lên phương tiện
              </Button>
            </div>
            
            <div className="flex flex-wrap gap-4 mb-4">
              {mediaFiles.map((media) => (
                <div 
                  key={media.id} 
                  className="relative w-32 h-32 rounded-lg overflow-hidden border border-gray-200"
                >
                  {media.type === 'image' ? (
                    <img 
                      src={media.preview} 
                      alt="Preview" 
                      className="w-full h-full object-cover"
                    />
                  ) : media.type === 'video' ? (
                    <div className="relative w-full h-full">
                      <video 
                        src={media.preview} 
                        className="w-full h-full object-cover"
                        controls
                      />
                      <div className="absolute top-0 left-0 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded-br">
                        Video
                      </div>
                    </div>
                  ) : (
                    <div className="relative w-full h-full flex flex-col items-center justify-center bg-gray-100">
                      <MdAudiotrack className="h-10 w-10 text-gray-500 mb-2" />
                      <audio 
                        src={media.preview} 
                        className="w-full absolute bottom-0"
                        controls
                      />
                      <div className="absolute top-0 left-0 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded-br">
                        Audio
                      </div>
                    </div>
                  )}
                  <button
                    onClick={() => removeMedia(media.id)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                    aria-label="Remove media"
                  >
                    <MdDelete size={16} />
                  </button>
                </div>
              ))}
              
              <button
                onClick={() => mediaInputRef.current?.click()}
                className="w-32 h-32 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg hover:border-primary/50 transition-colors bg-gray-50/30"
              >
                <MdAdd size={24} className="mb-1 text-gray-500" />
                <span className="text-sm text-gray-500">Thêm phương tiện</span>
              </button>
              
              <input
                type="file"
                ref={mediaInputRef}
                onChange={handleFileChange}
                accept="image/*,video/*,audio/*,.mp3,.wav,.ogg,.aac,.flac,.m4a,.mp4,.webm,.mov,.avi,.wmv,.flv,.mkv,.jpg,.jpeg,.png,.gif,.bmp,.webp,.svg,.tiff,.tif,.heif,.ico"
                multiple
                className="hidden"
              />
            </div>
            
            <div className="text-sm text-muted-foreground">
              <p>Hỗ trợ các định dạng:</p>
              <ul className="list-disc pl-5 mt-1">
                <li>Hình ảnh: JPG, PNG, GIF, BMP, WEBP, SVG, HEIF, TIFF</li>
                <li>Video: MP4, WEBM, MOV, AVI, MKV</li>
                <li>Âm thanh: MP3, WAV, OGG, AAC, FLAC</li>
              </ul>
              <p className="mt-2">Kích thước tối đa: 10MB mỗi tệp</p>
              <p className="text-amber-500 mt-1">Lưu ý: Phân tích video và âm thanh có thể mất nhiều thời gian hơn</p>
            </div>
          </div>
          
          <div className="mb-6">
            <h2 className="text-lg font-medium mb-3">Câu hỏi của bạn</h2>
            <Textarea
              value={question}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setQuestion(e.target.value)}
              placeholder="Nhập câu hỏi của bạn về hình ảnh, video hoặc âm thanh..."
              className="w-full p-3 min-h-[100px] resize-none"
            />
          </div>
          
          <div className="flex justify-end">
            <Button
              onClick={handleSubmit}
              disabled={isLoading || mediaFiles.length === 0 || !question.trim()}
              className="flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                <>
                  <MdSend className="h-4 w-4" />
                  Gửi câu hỏi
                </>
              )}
            </Button>
          </div>
        </Card>
        
        {messages.length > 0 && (
          <Card className="p-6 mb-6">
            <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
              <MdAutoFixHigh className="h-5 w-5 text-primary" />
              Cuộc trò chuyện
            </h2>
            
            <div className="space-y-4 mb-6 max-h-[500px] overflow-y-auto p-2">
              {messages.map((message) => (
                <div 
                  key={message.id} 
                  className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-[80%] p-3 rounded-2xl mb-1 ${
                      message.isUser 
                        ? 'bg-[hsl(var(--primary))] text-white rounded-br-none' 
                        : 'bg-white border border-gray-200 rounded-tl-none'
                    }`}
                  >
                    {message.isUser ? (
                      <div>{message.content}</div>
                    ) : (
                      <div className="markdown-content">
                        <div dangerouslySetInnerHTML={{ 
                          __html: message.content
                            .split('\n')
                            .map((line, index, array) => {
                              // Handle code blocks
                              if (line.startsWith('```')) {
                                // Start of code block
                                if (!array.slice(index + 1).some(l => l.startsWith('```'))) {
                                  // No closing code block found
                                  return `<pre><code>${line.substring(3)}</code></pre>`;
                                }
                                
                                // Find the closing code block
                                let codeContent = '';
                                let i = index + 1;
                                while (i < array.length && !array[i].startsWith('```')) {
                                  codeContent += array[i] + '\n';
                                  array[i] = ''; // Mark as processed
                                  i++;
                                }
                                if (i < array.length) array[i] = ''; // Mark closing tag as processed
                                
                                // Extract language if specified
                                const language = line.substring(3).trim();
                                return `<pre${language ? ` class="language-${language}"` : ''}><code>${codeContent}</code></pre>`;
                              }
                              
                              // Skip lines already processed
                              if (line === '') return '';
                              
                              // Handle headings
                              if (line.startsWith('# ')) {
                                return `<h1>${line.substring(2)}</h1>`;
                              } else if (line.startsWith('## ')) {
                                return `<h2>${line.substring(3)}</h2>`;
                              } else if (line.startsWith('### ')) {
                                return `<h3>${line.substring(4)}</h3>`;
                              } else if (line.startsWith('#### ')) {
                                return `<h4>${line.substring(5)}</h4>`;
                              } else if (line.startsWith('##### ')) {
                                return `<h5>${line.substring(6)}</h5>`;
                              } else if (line.startsWith('###### ')) {
                                return `<h6>${line.substring(7)}</h6>`;
                              }
                              
                              // Handle bold and italic
                              let processedLine = line
                                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                                .replace(/__(.*?)__/g, '<strong>$1</strong>')
                                .replace(/_(.*?)_/g, '<em>$1</em>');
                              
                              // Handle inline code
                              processedLine = processedLine.replace(/`(.*?)`/g, '<code>$1</code>');
                              
                              // Handle links
                              processedLine = processedLine.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
                              
                              // Handle lists
                              const isUnorderedListItem = line.match(/^\s*[\-\*]\s/);
                              const isOrderedListItem = line.match(/^\s*\d+\.\s/);
                              
                              if (isUnorderedListItem) {
                                // Check if we need to start a new list
                                const prevLineIsListItem = index > 0 && (
                                  array[index - 1].match(/^\s*[\-\*]\s/) || 
                                  array[index - 1].match(/^\s*\d+\.\s/)
                                );
                                
                                const listItemContent = processedLine.replace(/^\s*[\-\*]\s/, '');
                                
                                if (!prevLineIsListItem) {
                                  return `<ul><li>${listItemContent}</li>`;
                                } else {
                                  // Check if we need to close the list
                                  const nextLineIsListItem = index < array.length - 1 && (
                                    array[index + 1].match(/^\s*[\-\*]\s/) || 
                                    array[index + 1].match(/^\s*\d+\.\s/)
                                  );
                                  
                                  if (!nextLineIsListItem) {
                                    return `<li>${listItemContent}</li></ul>`;
                                  } else {
                                    return `<li>${listItemContent}</li>`;
                                  }
                                }
                              } else if (isOrderedListItem) {
                                // Check if we need to start a new list
                                const prevLineIsListItem = index > 0 && (
                                  array[index - 1].match(/^\s*[\-\*]\s/) || 
                                  array[index - 1].match(/^\s*\d+\.\s/)
                                );
                                
                                const listItemContent = processedLine.replace(/^\s*\d+\.\s/, '');
                                
                                if (!prevLineIsListItem) {
                                  return `<ol><li>${listItemContent}</li>`;
                                } else {
                                  // Check if we need to close the list
                                  const nextLineIsListItem = index < array.length - 1 && (
                                    array[index + 1].match(/^\s*[\-\*]\s/) || 
                                    array[index + 1].match(/^\s*\d+\.\s/)
                                  );
                                  
                                  if (!nextLineIsListItem) {
                                    return `<li>${listItemContent}</li></ol>`;
                                  } else {
                                    return `<li>${listItemContent}</li>`;
                                  }
                                }
                              }
                              
                              // Handle blockquotes
                              if (line.startsWith('> ')) {
                                return `<blockquote>${processedLine.substring(2)}</blockquote>`;
                              }
                              
                              // Handle horizontal rule
                              if (line.match(/^(\*{3,}|-{3,}|_{3,})$/)) {
                                return '<hr />';
                              }
                              
                              // Return paragraph if not empty
                              return line.trim() ? `<p>${processedLine}</p>` : '';
                            })
                            .filter(Boolean) // Remove empty lines
                            .join('')
                        }} />
                      </div>
                    )}
                    <div className="text-xs opacity-70 text-right mt-1">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            
            <div className="flex items-end gap-2">
              <Textarea
                value={followUpQuestion}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFollowUpQuestion(e.target.value)}
                placeholder="Nhập câu hỏi tiếp theo của bạn..."
                className="w-full p-3 min-h-[60px] resize-none"
                onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleFollowUpQuestion();
                  }
                }}
              />
              <Button
                onClick={handleFollowUpQuestion}
                disabled={isFollowUpLoading || !followUpQuestion.trim()}
                className="h-10 px-4"
              >
                {isFollowUpLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <MdSend className="h-5 w-5" />
                )}
              </Button>
            </div>
          </Card>
        )}
        
        {answer && messages.length === 0 && (
          <Card className="p-6">
            <h2 className="text-lg font-medium mb-3 flex items-center gap-2">
              <MdAutoFixHigh className="h-5 w-5 text-primary" />
              Câu trả lời
            </h2>
            <div className="prose prose-sm max-w-none markdown-content">
              <div dangerouslySetInnerHTML={{ 
                __html: answer
                  .split('\n')
                  .map((line, index, array) => {
                    // Handle code blocks
                    if (line.startsWith('```')) {
                      // Start of code block
                      if (!array.slice(index + 1).some(l => l.startsWith('```'))) {
                        // No closing code block found
                        return `<pre><code>${line.substring(3)}</code></pre>`;
                      }
                      
                      // Find the closing code block
                      let codeContent = '';
                      let i = index + 1;
                      while (i < array.length && !array[i].startsWith('```')) {
                        codeContent += array[i] + '\n';
                        array[i] = ''; // Mark as processed
                        i++;
                      }
                      if (i < array.length) array[i] = ''; // Mark closing tag as processed
                      
                      // Extract language if specified
                      const language = line.substring(3).trim();
                      return `<pre${language ? ` class="language-${language}"` : ''}><code>${codeContent}</code></pre>`;
                    }
                    
                    // Skip lines already processed
                    if (line === '') return '';
                    
                    // Handle headings
                    if (line.startsWith('# ')) {
                      return `<h1>${line.substring(2)}</h1>`;
                    } else if (line.startsWith('## ')) {
                      return `<h2>${line.substring(3)}</h2>`;
                    } else if (line.startsWith('### ')) {
                      return `<h3>${line.substring(4)}</h3>`;
                    } else if (line.startsWith('#### ')) {
                      return `<h4>${line.substring(5)}</h4>`;
                    } else if (line.startsWith('##### ')) {
                      return `<h5>${line.substring(6)}</h5>`;
                    } else if (line.startsWith('###### ')) {
                      return `<h6>${line.substring(7)}</h6>`;
                    }
                    
                    // Handle bold and italic
                    let processedLine = line
                      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      .replace(/\*(.*?)\*/g, '<em>$1</em>')
                      .replace(/__(.*?)__/g, '<strong>$1</strong>')
                      .replace(/_(.*?)_/g, '<em>$1</em>');
                    
                    // Handle inline code
                    processedLine = processedLine.replace(/`(.*?)`/g, '<code>$1</code>');
                    
                    // Handle links
                    processedLine = processedLine.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
                    
                    // Handle lists
                    const isUnorderedListItem = line.match(/^\s*[\-\*]\s/);
                    const isOrderedListItem = line.match(/^\s*\d+\.\s/);
                    
                    if (isUnorderedListItem) {
                      // Check if we need to start a new list
                      const prevLineIsListItem = index > 0 && (
                        array[index - 1].match(/^\s*[\-\*]\s/) || 
                        array[index - 1].match(/^\s*\d+\.\s/)
                      );
                      
                      const listItemContent = processedLine.replace(/^\s*[\-\*]\s/, '');
                      
                      if (!prevLineIsListItem) {
                        return `<ul><li>${listItemContent}</li>`;
                      } else {
                        // Check if we need to close the list
                        const nextLineIsListItem = index < array.length - 1 && (
                          array[index + 1].match(/^\s*[\-\*]\s/) || 
                          array[index + 1].match(/^\s*\d+\.\s/)
                        );
                        
                        if (!nextLineIsListItem) {
                          return `<li>${listItemContent}</li></ul>`;
                        } else {
                          return `<li>${listItemContent}</li>`;
                        }
                      }
                    } else if (isOrderedListItem) {
                      // Check if we need to start a new list
                      const prevLineIsListItem = index > 0 && (
                        array[index - 1].match(/^\s*[\-\*]\s/) || 
                        array[index - 1].match(/^\s*\d+\.\s/)
                      );
                      
                      const listItemContent = processedLine.replace(/^\s*\d+\.\s/, '');
                      
                      if (!prevLineIsListItem) {
                        return `<ol><li>${listItemContent}</li>`;
                      } else {
                        // Check if we need to close the list
                        const nextLineIsListItem = index < array.length - 1 && (
                          array[index + 1].match(/^\s*[\-\*]\s/) || 
                          array[index + 1].match(/^\s*\d+\.\s/)
                        );
                        
                        if (!nextLineIsListItem) {
                          return `<li>${listItemContent}</li></ol>`;
                        } else {
                          return `<li>${listItemContent}</li>`;
                        }
                      }
                    }
                    
                    // Handle blockquotes
                    if (line.startsWith('> ')) {
                      return `<blockquote>${processedLine.substring(2)}</blockquote>`;
                    }
                    
                    // Handle horizontal rule
                    if (line.match(/^(\*{3,}|-{3,}|_{3,})$/)) {
                      return '<hr />';
                    }
                    
                    // Return paragraph if not empty
                    return line.trim() ? `<p>${processedLine}</p>` : '';
                  })
                  .filter(Boolean) // Remove empty lines
                  .join('')
              }} />
            </div>
          </Card>
        )}
      </div>
    </div>
  );
} 