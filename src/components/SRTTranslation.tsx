'use client';

import { useState, useEffect, useRef } from 'react';
import { DocumentArrowUpIcon, LanguageIcon } from '@heroicons/react/24/outline';
import { MdBook, MdContentCopy, MdDownload, MdEdit, MdOutlineMenuBook, MdTranslate } from 'react-icons/md';
import Dictionary from '@/components/Dictionary';
import { dictionaryService } from '@/lib/dictionary-service';
import { aiService } from '@/lib/ai-service';
import { useToast, ToastContainer } from '@/utils/toast';

interface ComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  originalText: string;
  translatedText: string;
  onSave: (editedText: string) => void;
}

interface SRTEntry {
  id: string;
  from: string;
  to: string;
  text: string;
  translation: string;
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
        const blocks = content.trim().split(/\n\s*\n/); // Split by empty lines
        
        blocks.forEach(block => {
          const lines = block.trim().split('\n');
          if (lines.length >= 2) {
            const id = lines[0].trim();
            const timecode = lines[1].trim();
            const text = lines.slice(2).join('\n').trim();
            
            if (id && timecode) {
              entries.push({ id, from: timecode.split(' --> ')[0], to: timecode.split(' --> ')[1], text, translation: '' });
            }
          }
        });
        
        return entries;
      };

      const originalEntries = parseSRT(originalText);
      const translatedEntries = parseSRT(translatedText);
      
      while (translatedEntries.length < originalEntries.length) {
        const index = translatedEntries.length;
        translatedEntries.push({
          id: originalEntries[index].id,
          from: originalEntries[index].from,
          to: originalEntries[index].to,
          text: '',
          translation: ''
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
      `${entry.id}\n${entry.from} --> ${entry.to}\n${entry.text}`
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
                <th className="p-3 text-left text-sm font-medium text-gray-700 w-16">No.</th>
                <th className="p-3 text-left text-sm font-medium text-gray-700 w-36">From</th>
                <th className="p-3 text-left text-sm font-medium text-gray-700 w-36">To</th>
                <th className="p-3 text-left text-sm font-medium text-gray-700">Original Text</th>
                <th className="p-3 text-left text-sm font-medium text-gray-700">Translated Text</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {entries.map((entry, index) => {
                const translatedEntry = translatedEntries[index] || { text: '' };
                return (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="p-3 text-sm text-gray-500 font-mono">{entry.id}</td>
                    <td className="p-3 text-sm text-gray-500 font-mono">{entry.from}</td>
                    <td className="p-3 text-sm text-gray-500 font-mono">{entry.to}</td>
                    <td className="p-3 text-sm text-gray-900 font-mono whitespace-pre-wrap">{entry.text}</td>
                    <td className="p-3 text-sm text-gray-900 font-mono whitespace-pre-wrap">{translatedEntry.text}</td>
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
  const [entries, setEntries] = useState<Array<SRTEntry>>([]);
  const [targetLanguage, setTargetLanguage] = useState('vi');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');
  const [isDictionaryOpen, setIsDictionaryOpen] = useState(false);
  const [batchSize, setBatchSize] = useState(50);
  const { loading, success, removeToast } = useToast();
  const [progressToastId, setProgressToastId] = useState<number | null>(null);

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

      // Parse SRT content
      const blocks = text.trim().split(/\n\s*\n/);
      const parsedEntries: Array<SRTEntry> = [];
      
      blocks.forEach((block, index) => {
        const lines = block.trim().split('\n');
        if (lines.length >= 3) {
          const id = lines[0].trim();
          const timecode = lines[1].trim();
          const [from, to] = timecode.split(' --> ').map(t => t.trim());
          const text = lines.slice(2).join('\n').trim();
          
          parsedEntries.push({
            id,
            from,
            to,
            text,
            translation: text // Copy original text to translation when importing
          });
        }
      });

      setEntries(parsedEntries);
      setError(null);
    } catch (error) {
      console.error('Error reading file:', error);
      setError('Error reading SRT file');
    }
  };

  const handleTranslate = async () => {
    if (!entries.length) return;

    setIsLoading(true);
    setError(null);

    try {
      const totalBatches = Math.ceil(entries.length / batchSize);
      const updatedEntries = [...entries];
      
      for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
        const start = batchIndex * batchSize;
        const end = Math.min(start + batchSize, entries.length);
        const batchEntries = entries.slice(start, end);
        
        const textsToTranslate = batchEntries.map(entry => entry.text);
        const batchText = textsToTranslate.join('\n');

        // Update progress
        const progress = Math.round(((batchIndex + 1) / totalBatches) * 100);
        if (progressToastId !== null) {
          removeToast(progressToastId);
          const newToastId = loading(`Đang xử lý... ${progress}%`);
          setProgressToastId(newToastId);
        }

        const prompt = `Dịch các câu sau sang ${targetLanguage}. Đây là phần ${batchIndex + 1}/${totalBatches}. 
Yêu cầu:
- Chỉ trả về các câu đã dịch
- Mỗi câu một dòng
- Không thêm số thứ tự
- Không thêm bất kỳ chú thích nào khác
- Không thêm dấu gạch đầu dòng
- Giữ nguyên format và ký tự đặc biệt
- Dịch theo ngữ cảnh tự nhiên

Nội dung cần dịch:
${batchText}`;

        const result = await aiService.processWithAI(prompt);
        
        // Split result into lines and apply dictionary
        const translatedLines = result
          .split('\n')
          .map(line => line.trim())
          .filter(line => line && !line.startsWith('-') && !line.startsWith('['));

        const processedLines = await Promise.all(
          translatedLines.map(line => dictionaryService.applyDictionary(line))
        );

        // Update translations for current batch
        for (let i = 0; i < batchEntries.length; i++) {
          if (processedLines[i]) {
            updatedEntries[start + i] = {
              ...updatedEntries[start + i],
              translation: processedLines[i]
            };
          }
        }

        // Add delay between batches
        if (batchIndex < totalBatches - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      setEntries(updatedEntries);
      
      // Show success toast and remove progress toast
      if (progressToastId !== null) {
        removeToast(progressToastId);
      }
      success('Dịch hoàn tất!');
      
    } catch (error: any) {
      console.error('Translation error:', error);
      // Show error toast and remove progress toast
      if (progressToastId !== null) {
        removeToast(progressToastId);
      }
      error(error instanceof Error ? error.message : 'Có lỗi xảy ra khi dịch phụ đề. Vui lòng thử lại sau.');
    } finally {
      setIsLoading(false);
      setProgressToastId(null);
    }
  };

  const handleDownload = () => {
    if (!entries.length) return;

    const content = entries.map(entry => 
      `${entry.id}\n${entry.from} --> ${entry.to}\n${entry.translation || entry.text}`
    ).join('\n\n') + '\n';

    const blob = new Blob([content], { type: 'text/plain' });
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

  const handleCopy = async () => {
    if (!entries.length) return;

    const content = entries.map(entry => 
      `${entry.id}\n${entry.from} --> ${entry.to}\n${entry.translation || entry.text}`
    ).join('\n\n') + '\n';

    try {
      await navigator.clipboard.writeText(content);
      success('Đã sao chép bản dịch vào clipboard!');
    } catch (err) {
      setError('Không thể sao chép bản dịch. Vui lòng thử lại.');
    }
  };

  const handleTranslationChange = (index: number, value: string) => {
    const newEntries = [...entries];
    newEntries[index] = {
      ...newEntries[index],
      translation: value
    };
    setEntries(newEntries);
  };

  const handleTranslateRow = async (index: number) => {
    if (isLoading) return;

    try {
      const entry = entries[index];
      const toastId = loading(`Đang dịch dòng ${index + 1}...`);

      const prompt = `Dịch câu sau sang ${targetLanguage}. 
Yêu cầu:
- Chỉ trả về câu đã dịch
- Không thêm chú thích
- Giữ nguyên format và ký tự đặc biệt
- Dịch theo ngữ cảnh tự nhiên

Nội dung cần dịch:
${entry.text}`;

      const result = await aiService.processWithAI(prompt);
      const processedResult = await dictionaryService.applyDictionary(result.trim());

      const newEntries = [...entries];
      newEntries[index] = {
        ...entry,
        translation: processedResult
      };
      setEntries(newEntries);
      setError(null);

      removeToast(toastId);
      success(`Đã dịch xong dòng ${index + 1}`);
    } catch (error: any) {
      console.error('Translation error:', error);
      error(`Lỗi khi dịch dòng ${index + 1}`);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <input
              type="file"
              onChange={handleFileUpload}
              accept=".srt"
              className="w-64 p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
            />
            <select
              value={targetLanguage}
              onChange={(e) => setTargetLanguage(e.target.value)}
              className="p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.name}
                </option>
              ))}
            </select>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={batchSize}
                onChange={(e) => setBatchSize(Math.max(1, Math.min(100, parseInt(e.target.value) || 50)))}
                min="1"
                max="100"
                className="w-20 p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
                title="Số câu mỗi lần xử lý (1-100)"
              />
              <span className="text-sm text-gray-500">câu/lần</span>
            </div>
            <button
              onClick={handleTranslate}
              disabled={isLoading || !entries.length}
              className={`py-2 px-4 rounded-lg text-white font-medium transition-all duration-200 flex items-center gap-2 ${
                isLoading || !entries.length
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-primary hover:bg-primary/90'
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
            {entries.length > 0 && (
              <>
                <button
                  onClick={handleDownload}
                  className="py-2 px-4 rounded-lg text-primary border border-primary hover:bg-primary/10 transition-all duration-200 flex items-center gap-2"
                >
                  <MdDownload className="h-5 w-5" />
                  Tải xuống
                </button>
                <button
                  onClick={handleCopy}
                  className="py-2 px-4 rounded-lg text-primary border border-primary hover:bg-primary/10 transition-all duration-200 flex items-center gap-2"
                >
                  <MdContentCopy className="h-5 w-5" />
                  Sao chép
                </button>
              </>
            )}
          </div>
          <button
            onClick={() => setIsDictionaryOpen(true)}
            className="flex items-center gap-2 text-gray-500 hover:text-primary transition-colors duration-200"
          >
            <MdBook className="h-5 w-5" />
            <span>Từ điển</span>
          </button>
        </div>

        {error && (
          <div className={`p-4 rounded-lg ${error.startsWith('Đang xử lý') ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600'}`}>
            {error}
          </div>
        )}

        <div className="overflow-auto max-h-[calc(100vh-300px)]">
          <table className="w-full border-collapse">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="p-3 text-left text-sm font-medium text-gray-700 w-16">No.</th>
                <th className="p-3 text-left text-sm font-medium text-gray-700 w-36">From</th>
                <th className="p-3 text-left text-sm font-medium text-gray-700 w-36">To</th>
                <th className="p-3 text-left text-sm font-medium text-gray-700">Original Text</th>
                <th className="p-3 text-left text-sm font-medium text-gray-700">Translated Text</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {entries.map((entry, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="p-3 text-sm text-gray-500 font-mono">{entry.id}</td>
                  <td className="p-3 text-sm text-gray-500 font-mono">{entry.from}</td>
                  <td className="p-3 text-sm text-gray-500 font-mono">{entry.to}</td>
                  <td className="p-3 text-sm text-gray-900 font-mono whitespace-pre-wrap">{entry.text}</td>
                  <td className="p-3 text-sm text-gray-900 font-mono">
                    <div className="flex gap-2">
                      <textarea
                        value={entry.translation}
                        onChange={(e) => handleTranslationChange(index, e.target.value)}
                        className="flex-1 p-2 text-sm font-mono border border-gray-200 rounded focus:ring-2 focus:ring-primary/20 focus:border-primary min-h-[60px] resize-none whitespace-pre-wrap"
                      />
                      <button
                        onClick={() => handleTranslateRow(index)}
                        disabled={isLoading}
                        className="self-start p-2 text-gray-500 hover:text-primary hover:bg-primary/10 rounded transition-colors"
                        title="Dịch dòng này"
                      >
                        <MdTranslate className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dictionary
        isOpen={isDictionaryOpen}
        onClose={() => setIsDictionaryOpen(false)}
      />
      <ToastContainer />
    </div>
  );
} 