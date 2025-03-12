'use client';

import { useState, useEffect } from 'react';
import { DocumentArrowUpIcon, LanguageIcon } from '@heroicons/react/24/outline';
import { MdTranslate, MdDownload, MdSettings, MdEdit, MdCheck, MdClose, MdVisibility, MdVisibilityOff } from 'react-icons/md';
import { dictionaryService } from '@/lib/dictionary-service';
import { aiService } from '@/lib/ai-service';
import { useToast } from '@/utils/toast';

interface RPGMVEntry {
  key: string;
  original: string;
  translation: string;
  isTranslated: boolean;
  isEditing?: boolean;
}

const SUPPORTED_LANGUAGES = [
  { code: 'vi', name: 'Tiếng Việt' },
  { code: 'en', name: 'Tiếng Anh' },
  { code: 'zh', name: 'Tiếng Trung' },
  { code: 'ja', name: 'Tiếng Nhật' },
  { code: 'ko', name: 'Tiếng Hàn' },
];


export default function RPGMVTranslation() {
  const [jsonContent, setJsonContent] = useState<{ [key: string]: any }>({});
  const [entries, setEntries] = useState<RPGMVEntry[]>([]);
  const [targetLanguage, setTargetLanguage] = useState('vi');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');
  const [isDictionaryOpen, setIsDictionaryOpen] = useState(false);
  const [batchSize, setBatchSize] = useState(50);
  const [itemsPerPage, setItemsPerPage] = useState(200);
  const [progress, setProgress] = useState({ current: 0, total: 0, percentage: 0 });
  const [showTable, setShowTable] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const { loading, success, error: showError } = useToast();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.json')) {
      setError('Vui lòng tải lên file JSON của RPGMV');
      return;
    }

    try {
      const text = await file.text();
      const json = JSON.parse(text);
      setJsonContent(json);
      setFileName(file.name);

      // Parse JSON content into entries
      const parsedEntries: RPGMVEntry[] = [];
      const processObject = (obj: any, prefix: string = '') => {
        for (const [key, value] of Object.entries(obj)) {
          if (typeof value === 'string') {
            parsedEntries.push({
              key: prefix ? `${prefix}.${key}` : key,
              original: value,
              translation: value,
              isTranslated: false
            });
          } else if (typeof value === 'object' && value !== null) {
            processObject(value, prefix ? `${prefix}.${key}` : key);
          }
        }
      };

      processObject(json);
      setEntries(parsedEntries);
      setError(null);
    } catch (error) {
      console.error('Error reading file:', error);
      setError('Lỗi khi đọc file JSON');
    }
  };

  const handleTranslate = async () => {
    if (!entries.length) return;

    setIsLoading(true);
    setError(null);
    setProgress({ current: 0, total: entries.length, percentage: 0 });

    try {
      const totalBatches = Math.ceil(entries.length / batchSize);
      const updatedEntries = [...entries];

      for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
        const start = batchIndex * batchSize;
        const end = Math.min(start + batchSize, entries.length);
        const batchEntries = entries.slice(start, end);

        const textsToTranslate = batchEntries.map(entry => entry.original);
        const batchText = textsToTranslate.join('\n');

        const currentProgress = {
          current: end,
          total: entries.length,
          percentage: Math.round((end / entries.length) * 100)
        };
        setProgress(currentProgress);

        const prompt = `Bạn là một công cụ dịch thuật chuyên nghiệp. Hãy dịch các câu dưới đây sang ${targetLanguage}.

Quy tắc bắt buộc:
1. Chỉ trả về các câu đã dịch, mỗi câu một dòng
2. Không thêm bất kỳ nội dung nào khác ngoài bản dịch
3. Không thêm số thứ tự, dấu gạch đầu dòng hay chú thích
4. Giữ nguyên tất cả các biến như %1, %2, \\V[1], etc.
5. Giữ nguyên format và ký tự đặc biệt
6. Nếu là code hoặc không thể dịch được thì giữ nguyên
7. Dịch theo ngữ cảnh tự nhiên, phù hợp với game/ứng dụng

Đây là phần ${batchIndex + 1}/${totalBatches}.
Nội dung cần dịch:
${batchText}`;

        const result = await aiService.processWithAI(prompt);

        const translatedLines = result
          .split('\n')
          .map(line => line.trim())
          .filter(line => line && !line.startsWith('-') && !line.startsWith('['));

        const processedLines = await Promise.all(
          translatedLines.map(line => dictionaryService.applyDictionary(line))
        );

        for (let i = 0; i < batchEntries.length; i++) {
          if (processedLines[i]) {
            updatedEntries[start + i] = {
              ...updatedEntries[start + i],
              translation: processedLines[i],
              isTranslated: true
            };
          }
        }

        setEntries(updatedEntries);

        if (batchIndex < totalBatches - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

    } catch (error: any) {
      console.error('Translation error:', error);
      showError(error instanceof Error ? error.message : 'Có lỗi xảy ra khi dịch. Vui lòng thử lại sau.');
    } finally {
      setIsLoading(false);
      setProgress({ current: 0, total: 0, percentage: 0 });
    }
  };

  const handleTranslateSingle = async (index: number) => {
    if (isLoading) return;

    const entry = entries[index];
    if (!entry) return;

    try {
      const prompt = `Chỉ trả về bản dịch sang ${targetLanguage}, giữ nguyên các biến như %1, %2, \\V[1], etc.
1. Không thêm bất kỳ chú thích hay giải thích nào
2. Không thêm bất kỳ nội dung nào khác ngoài bản dịch
3. Không thêm số thứ tự, dấu gạch đầu dòng hay chú thích
4. Giữ nguyên tất cả các biến như %1, %2, \\V[1], etc.
5. Giữ nguyên format và ký tự đặc biệt
6. Không dịch các văn bản có _ nối liền chữ
Nội dung cần dịch:
${entry.original}`;
      const result = await aiService.processWithAI(prompt);

      const translatedText = await dictionaryService.applyDictionary(result.trim());

      const newEntries = [...entries];
      newEntries[index] = {
        ...entry,
        translation: translatedText,
        isTranslated: true
      };
      setEntries(newEntries);
    } catch (error) {
      console.error('Translation error:', error);
      showError('Có lỗi xảy ra khi dịch dòng này');
    }
  };

  const handleTranslationChange = (index: number, newTranslation: string) => {
    const newEntries = [...entries];
    newEntries[index] = {
      ...newEntries[index],
      translation: newTranslation,
      isTranslated: true
    };
    setEntries(newEntries);
  };

  const handleDownload = () => {
    if (!entries.length) return;

    // Reconstruct JSON with translations
    const translatedJson = { ...jsonContent };
    const updateObjectWithTranslations = (obj: any, entries: RPGMVEntry[]) => {
      for (const entry of entries) {
        const keys = entry.key.split('.');
        let current = obj;

        for (let i = 0; i < keys.length - 1; i++) {
          current = current[keys[i]];
        }

        const lastKey = keys[keys.length - 1];
        if (current && typeof current === 'object') {
          current[lastKey] = entry.translation;
        }
      }
    };

    updateObjectWithTranslations(translatedJson, entries);

    const content = JSON.stringify(translatedJson, null, 2);
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const newFileName = fileName.replace('.json', `_${targetLanguage}.json`);
    a.download = newFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const totalPages = Math.ceil(entries.length / itemsPerPage);
  const paginatedEntries = entries.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <label className="flex-1">
            <div className="flex items-center gap-2 mb-2 text-sm font-medium text-gray-700">
              <DocumentArrowUpIcon className="h-5 w-5" />
              <span>File RPGMV JSON</span>
            </div>
            <div className="relative">
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-full file:border-0
                  file:text-sm file:font-semibold
                  file:bg-primary file:text-white
                  hover:file:bg-primary/80
                  cursor-pointer"
              />
            </div>
          </label>

          <div className="w-48">
            <div className="flex items-center gap-2 mb-2 text-sm font-medium text-gray-700">
              <LanguageIcon className="h-5 w-5" />
              <span>Ngôn ngữ đích</span>
            </div>
            <select
              value={targetLanguage}
              onChange={(e) => setTargetLanguage(e.target.value)}
              className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.name}
                </option>
              ))}
            </select>
          </div>

          <div className="w-48">
            <div className="flex items-center gap-2 mb-2 text-sm font-medium text-gray-700">
              <MdSettings className="h-5 w-5" />
              <span>Số dòng mỗi lần dịch</span>
            </div>
            <select
              value={batchSize}
              onChange={(e) => setBatchSize(Number(e.target.value))}
              className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="10">10 dòng</option>
              <option value="25">25 dòng</option>
              <option value="50">50 dòng</option>
              <option value="100">100 dòng</option>
              <option value="200">200 dòng</option>
            </select>
          </div>

          <div className="w-48">
            <div className="flex items-center gap-2 mb-2 text-sm font-medium text-gray-700">
              <MdVisibility className="h-5 w-5" />
              <span>Items per page</span>
            </div>
            <select
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
              className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="50">50</option>
              <option value="100">100</option>
              <option value="200">200</option>
              <option value="500">500</option>
              <option value="1000">1000</option>
              <option value="99999">ALL</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
            {error}
          </div>
        )}

        <div className="flex gap-4">
          <button
            onClick={() => handleTranslate()}
            disabled={isLoading || !entries.length}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/80 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <MdTranslate className="h-5 w-5" />
            <span>Dịch</span>
          </button>

          <button
            onClick={handleDownload}
            disabled={!entries.length}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <MdDownload className="h-5 w-5" />
            <span>Tải xuống</span>
          </button>

          <button
            onClick={() => setShowTable(!showTable)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            {showTable ? (
              <>
                <MdVisibilityOff className="h-5 w-5" />
                <span>Ẩn bảng</span>
              </>
            ) : (
              <>
                <MdVisibility className="h-5 w-5" />
                <span>Hiện bảng</span>
              </>
            )}
          </button>

          {isLoading && progress.total > 0 && (
            <div className="flex-1 flex items-center gap-4">
              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${progress.percentage}%` }}
                />
              </div>
              <span className="text-sm text-gray-600 whitespace-nowrap">
                {progress.current}/{progress.total} dòng ({progress.percentage}%)
              </span>
            </div>
          )}
        </div>
      </div>

      {entries.length > 0 && showTable && (
        <div className="space-y-4">
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[5%]">
                      STT
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[15%]">
                      Key
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[20%]">
                      Nội dung gốc
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[45%]">
                      Bản dịch
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[15%]">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedEntries.map((entry, index) => {
                    const actualIndex = (currentPage - 1) * itemsPerPage + index;
                    return (
                      <tr key={actualIndex} className={entry.isTranslated ? 'bg-green-50/30' : ''}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500">
                          {actualIndex + 1}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {entry.key}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {entry.original}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          <textarea
                            value={entry.translation}
                            onChange={(e) => handleTranslationChange(actualIndex, e.target.value)}
                            className="w-full min-h-[80px] p-2 border border-gray-200 rounded focus:ring-2 focus:ring-primary/20 focus:border-primary resize-y"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleTranslateSingle(actualIndex)}
                              disabled={isLoading}
                              className="flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded hover:bg-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <MdTranslate className="h-4 w-4" />
                              <span>Dịch</span>
                            </button>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                              ${entry.isTranslated
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-600'}`}>
                              {entry.isTranslated ? 'Đã dịch' : 'Chưa dịch'}
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 rounded bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Trước
              </button>
              <span className="text-sm text-gray-600">
                Trang {currentPage}/{totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 rounded bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Sau
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 