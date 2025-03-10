'use client';

import { useState, useEffect, useRef } from 'react';
import { DocumentArrowUpIcon, LanguageIcon } from '@heroicons/react/24/outline';
import { MdBook, MdContentCopy, MdDownload, MdEdit, MdOutlineMenuBook, MdTranslate } from 'react-icons/md';
import Dictionary from '@/components/Dictionary';
import { dictionaryService } from '@/lib/dictionary-service';

interface ComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  originalText: string;
  translatedText: string;
  onSave: (editedText: string) => void;
}

interface SRTEntry {
  id: string;
  timecode: string;
  text: string;
}

const ComparisonModal = ({ isOpen, onClose, originalText, translatedText, onSave }: ComparisonModalProps) => {
  const [editedText, setEditedText] = useState('');
  const [entries, setEntries] = useState<Array<SRTEntry>>([]);
  const [translatedEntries, setTranslatedEntries] = useState<Array<SRTEntry>>([]);
  const [isDictionaryOpen, setIsDictionaryOpen] = useState(false);

  // Parse SRT content into entries when modal is opened
  useEffect(() => {
    if (isOpen) {
      setEditedText(translatedText);
      
      // Parse SRT content
      const parseSRT = (content: string) => {
        const entries: SRTEntry[] = [];
        const blocks = content.trim().split(/\n\s*\n/); // Split by empty lines, handling multiple newlines
        
        blocks.forEach(block => {
          const lines = block.trim().split('\n');
          if (lines.length >= 2) { // Ensure we have at least ID and timecode
            const id = lines[0].trim();
            const timecode = lines[1].trim();
            const text = lines.slice(2).join('\n').trim(); // Join remaining lines preserving line breaks
            
            if (id && timecode) { // Only add if we have valid id and timecode
              entries.push({ id, timecode, text });
            }
          }
        });
        
        return entries;
      };

      const originalEntries = parseSRT(originalText);
      const translatedEntries = parseSRT(translatedText);
      
      // Ensure translated entries array matches original length
      while (translatedEntries.length < originalEntries.length) {
        const index = translatedEntries.length;
        translatedEntries.push({
          id: originalEntries[index].id,
          timecode: originalEntries[index].timecode,
          text: ''
        });
      }

      setEntries(originalEntries);
      setTranslatedEntries(translatedEntries);
    }
  }, [isOpen, originalText, translatedText]);

  if (!isOpen) return null;

  const handleTranslationChange = (index: number, value: string) => {
    const newEntries = [...translatedEntries];
    newEntries[index] = { 
      ...newEntries[index],
      text: value
    };
    setTranslatedEntries(newEntries);

    // Reconstruct the full SRT text
    const newText = newEntries.map(entry => 
      `${entry.id}\n${entry.timecode}\n${entry.text}`
    ).join('\n\n');
    setEditedText(newText);
  };

  const handleSave = () => {
    onSave(editedText);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-[95vw] max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">So sánh và chỉnh sửa bản dịch</h2>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsDictionaryOpen(true)}
              className="flex items-center gap-2 text-gray-500 hover:text-primary transition-colors duration-200"
            >
              <MdTranslate className="h-5 w-5" />
              <span>Từ điển</span>
            </button>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-auto">
          <table className="w-full border-collapse">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="p-3 text-left text-sm font-medium text-gray-700 w-[60px]">ID</th>
                <th className="p-3 text-left text-sm font-medium text-gray-700 w-[30%]">Văn bản gốc</th>
                <th className="p-3 text-left text-sm font-medium text-gray-700 w-[70%]">Bản dịch</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {entries.map((entry, index) => {
                const translatedEntry = translatedEntries[index] || { text: '' };
                return (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="p-3 text-sm text-gray-500 font-mono align-top">{entry.id}</td>
                    <td className="p-3 text-sm text-gray-900 font-mono align-top">
                      <div className="bg-gray-50 p-2 rounded whitespace-pre-wrap">{entry.text}</div>
                    </td>
                    <td className="p-3 align-top">
                      <textarea
                        value={translatedEntry.text}
                        onChange={(e) => handleTranslationChange(index, e.target.value)}
                        className="w-full p-2 text-sm font-mono border border-gray-200 rounded focus:ring-2 focus:ring-primary/20 focus:border-primary min-h-[60px] resize-none"
                        placeholder="Nhập bản dịch..."
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end gap-3 mt-4 pt-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors"
          >
            Lưu thay đổi
          </button>
        </div>
      </div>
      <Dictionary
        isOpen={isDictionaryOpen}
        onClose={() => setIsDictionaryOpen(false)}
      />
    </div>
  );
};

const SUPPORTED_LANGUAGES = [
  { code: 'vi', name: 'Tiếng Việt' },
  { code: 'en', name: 'Tiếng Anh' },
  { code: 'zh', name: 'Tiếng Trung' },
  { code: 'ja', name: 'Tiếng Nhật' },
  { code: 'ko', name: 'Tiếng Hàn' },
];

export default function SRTTranslation() {
  const [srtContent, setSrtContent] = useState('');
  const [targetLanguage, setTargetLanguage] = useState('vi');
  const [translation, setTranslation] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDictionaryOpen, setIsDictionaryOpen] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.srt')) {
      setError('Please upload a .srt file');
      return;
    }

    try {
      const text = await file.text();
      setSrtContent(text);
      setFileName(file.name);
      setError(null);
    } catch (error) {
      console.error('Error reading file:', error);
      setError('Error reading SRT file');
    }
  };

  const handleTranslate = async () => {
    if (!srtContent.trim()) return;

    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/translate-srt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: srtContent,
          targetLanguage,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to translate SRT');
      }

      const data = await response.json();
      // Apply dictionary replacements to the translation
      const processedTranslation = dictionaryService.applyDictionary(data.translation);
      setTranslation(processedTranslation);
    } catch (error) {
      console.error('Translation error:', error);
      setError(error instanceof Error ? error.message : 'Có lỗi xảy ra khi dịch phụ đề');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (!translation) return;

    const blob = new Blob([translation], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const newFileName = fileName.replace('.srt', `_${targetLanguage}.srt`);
    a.download = newFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      const notification = document.createElement('div');
      notification.className = 'fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
      notification.textContent = 'Đã sao chép vào clipboard!';
      document.body.appendChild(notification);
      setTimeout(() => {
        notification.remove();
      }, 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
      alert('Failed to copy text to clipboard');
    }
  };

  const handleSaveEdit = (editedText: string) => {
    // Apply dictionary replacements to the edited text
    const processedText = dictionaryService.applyDictionary(editedText);
    setTranslation(processedText);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="space-y-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
              <DocumentArrowUpIcon className="h-5 w-5 text-gray-400" />
              Upload SRT File
            </label>
            <button
              onClick={() => setIsDictionaryOpen(true)}
              className="flex items-center gap-2 text-gray-500 hover:text-primary transition-colors duration-200"
            >
              <MdBook className="h-5 w-5" />
              <span>Từ điển</span>
            </button>
          </div>

          <input
            type="file"
            onChange={handleFileUpload}
            accept=".srt"
            className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
          />

          <textarea
            value={srtContent}
            onChange={(e) => setSrtContent(e.target.value)}
            placeholder="Or paste SRT content here..."
            className="w-full h-[400px] p-4 font-mono text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 resize-none bg-gray-50/50"
          />

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
              <LanguageIcon className="h-5 w-5 text-gray-400" />
              Target Language
            </label>
            <select
              value={targetLanguage}
              onChange={(e) => setTargetLanguage(e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 appearance-none bg-gray-50/50"
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleTranslate}
            disabled={isLoading || !srtContent.trim()}
            className={`w-full py-3 px-4 rounded-lg text-white font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
              isLoading || !srtContent.trim()
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-primary hover:bg-primary/90 shadow-sm hover:shadow-md'
            }`}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Đang xử lý...
              </span>
            ) : (
              'Dịch phụ đề'
            )}
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
            <DocumentArrowUpIcon className="h-5 w-5 text-gray-400" />
            Kết quả dịch
          </label>
          {translation && (
            <div className="flex items-center gap-3">
              <button
                onClick={() => copyToClipboard(translation)}
                className="flex items-center gap-2 text-gray-500 hover:text-primary transition-colors duration-200"
              >
                <MdContentCopy className="h-5 w-5" />
                <span>Sao chép</span>
              </button>
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 text-gray-500 hover:text-primary transition-colors duration-200"
              >
                <MdEdit className="h-5 w-5" />
                <span>Chỉnh sửa</span>
              </button>
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 text-primary hover:text-primary/90 transition-colors duration-200"
              >
                <MdDownload className="h-5 w-5" />
                <span>Tải xuống</span>
              </button>
            </div>
          )}
        </div>

        <div className="min-h-[400px] bg-gray-50/50 rounded-lg p-4">
          {error ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
              {error}
            </div>
          ) : translation ? (
            <pre className="whitespace-pre-wrap font-mono text-sm text-gray-800">
              {translation}
            </pre>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-4">
              <div className="w-16 h-16 mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <DocumentArrowUpIcon className="w-8 h-8 text-primary" />
              </div>
              <p className="text-gray-500 mb-1">Chưa có kết quả dịch</p>
              <p className="text-sm text-gray-400">
                Tải lên file SRT hoặc dán nội dung và nhấn nút "Dịch phụ đề" để bắt đầu
              </p>
            </div>
          )}
        </div>
      </div>

      <ComparisonModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        originalText={srtContent}
        translatedText={translation}
        onSave={handleSaveEdit}
      />

      <Dictionary
        isOpen={isDictionaryOpen}
        onClose={() => setIsDictionaryOpen(false)}
      />
    </div>
  );
} 