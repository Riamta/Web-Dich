'use client'

import { useState, useEffect, useRef } from 'react'
import { useTabState } from '@/hooks/useTabState'
import { aiService } from '@/lib/ai-service'
import { TRANSLATION_TONES } from '@/lib/ai-service'
import { dictionaryService } from '@/lib/dictionary-service'
import { 
  ArrowsRightLeftIcon, 
  ClipboardDocumentIcon, 
  ArrowDownTrayIcon,
  SpeakerWaveIcon,
  DocumentArrowUpIcon,
  ChevronDownIcon,
  SparklesIcon,
  StopIcon,
  PhotoIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline'
import { MdTextFields, MdContentPaste } from 'react-icons/md'
import ReactMarkdown from 'react-markdown'
import { SUPPORTED_LANGUAGES } from '@/constants/languages'
import JSZip from 'jszip'
import { useDebounce } from '@/hooks/useDebounce'

export default function Translator() {
  const [mounted, setMounted] = useState(false)
  const [sourceText, setSourceText] = useState('')
  const [translatedText, setTranslatedText] = useState('')
  const [sourceLanguage, setSourceLanguage] = useTabState('sourceLanguage', 'auto')
  const [targetLanguage, setTargetLanguage] = useTabState('targetLanguage', 'vi')
  const [translationTone, setTranslationTone] = useTabState('translationTone', 'normal')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [useMarkdown, setUseMarkdown] = useState(false)
  const [copySuccess, setCopySuccess] = useState(false)
  const [contentHeight, setContentHeight] = useState<number>(500)
  const sourceTextRef = useRef<HTMLTextAreaElement>(null)
  const translatedTextRef = useRef<HTMLDivElement>(null)
  const [isSourcePlaying, setIsSourcePlaying] = useState(false)
  const [isTranslationPlaying, setIsTranslationPlaying] = useState(false)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [activeTab, setActiveTab] = useState<'text' | 'image' | 'file'>('text')
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileContent, setFileContent] = useState<string>('')
  const [fileName, setFileName] = useState<string>('')
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [translatedFiles, setTranslatedFiles] = useState<{name: string, content: string}[]>([])
  const debouncedSourceText = useDebounce(sourceText, 500); // 0.25 second delay
  const [isPasteEnabled, setIsPasteEnabled] = useState(false);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  // Add effect for auto-translation when image is pasted
  useEffect(() => {
    if (activeTab === 'image' && selectedImage) {
      handleImageTranslation();
    }
  }, [selectedImage, activeTab]);

  // Supported file types
  const SUPPORTED_FILE_TYPES = {
    'text/plain': '.txt',
    'application/msword': '.doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
    'application/pdf': '.pdf',
    'text/markdown': '.md',
    'text/csv': '.csv',
    'application/json': '.json',
    'text/html': '.html',
    'application/xml': '.xml',
    'text/xml': '.xml',
    'application/rtf': '.rtf'
  };

  const isFileTypeSupported = (file: File) => {
    return Object.keys(SUPPORTED_FILE_TYPES).includes(file.type);
  };

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const updateHeight = () => {
      if (sourceTextRef.current && translatedTextRef.current) {
        const sourceHeight = sourceTextRef.current.scrollHeight
        const translatedHeight = translatedTextRef.current.scrollHeight
        const maxHeight = Math.max(sourceHeight, translatedHeight, 500) // Minimum 500px
        setContentHeight(maxHeight)
      }
    }

    // Update height whenever content changes
    updateHeight()

    // Add resize observer to handle dynamic content changes
    const resizeObserver = new ResizeObserver(updateHeight)
    if (sourceTextRef.current) resizeObserver.observe(sourceTextRef.current)
    if (translatedTextRef.current) resizeObserver.observe(translatedTextRef.current)

    return () => resizeObserver.disconnect()
  }, [sourceText, translatedText])

  // Add effect for auto-translation
  useEffect(() => {
    if (debouncedSourceText.trim() && activeTab === 'text') {
      handleTranslation();
    }
  }, [debouncedSourceText, activeTab]);

  // Add effect to handle paste events globally
  useEffect(() => {
    const handleGlobalPaste = async (e: ClipboardEvent) => {
      if (activeTab !== 'image' || !isPasteEnabled) return;

      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          e.preventDefault(); // Prevent default paste behavior
          const file = items[i].getAsFile();
          if (file) {
            // Validate file size (max 10MB)
            if (file.size > 10 * 1024 * 1024) {
              setError('Image size should be less than 10MB');
              return;
            }
            setSelectedImage(file);
            setImagePreview(URL.createObjectURL(file));
            setError(null);
            return;
          }
        }
      }
    };

    window.addEventListener('paste', handleGlobalPaste);
    return () => window.removeEventListener('paste', handleGlobalPaste);
  }, [activeTab, isPasteEnabled]);

  const handleTranslation = async () => {
    if (activeTab === 'file' && uploadedFiles.length === 0) return;
    if (activeTab === 'text' && !sourceText.trim()) return;
    if (activeTab === 'image' && !selectedImage) return;

    // Don't show loading state for auto-translation
    if (debouncedSourceText === sourceText) {
      setIsLoading(true);
    }
    setError(null);

    try {
      if (activeTab === 'file') {
        const translatedContents = await Promise.all(
          uploadedFiles.map(async (file) => {
            let content = '';
            if (file.type === 'text/plain' || file.type === 'text/markdown' || file.type === 'application/json') {
              const text = await file.text();
              content = await aiService.translate(text, targetLanguage, true, translationTone);
            } else {
              // Handle other file types in the future
              content = 'File type not supported for translation yet';
            }
            return {
              name: `translated_${file.name}`,
              content
            };
          })
        );
        setTranslatedFiles(translatedContents);
      } else if (activeTab === 'image') {
        // Existing image translation code
        // ... existing image translation code ...
      } else {
        const result = await aiService.translate(sourceText, targetLanguage, true, translationTone);
        const processedText = dictionaryService.applyDictionary(result);
        setTranslatedText(processedText);
      }
    } catch (error) {
      console.error('Translation error:', error);
      setError(error instanceof Error ? error.message : 'Có lỗi xảy ra khi dịch văn bản');
    } finally {
      if (debouncedSourceText === sourceText) {
        setIsLoading(false);
      }
    }
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (err) {
      console.error('Failed to copy text:', err)
    }
  }

  const handleTextPaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setSourceText(text);
    } catch (err) {
      console.error('Failed to paste text:', err);
    }
  };

  const handleImagePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          // Validate file size (max 10MB)
          if (file.size > 10 * 1024 * 1024) {
            setError('Image size should be less than 10MB');
            return;
          }
          setSelectedImage(file);
          setImagePreview(URL.createObjectURL(file));
          setError(null);
          return;
        }
      }
    }
  };

  const handleDownload = (text: string) => {
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'translated.txt'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const unsupportedFiles = files.filter(file => !isFileTypeSupported(file));
    if (unsupportedFiles.length > 0) {
      setError(`Unsupported file type(s). Supported formats: ${Object.values(SUPPORTED_FILE_TYPES).join(', ')}`);
      return;
    }

    setUploadedFiles(prev => [...prev, ...files]);
    setError(null);
  };

  const handleSpeech = (text: string, lang: string, isSource: boolean) => {
    const setPlaying = isSource ? setIsSourcePlaying : setIsTranslationPlaying
    const isPlaying = isSource ? isSourcePlaying : isTranslationPlaying

    if (isPlaying) {
      window.speechSynthesis.cancel()
      setPlaying(false)
    } else {
      const utterance = new SpeechSynthesisUtterance(text)
      
      // Xử lý ngôn ngữ nguồn
      if (lang === 'auto') {
        // Thử detect ngôn ngữ từ text hoặc fallback về en-US
        try {
          // Sử dụng 2 ký tự đầu tiên của đoạn text để detect ngôn ngữ
          const detectedLang = text.trim().length >= 2 ? 
            (text.charCodeAt(0) > 127 || text.charCodeAt(1) > 127 ? 'vi-VN' : 'en-US') 
            : 'en-US';
          utterance.lang = detectedLang;
        } catch (e) {
          utterance.lang = 'en-US';
        }
      } else {
        // Thêm region code cho một số ngôn ngữ phổ biến
        const langMap: { [key: string]: string } = {
          'en': 'en-US',
          'vi': 'vi-VN',
          'ja': 'ja-JP',
          'ko': 'ko-KR',
          'zh': 'zh-CN',
          // Thêm các ngôn ngữ khác nếu cần
        };
        utterance.lang = langMap[lang] || lang;
      }

      utterance.onend = () => setPlaying(false)
      window.speechSynthesis.speak(utterance)
      setPlaying(true)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Image size should be less than 10MB');
      return;
    }

    setSelectedImage(file);
    setImagePreview(URL.createObjectURL(file));
    setError(null);
  };

  const handleImageTranslation = async () => {
    if (!selectedImage) return;

    setIsLoading(true);
    setError(null);

    try {
      // Convert image to base64
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(selectedImage);
      });

      // Remove data URL prefix
      const base64Content = base64Data.split(',')[1];

      const result = await aiService.translateImage(
        base64Content,
        selectedImage.type,
        {
          targetLanguage,
          preserveContext: true,
          tone: translationTone
        }
      );

      setTranslatedText(result);
    } catch (error) {
      console.error('Image translation error:', error);
      setError(error instanceof Error ? error.message : 'Failed to translate image');
    } finally {
      setIsLoading(false);
    }
  };

  // Update tab switching handler
  const handleTabSwitch = (tab: 'text' | 'image' | 'file') => {
    setActiveTab(tab);
    // Enable paste for image tab
    setIsPasteEnabled(tab === 'image');
    
    // Clear data when switching tabs
    if (tab === 'text') {
      setSelectedImage(null);
      setImagePreview(null);
      setSelectedFile(null);
      setFileContent('');
      setFileName('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } else if (tab === 'image') {
      setSourceText('');
      setSelectedFile(null);
      setFileContent('');
      setFileName('');
    } else {
      setSourceText('');
      setSelectedImage(null);
      setImagePreview(null);
    }
  };

  // Update image container click handler
  const handleImageContainerClick = () => {
    if (activeTab === 'image' && !imagePreview) {
      fileInputRef.current?.click();
    }
  };

  const isTranslateButtonDisabled = () => {
    if (isLoading) return true;
    
    switch (activeTab) {
      case 'text':
        return !sourceText.trim();
      case 'image':
        return !selectedImage;
      case 'file':
        return uploadedFiles.length === 0;
      default:
        return true;
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Only set dragging if we're dragging files
    if (e.dataTransfer.types.includes('Files')) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Only unset dragging if we're leaving the drop zone
    // and not entering a child element
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    if (
      x <= rect.left ||
      x >= rect.right ||
      y <= rect.top ||
      y >= rect.bottom
    ) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    setError(null);

    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    if (activeTab === 'image') {
      const file = files[0];
      // Handle image file drop
      if (!file.type.startsWith('image/')) {
        setError('Please drop an image file');
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('Image size should be less than 10MB');
        return;
      }

      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
    } else if (activeTab === 'file') {
      // Filter out unsupported files
      const supportedFiles = files.filter(file => isFileTypeSupported(file));
      const unsupportedFiles = files.filter(file => !isFileTypeSupported(file));

      if (unsupportedFiles.length > 0) {
        setError(`Some files are not supported. Supported formats: ${Object.values(SUPPORTED_FILE_TYPES).join(', ')}`);
      }

      if (supportedFiles.length > 0) {
        setUploadedFiles(prev => [...prev, ...supportedFiles]);
      }
    } else {
      // Handle text file drop for text tab
      const file = files[0];
      if (!file.type.startsWith('text/')) {
        setError('Please drop a text file');
        return;
      }

      try {
        const text = await file.text();
        setSourceText(text);
      } catch (error) {
        console.error('Error reading file:', error);
        setError('Error reading file. Please try again.');
      }
    }
  };

  const handleDownloadTranslated = (fileName: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadAll = () => {
    if (translatedFiles.length === 0) return;

    // Create a zip file if multiple files
    if (translatedFiles.length > 1) {
      const zip = new JSZip();
      translatedFiles.forEach(file => {
        zip.file(file.name, file.content);
      });
      zip.generateAsync({type: "blob"}).then(content => {
        const url = URL.createObjectURL(content);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'translated_files.zip';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      });
    } else {
      // Download single file directly
      handleDownloadTranslated(translatedFiles[0].name, translatedFiles[0].content);
    }
  };

  const handleTextAreaResize = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target;
    const text = e.target.value;
    setSourceText(text);

    if (!text.trim()) {
      // Reset height when no text
      textarea.style.height = '';
      setContentHeight(500); // Reset to default height
      return;
    }

    textarea.style.height = 'auto'; // Reset height
    textarea.style.height = `${textarea.scrollHeight}px`; // Set new height
  };

  // Don't render content until mounted (client-side)
  if (!mounted) {
    return null
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-0">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => handleTabSwitch('text')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'text'
                ? 'text-primary border-b-2 border-primary'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <DocumentTextIcon className="h-5 w-5" />
            Text Translation
          </button>
          <button
            onClick={() => handleTabSwitch('image')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'image'
                ? 'text-primary border-b-2 border-primary'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <PhotoIcon className="h-5 w-5" />
            Image Translation
          </button>
          <button
            onClick={() => handleTabSwitch('file')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'file'
                ? 'text-primary border-b-2 border-primary'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <DocumentArrowUpIcon className="h-5 w-5" />
            File Translation
          </button>
        </div>

        {/* Language Selection Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 p-4 border-b border-gray-200 bg-gray-50/50">
          <div className="flex flex-1 items-center gap-2 sm:gap-4">
            <div className="relative group flex-1 sm:flex-none">
              <select
                value={sourceLanguage}
                onChange={(e) => setSourceLanguage(e.target.value)}
                className="w-full sm:w-auto appearance-none pl-3 sm:pl-4 pr-8 sm:pr-10 py-2 sm:py-2.5 rounded-xl bg-white border border-gray-200 hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm sm:text-base font-medium min-w-0 sm:min-w-[160px] cursor-pointer"
              >
                <option value="auto">Detect Language</option>
                {SUPPORTED_LANGUAGES.filter(lang => lang.code !== 'auto').map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>

            <button 
              className="p-2 sm:p-2.5 hover:bg-gray-100 rounded-xl transition-colors border border-transparent hover:border-gray-200 shrink-0"
              onClick={() => {
                const temp = sourceLanguage
                setSourceLanguage(targetLanguage)
                setTargetLanguage(temp)
                const tempText = sourceText
                setSourceText(translatedText)
                setTranslatedText(tempText)
              }}
            >
              <ArrowsRightLeftIcon className="h-4 sm:h-5 w-4 sm:w-5 text-gray-600" />
            </button>

            <div className="relative group flex-1 sm:flex-none">
              <select
                value={targetLanguage}
                onChange={(e) => setTargetLanguage(e.target.value)}
                className="w-full sm:w-auto appearance-none pl-3 sm:pl-4 pr-8 sm:pr-10 py-2 sm:py-2.5 rounded-xl bg-white border border-gray-200 hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm sm:text-base font-medium min-w-0 sm:min-w-[160px] cursor-pointer"
              >
                {SUPPORTED_LANGUAGES.filter(lang => lang.code !== 'auto').map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative group flex-1 sm:flex-none">
              <select
                value={translationTone}
                onChange={(e) => setTranslationTone(e.target.value)}
                className="w-full sm:w-auto appearance-none pl-3 sm:pl-4 pr-8 sm:pr-10 py-2 sm:py-2.5 rounded-xl bg-white border border-gray-200 hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm sm:text-base font-medium min-w-0 sm:min-w-[160px] cursor-pointer"
              >
                {Object.entries(TRANSLATION_TONES).map(([key, tone]) => (
                  <option key={key} value={key} title={tone.description}>
                    {tone.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={activeTab === 'image' ? handleImageTranslation : handleTranslation}
              disabled={isTranslateButtonDisabled()}
              className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl text-white text-sm sm:text-base font-medium transition-all ${
                isTranslateButtonDisabled()
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-primary hover:bg-primary/90 shadow-sm hover:shadow-md'
              }`}
            >
              {isLoading ? 'Translating...' : 'Translate'}
            </button>

            <button
              onClick={() => setUseMarkdown(!useMarkdown)}
              className={`hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                useMarkdown 
                  ? 'bg-primary/10 text-primary border border-primary/20' 
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
              title="Toggle Markdown rendering"
            >
              <MdTextFields className="h-4 w-4" />
              Markdown
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-200">
          {/* Source Panel */}
          <div className="relative">
            {/* Source Panel Toolbar */}
            <div className="flex items-center justify-between px-3 sm:px-4 py-2 border-b border-gray-200 bg-gray-50/80">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-500">
                  {activeTab === 'text' ? 'Source Text' : activeTab === 'image' ? 'Source Image' : 'Source File'}
                </span>
                {activeTab === 'text' && (
                  <button
                    onClick={() => setUseMarkdown(!useMarkdown)}
                    className={`sm:hidden flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all ${
                      useMarkdown 
                        ? 'bg-primary/10 text-primary border border-primary/20' 
                        : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                    }`}
                    title="Toggle Markdown rendering"
                  >
                    <MdTextFields className="h-3 w-3" />
                    MD
                  </button>
                )}
              </div>
              <div className="flex items-center gap-1">
                {activeTab === 'file' ? (
                  <>
                    <label 
                      htmlFor="document-upload"
                      className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors flex items-center gap-1"
                      title="Upload document"
                    >
                      <DocumentArrowUpIcon className="h-3.5 sm:h-4 w-3.5 sm:w-4" />
                      <span className="text-xs sm:text-sm">Upload</span>
                    </label>
                    <input
                      type="file"
                      onChange={handleFileUpload}
                      accept={Object.values(SUPPORTED_FILE_TYPES).join(',')}
                      className="hidden"
                      id="document-upload"
                      ref={fileInputRef}
                    />
                  </>
                ) : activeTab === 'text' ? (
                  <>
                    <button 
                      className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1"
                      onClick={handleTextPaste}
                      title="Paste from clipboard"
                    >
                      <MdContentPaste className="h-3.5 sm:h-4 w-3.5 sm:w-4" />
                      <span className="text-xs sm:text-sm">Paste</span>
                    </button>
                    <button 
                      className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1"
                      onClick={() => handleCopy(sourceText)}
                      title="Copy to clipboard"
                    >
                      <ClipboardDocumentIcon className="h-3.5 sm:h-4 w-3.5 sm:w-4" />
                      <span className="text-xs sm:text-sm">Copy</span>
                    </button>
                    <input
                      type="file"
                      onChange={handleFileUpload}
                      accept=".txt,.docx"
                      className="hidden"
                      id="file-upload"
                    />
                  </>
                ) : (
                  <>
                    <label 
                      htmlFor="image-upload"
                      className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors flex items-center gap-1"
                      title="Upload image"
                    >
                      <DocumentArrowUpIcon className="h-3.5 sm:h-4 w-3.5 sm:w-4" />
                      <span className="text-xs sm:text-sm">Upload</span>
                    </label>
                    <input
                      type="file"
                      onChange={handleImageUpload}
                      accept="image/*"
                      className="hidden"
                      id="image-upload"
                      ref={fileInputRef}
                    />
                  </>
                )}
                <button 
                  className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1"
                  onClick={() => handleSpeech(activeTab === 'text' ? sourceText : '', sourceLanguage, true)}
                  title={isSourcePlaying ? "Stop" : "Listen to source text"}
                >
                  {isSourcePlaying ? (
                    <>
                      <StopIcon className="h-3.5 sm:h-4 w-3.5 sm:w-4" />
                      <span className="text-xs sm:text-sm">Stop</span>
                    </>
                  ) : (
                    <>
                      <SpeakerWaveIcon className="h-3.5 sm:h-4 w-3.5 sm:w-4" />
                      <span className="text-xs sm:text-sm">Listen</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Source Content */}
            {activeTab === 'file' ? (
              <div className="p-4 sm:p-6">
                {uploadedFiles.length > 0 ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-gray-900">
                        Uploaded Files ({uploadedFiles.length})
                      </h3>
                      <button
                        onClick={() => {
                          setUploadedFiles([]);
                          setTranslatedFiles([]);
                          if (fileInputRef.current) {
                            fileInputRef.current.value = '';
                          }
                        }}
                        className="text-xs text-gray-500 hover:text-gray-700"
                      >
                        Clear all
                      </button>
                    </div>
                    <div className="space-y-2">
                      {uploadedFiles.map((file, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <DocumentTextIcon className="h-5 w-5 text-gray-400" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                            <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                          </div>
                          <button
                            onClick={() => {
                              setUploadedFiles(files => files.filter((_, i) => i !== index));
                              setTranslatedFiles(files => files.filter((_, i) => i !== index));
                            }}
                            className="p-1 hover:bg-gray-200 rounded-full"
                          >
                            <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div 
                    className={`flex flex-col items-center justify-center h-full text-gray-400 gap-3 cursor-pointer hover:bg-gray-50/50 transition-colors ${isDragging ? 'bg-gray-100/80 border-2 border-dashed border-primary/50' : ''}`}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="w-12 sm:w-16 h-12 sm:h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
                      <DocumentArrowUpIcon className="h-6 sm:h-8 w-6 sm:w-8 text-gray-300" />
                    </div>
                    <span className="text-sm sm:text-base font-medium text-center">
                      {isDragging ? 'Drop files here' : 'Upload documents or drag and drop'}
                    </span>
                    <span className="text-xs sm:text-sm text-gray-400 text-center">
                      Supported formats: {Object.values(SUPPORTED_FILE_TYPES).join(', ')}
                    </span>
                  </div>
                )}
              </div>
            ) : activeTab === 'image' ? (
              <div 
                ref={imageContainerRef}
                className={`relative h-full cursor-pointer transition-colors ${
                  isDragging 
                    ? 'bg-gray-100/80 border-2 border-dashed border-primary/50' 
                    : imagePreview ? '' : 'hover:bg-gray-50/50'
                }`}
                onClick={handleImageContainerClick}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                {imagePreview ? (
                  <div className="relative h-full">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="max-h-full w-auto mx-auto"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedImage(null);
                        setImagePreview(null);
                        if (fileInputRef.current) {
                          fileInputRef.current.value = '';
                        }
                      }}
                      className="absolute top-2 right-2 p-1.5 bg-white/90 hover:bg-white rounded-full shadow-sm transition-colors"
                    >
                      <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
                    <div className="w-12 sm:w-16 h-12 sm:h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
                      <PhotoIcon className="h-6 sm:h-8 w-6 sm:w-8 text-gray-300" />
                    </div>
                    <span className="text-sm sm:text-base font-medium text-center">
                      {isDragging ? 'Drop image here' : 'Click to upload or paste image (Ctrl+V)'}
                    </span>
                    <span className="text-xs sm:text-sm text-gray-400 text-center">
                      Supported formats: JPG, PNG, GIF (max 10MB)
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className={`relative h-full ${isDragging ? 'bg-gray-100/80 border-2 border-dashed border-primary/50' : ''}`}>
                <textarea
                  ref={sourceTextRef}
                  value={sourceText}
                  onChange={handleTextAreaResize}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                      handleTranslation();
                    }
                  }}
                  style={{ overflow: 'hidden' }}
                  className="w-full p-4 sm:p-6 resize-none focus:outline-none text-base min-h-[300px] sm:min-h-[500px] bg-transparent"
                  placeholder={isDragging ? 'Drop text file here' : 'Enter text to translate...'}
                />
              </div>
            )}
          </div>

          {/* Translated Text Panel */}
          <div className="relative">
            {/* Translated Panel Toolbar */}
            <div className="flex items-center justify-between px-3 sm:px-4 py-2 border-b border-gray-200 bg-gray-50/80">
              <div className="text-sm font-medium text-gray-500">Translation</div>
              <div className="flex items-center gap-1">
                {activeTab === 'file' ? (
                  translatedFiles.length > 0 && (
                    <button
                      onClick={handleDownloadAll}
                      className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1"
                      title="Download translated files"
                    >
                      <ArrowDownTrayIcon className="h-3.5 sm:h-4 w-3.5 sm:w-4" />
                      <span className="text-xs sm:text-sm">Download {translatedFiles.length > 1 ? 'All' : ''}</span>
                    </button>
                  )
                ) : (
                  <>
                    <button 
                      className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1"
                      onClick={() => handleCopy(translatedText)}
                      title="Copy to clipboard"
                    >
                      <ClipboardDocumentIcon className="h-3.5 sm:h-4 w-3.5 sm:w-4" />
                      <span className="text-xs sm:text-sm">Copy</span>
                    </button>
                    <button
                      className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1"
                      onClick={() => handleDownload(translatedText)}
                      title="Download as text file"
                    >
                      <ArrowDownTrayIcon className="h-3.5 sm:h-4 w-3.5 sm:w-4" />
                      <span className="text-xs sm:text-sm">Save</span>
                    </button>
                    <button 
                      className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1"
                      onClick={() => handleSpeech(translatedText, targetLanguage, false)}
                      title={isTranslationPlaying ? "Stop" : "Listen to translation"}
                    >
                      {isTranslationPlaying ? (
                        <>
                          <StopIcon className="h-3.5 sm:h-4 w-3.5 sm:w-4" />
                          <span className="text-xs sm:text-sm">Stop</span>
                        </>
                      ) : (
                        <>
                          <SpeakerWaveIcon className="h-3.5 sm:h-4 w-3.5 sm:w-4" />
                          <span className="text-xs sm:text-sm">Listen</span>
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>
            <div 
              ref={translatedTextRef}
              style={{ height: `${contentHeight}px` }}
              className="p-4 sm:p-6 overflow-y-auto min-h-[300px] sm:min-h-[500px]"
            >
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                      <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-5 sm:w-6 h-5 sm:h-6 rounded-full border-4 border-primary/30 border-t-transparent animate-spin" />
                      </div>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <p className="text-sm sm:text-base text-gray-700 font-medium">
                        {activeTab === 'image' ? 'Translating image...' : 'Translating text...'}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-500">
                        {activeTab === 'image' 
                          ? 'AI is analyzing and translating text in the image' 
                          : 'AI is processing your text translation'}
                      </p>
                    </div>
                  </div>
                </div>
              ) : activeTab === 'file' ? (
                translatedFiles.length > 0 ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-gray-900">
                        Translated Files ({translatedFiles.length})
                      </h3>
                    </div>
                    <div className="space-y-2">
                      {translatedFiles.map((file, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <DocumentTextIcon className="h-5 w-5 text-gray-400" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                          </div>
                          <button
                            onClick={() => handleDownloadTranslated(file.name, file.content)}
                            className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                            title="Download translated file"
                          >
                            <ArrowDownTrayIcon className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
                    <div className="w-12 sm:w-16 h-12 sm:h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
                      <DocumentTextIcon className="h-6 sm:h-8 w-6 sm:w-8 text-gray-300" />
                    </div>
                    <span className="text-sm sm:text-base font-medium text-center">
                      No translated files yet
                    </span>
                    <span className="text-xs sm:text-sm text-gray-400 text-center">
                      Upload files and click Translate to begin
                    </span>
                  </div>
                )
              ) : translatedText ? (
                <div className="prose max-w-none text-gray-800 text-base">
                  {useMarkdown ? (
                    <ReactMarkdown>{translatedText}</ReactMarkdown>
                  ) : (
                    <div className="whitespace-pre-wrap">{translatedText}</div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
                  <div className="w-12 sm:w-16 h-12 sm:h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
                    {activeTab === 'image' ? (
                      <PhotoIcon className="h-6 sm:h-8 w-6 sm:w-8 text-gray-300" />
                    ) : (
                      <svg className="h-6 sm:h-8 w-6 sm:w-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                      </svg>
                    )}
                  </div>
                  <span className="text-sm sm:text-base font-medium text-center">
                    {activeTab === 'image' 
                      ? 'Upload an image or paste from clipboard' 
                      : 'Enter text to translate'}
                  </span>
                  <span className="text-xs sm:text-sm text-gray-400 text-center">
                    {activeTab === 'image'
                      ? 'Supported formats: JPG, PNG, GIF (max 10MB)'
                      : 'Type or paste your text and click Translate to begin'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-4 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 flex items-center gap-3">
          <svg className="h-4 sm:h-5 w-4 sm:w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm sm:text-base font-medium">{error}</span>
        </div>
      )}
    </div>
  )
} 