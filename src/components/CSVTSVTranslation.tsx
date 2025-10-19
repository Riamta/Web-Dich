'use client';

import { useEffect, useMemo, useState } from 'react';
import { BookOpenIcon, ClipboardIcon, LanguageIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { useToast } from '@/hooks/use-toast';
import { aiService } from '@/lib/ai-service';
import { dictionaryService } from '@/lib/dictionary-service';
import { SUPPORTED_LANGUAGES } from '@/constants/languages';

type Delimiter = ',' | '\t';

interface RowStatus {
  status: 'pending' | 'translated' | 'error';
}

function detectDelimiter(fileName: string, sample: string): Delimiter {
  if (fileName.toLowerCase().endsWith('.tsv')) return '\t';
  if (fileName.toLowerCase().endsWith('.csv')) return ',';
  const tabCount = (sample.match(/\t/g) || []).length;
  const commaCount = (sample.match(/,/g) || []).length;
  return tabCount > commaCount ? '\t' : ',';
}

function parseDelimitedLine(line: string, delimiter: Delimiter): string[] {
  if (delimiter === '\t') {
    // TSV: split by tab; keep simple
    return line.split('\t');
  }
  // CSV: parse with quotes support
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
  }
  result.push(current);
  return result;
}

function serializeCell(value: string, delimiter: Delimiter): string {
  if (delimiter === '\t') return value;
  const needsQuote = /[",\n]/.test(value);
  if (!needsQuote) return value;
  return '"' + value.replace(/"/g, '""') + '"';
}

export default function CSVTSVTranslation() {
  const { toast } = useToast();
  const [fileName, setFileName] = useState('');
  const [delimiter, setDelimiter] = useState<Delimiter>(',');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [rowStatuses, setRowStatuses] = useState<RowStatus[]>([]);
  const [sourceCol, setSourceCol] = useState<number>(0);
  const [targetCol, setTargetCol] = useState<number | 'new'>('new');
  const [targetLanguage, setTargetLanguage] = useState('vi');
  const [isLoading, setIsLoading] = useState(false);
  const [batchSize, setBatchSize] = useState(100);
  const [customContext, setCustomContext] = useState('');
  const [useContext, setUseContext] = useState(false);
  const [hiddenCols, setHiddenCols] = useState<Set<number>>(new Set());
  const [analyzeContext, setAnalyzeContext] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const hasData = rows.length > 0;

  const stats = useMemo(() => {
    const s = { translated: 0, error: 0, pending: 0 };
    rowStatuses.forEach(r => {
      if (r.status === 'translated') s.translated++;
      else if (r.status === 'error') s.error++;
      else s.pending++;
    });
    return s;
  }, [rowStatuses]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const dlm = detectDelimiter(file.name, text.slice(0, 2000));
    setDelimiter(dlm);
    setFileName(file.name);

    const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
    const nonEmpty = lines.filter(l => l.length > 0);
    if (nonEmpty.length === 0) {
      toast({ title: 'Lỗi', description: 'File trống.', variant: 'destructive' });
      return;
    }
    const parsedHeader = parseDelimitedLine(nonEmpty[0], dlm);
    const parsedRows: string[][] = [];
    for (let i = 1; i < nonEmpty.length; i++) {
      parsedRows.push(parseDelimitedLine(nonEmpty[i], dlm));
    }
    // Normalize row length
    const width = parsedHeader.length;
    const normalized = parsedRows.map(r => {
      const copy = r.slice(0, width);
      while (copy.length < width) copy.push('');
      return copy;
    });

    setHeaders(parsedHeader);
    setRows(normalized);
    setRowStatuses(normalized.map(() => ({ status: 'pending' })));
    setSourceCol(0);
    setTargetCol('new');
    setHiddenCols(new Set());
  };

  const ensureTargetColumn = (): number => {
    if (targetCol === 'new') {
      const newHeaders = [...headers, 'translation'];
      const newRows = rows.map(r => [...r, '']);
      setHeaders(newHeaders);
      setRows(newRows);
      setTargetCol(newHeaders.length - 1);
      return newHeaders.length - 1;
    }
    return targetCol as number;
  };

  const translateAll = async () => {
    if (!hasData) return;
    const tColIndex = ensureTargetColumn();
    setIsLoading(true);

    try {
      const updatedRows = [...rows];
      const updatedStatuses = [...rowStatuses];
      const indices = updatedRows.map((_, idx) => idx);
      const totalBatches = Math.ceil(indices.length / batchSize);

      for (let b = 0; b < totalBatches; b++) {
        const start = b * batchSize;
        const end = Math.min(start + batchSize, indices.length);
        const batchIdx = indices.slice(start, end);
        const texts = batchIdx.map(i => updatedRows[i][sourceCol] || '');

        // Sử dụng system prompt mới từ code Python
        const systemPrompt = `Bạn là biên dịch viên game Nhật Bản/Trung Quốc chuyên nghiệp. Dịch sang tiếng Việt tự nhiên, đời thường.

QUY TẮC NGHIÊM NGẶT:
- LUÔN DỊCH THEO KIỂU ĐỜI THƯỜNG, TRÁNH TỪ HÁN VIỆT:
  ✓ '経験値' → 'điểm kinh nghiệm' (KHÔNG phải 'kinh nghiệm giá trị')
  ✓ 'レベル' → 'cấp độ' (KHÔNG phải 'bình cấp')
  ✓ 'アイテム' → 'vật phẩm' (KHÔNG phải 'tự liệu')
  ✓ 'ステータス' → 'thông số' (KHÔNG phải 'trạng thái')

- TÊN RIÊNG THEO NGUỒN GỐC:
  ✓ Nhân vật Nhật: giữ nguyên hoặc phiên âm tự nhiên (Yasuo, Ahri)
  ✓ Thuật ngữ game: dịch tự nhiên (Skill → Kỹ năng, Quest → Nhiệm vụ)

- TUYỆT ĐỐI GIỮ NGUYÊN: cấu trúc câu, định dạng, khoảng trắng, xuống dòng, dấu câu,
  placeholder, tag/markup/ký tự đặc biệt (ví dụ: <cm>, <br>, {value}, %s, {0}, \\n, \\t).
- KHÔNG thêm/bớt/thay đổi thứ tự thành phần. KHÔNG giải thích. Chỉ trả về kết quả dịch.`;

        const contextInfo = useContext && customContext.trim() ? `Ngữ cảnh: ${customContext}\n\n` : '';
        
        // Retry logic với max 3 lần thử
        const maxRetries = 3;
        let useStrictPrompt = false;
        let batchSuccess = false;

        for (let attempt = 0; attempt < maxRetries && !batchSuccess; attempt++) {
          try {
            // Prompt với format mới từ code Python
            let userPrompt = `Dịch các đoạn sau sang tiếng Việt tự nhiên, đời thường. QUY TẮC NGHIÊM NGẶT:

🎯 Dịch 1-1 theo từng dòng và TRẢ VỀ CHÍNH XÁC ${texts.length} DÒNG, giữ nguyên thứ tự.

📝 QUY TẮC DỊCH:
- Nếu text có # ở đầu thì phải giữ nguyên cấu trúc, không được xoá
- Dịch tự nhiên, đời thường, tránh từ Hán Việt
- Giữ nguyên 100% tag/markup/placeholders: <cm>, <br>, {value}, %s, {0}, \\n, \\t
- KHÔNG thay đổi cấu trúc, khoảng trắng, dấu câu
- KHÔNG thêm/bớt/thay đổi thứ tự nội dung
- Với <br>: giữ nguyên tag, KHÔNG tạo dòng mới thật

⚠️  CẢNH BÁO:
- Số dòng đầu ra PHẢI bằng số dòng đầu vào
- Mỗi dòng dịch tương ứng với 1 dòng gốc`;

            if (useStrictPrompt) {
              userPrompt += `\n🚨 NGHIÊM TRỌNG: Lần trước sai số dòng! Hãy kiểm tra kỹ và trả về ĐÚNG ${texts.length} dòng.`;
            }

            userPrompt += `\n\n${contextInfo}--- DỮ LIỆU CẦN DỊCH ---
${texts.map((text, idx) => `${idx + 1}. ${text}`).join('\n')}`;

            const result = await aiService.processWithAI(`${systemPrompt}\n\n${userPrompt}`);
            
            // Parse kết quả: ưu tiên dạng đánh số, fallback dạng từng dòng, KHÔNG trim để giữ cấu trúc
            const rawLinesAll = result.split('\n');
            const groupedItems: string[] = [];

            for (const ln of rawLinesAll) {
              const match = ln.match(/^\s*\d+\.\s*(.*)/);
              if (match) {
                groupedItems.push(match[1]);
              } else if (groupedItems.length > 0) {
                groupedItems[groupedItems.length - 1] += "\n" + ln;
              }
            }

            let cleanedLines: string[];
            if (groupedItems.length > 0) {
              cleanedLines = groupedItems;
            } else {
              // Fallback: chia theo từng dòng
              cleanedLines = rawLinesAll;
            }

            // Đảm bảo số dòng đầu ra khớp với đầu vào
            if (cleanedLines.length !== texts.length) {
              console.warn(`Output mismatch: expected ${texts.length}, got ${cleanedLines.length}`);

              if (cleanedLines.length !== texts.length && !useStrictPrompt) {
                // Thử lại với strict prompt nếu sai số dòng
                useStrictPrompt = true;
                continue;
              }

              // Nếu vẫn sai số dòng, cân bằng để không vỡ cấu trúc bảng
              while (cleanedLines.length < texts.length) cleanedLines.push("");
              if (cleanedLines.length > texts.length) cleanedLines = cleanedLines.slice(0, texts.length);
            }

            const processed = await Promise.all(cleanedLines.map(l => dictionaryService.applyDictionary(l)));

            for (let i = 0; i < batchIdx.length; i++) {
              const rowIndex = batchIdx[i];
              const translated = processed[i];
              if (translated !== undefined) {
                updatedRows[rowIndex][tColIndex] = translated;
                updatedStatuses[rowIndex] = { status: 'translated' };
              } else {
                updatedStatuses[rowIndex] = { status: 'error' };
              }
            }
            setRows([...updatedRows]);
            setRowStatuses([...updatedStatuses]);
            batchSuccess = true;

          } catch (e: any) {
            console.warn(`Lỗi khi dịch batch ${b + 1} (lần thử ${attempt + 1}):`, e);
            if (attempt < maxRetries - 1) {
              // Exponential backoff
              await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 1000));
            } else {
              console.error(`Không thể dịch batch ${b + 1} sau ${maxRetries} lần thử`);
              // Đánh dấu tất cả dòng trong batch này là lỗi
              for (let i = 0; i < batchIdx.length; i++) {
                const rowIndex = batchIdx[i];
                updatedStatuses[rowIndex] = { status: 'error' };
              }
              setRowStatuses([...updatedStatuses]);
            }
          }
        }

        if (b < totalBatches - 1) await new Promise(r => setTimeout(r, 400));
      }

      toast({ title: 'Thành công', description: 'Đã dịch xong toàn bộ cột.', variant: 'default' });
    } catch (e: any) {
      toast({ title: 'Lỗi', description: e?.message || 'Có lỗi khi dịch.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const translateRow = async (rowIndex: number) => {
    if (isLoading) return;
    const tColIndex = ensureTargetColumn();
    
    const text = rows[rowIndex][sourceCol] || '';
    if (!text || text.trim() === '') {
      toast({ title: 'Cảnh báo', description: 'Dòng trống, không cần dịch.', variant: 'default' });
      return;
    }

    // Sử dụng system prompt mới từ code Python
    const systemPrompt = `Bạn là biên dịch viên game Nhật Bản/Trung Quốc chuyên nghiệp. Dịch sang tiếng Việt tự nhiên, đời thường.

QUY TẮC NGHIÊM NGẶT:
- LUÔN DỊCH THEO KIỂU ĐỜI THƯỜNG, TRÁNH TỪ HÁN VIỆT:
  ✓ '経験値' → 'điểm kinh nghiệm' (KHÔNG phải 'kinh nghiệm giá trị')
  ✓ 'レベル' → 'cấp độ' (KHÔNG phải 'bình cấp')
  ✓ 'アイテム' → 'vật phẩm' (KHÔNG phải 'tự liệu')
  ✓ 'ステータス' → 'thông số' (KHÔNG phải 'trạng thái')

- TÊN RIÊNG THEO NGUỒN GỐC:
  ✓ Nhân vật Nhật: giữ nguyên hoặc phiên âm tự nhiên (Yasuo, Ahri)
  ✓ Thuật ngữ game: dịch tự nhiên (Skill → Kỹ năng, Quest → Nhiệm vụ)

- TUYỆT ĐỐI GIỮ NGUYÊN: cấu trúc câu, định dạng, khoảng trắng, xuống dòng, dấu câu,
  placeholder, tag/markup/ký tự đặc biệt (ví dụ: <cm>, <br>, {value}, %s, {0}, \\n, \\t).
- KHÔNG thêm/bớt/thay đổi thứ tự thành phần. KHÔNG giải thích. Chỉ trả về kết quả dịch.`;

    const contextInfo = useContext && customContext.trim() ? `Ngữ cảnh: ${customContext}\n\n` : '';
    const userPrompt = `Dịch đoạn sau sang tiếng Việt tự nhiên, đời thường:

${contextInfo}Nội dung (chỉ trả về ĐÚNG 1 dòng, không thêm/bớt ký tự đặc biệt, không xuống dòng mới):
${text}

📝 Lưu ý: Giữ nguyên 100% tag/markup/placeholders, chỉ dịch phần text.`;

    // Retry logic với max 3 lần thử
    const maxRetries = 3;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const result = await aiService.processWithAI(`${systemPrompt}\n\n${userPrompt}`);
        // Không trim để giữ cấu trúc/khoảng trắng nếu có
        const processed = await dictionaryService.applyDictionary(result);
        const newRows = [...rows];
        const newStatuses = [...rowStatuses];
        newRows[rowIndex][tColIndex] = processed;
        newStatuses[rowIndex] = { status: 'translated' };
        setRows(newRows);
        setRowStatuses(newStatuses);
        toast({ title: 'Đã dịch xong 1 dòng', description: `Dòng ${rowIndex + 1}`, variant: 'default' });
        return; // Thành công, thoát khỏi vòng lặp retry
      } catch (e: any) {
        console.warn(`Lỗi khi dịch dòng ${rowIndex + 1} (lần thử ${attempt + 1}):`, e);
        if (attempt < maxRetries - 1) {
          // Exponential backoff
          await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 1000));
        } else {
          // Thất bại sau tất cả lần thử
          const newStatuses = [...rowStatuses];
          newStatuses[rowIndex] = { status: 'error' };
          setRowStatuses(newStatuses);
          toast({ title: 'Lỗi', description: `Không dịch được dòng ${rowIndex + 1} sau ${maxRetries} lần thử`, variant: 'destructive' });
        }
      }
    }
  };

  const handleCellChange = (rowIndex: number, colIndex: number, value: string) => {
    const updated = [...rows];
    updated[rowIndex] = [...updated[rowIndex]];
    updated[rowIndex][colIndex] = value;
    setRows(updated);
  };

  const downloadFile = () => {
    if (!hasData) return;
    const sep = delimiter === '\t' ? '\t' : ',';
    const headerLine = headers.map(h => serializeCell(h, delimiter)).join(sep);
    const body = rows.map(r => r.map(c => serializeCell(c ?? '', delimiter)).join(sep)).join('\n');
    const content = headerLine + '\n' + body + '\n';
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const base = fileName.replace(/\.(csv|tsv|txt)$/i, '');
    a.download = base + (delimiter === '\t' ? '_translated.tsv' : '_translated.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: 'Đã tải xuống', description: 'File đã dịch được lưu.', variant: 'default' });
  };

  const copyToClipboard = async () => {
    if (!hasData) return;
    const sep = delimiter === '\t' ? '\t' : ',';
    const headerLine = headers.join(sep);
    const body = rows.map(r => r.join(sep)).join('\n');
    const content = headerLine + '\n' + body + '\n';
    try {
      await navigator.clipboard.writeText(content);
      toast({ title: 'Đã sao chép', description: 'Nội dung bảng đã được copy.', variant: 'default' });
    } catch {
      toast({ title: 'Lỗi', description: 'Không thể copy.', variant: 'destructive' });
    }
  };

  const toggleHiddenCol = (index: number) => {
    setHiddenCols(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index); else next.add(index);
      return next;
    });
  };

  const visibleColumnIndices = useMemo(() => headers.map((_, i) => i).filter(i => !hiddenCols.has(i)), [headers, hiddenCols]);

  const analyzeGameContext = async () => {
    if (!hasData) return;
    setIsAnalyzing(true);
    
    try {
      // Lấy một mẫu văn bản từ cột nguồn để phân tích
      const sampleTexts = rows.slice(0, Math.min(10, rows.length))
        .map(row => row[sourceCol] || '')
        .filter(text => text.trim().length > 0)
        .slice(0, 5); // Chỉ lấy 5 dòng đầu để phân tích
      
      if (sampleTexts.length === 0) {
        toast({ title: 'Cảnh báo', description: 'Không có văn bản để phân tích.', variant: 'default' });
        return;
      }

      const analysisPrompt = `Bạn là chuyên gia phân tích và dịch thuật game. Nhiệm vụ của bạn là phân tích văn bản game và tạo ra 2 phần:

PHẦN 1 - GAME CONTEXT:
Tóm tắt bối cảnh game trong 4-5 câu bằng tiếng Việt:
- Thể loại game (RPG, action, simulation, puzzle, etc.)
- Setting/bối cảnh chính
- Nhân vật/đối tượng quan trọng
- Phong cách ngôn ngữ và tone

PHẦN 2 - TRANSLATION STYLE:
Tạo prompt hướng dẫn dịch thuật phù hợp với game này bằng tiếng Việt:
- Lưu ý về việc tránh lạm dụng tag <br>, có thể lược bớt <br> để tránh xuống dòng bừa bãi
- Phong cách dịch (tự nhiên, đời thường, kịch tính, trang trọng, etc.)
- Tone và giọng văn phù hợp

Hãy trả về đúng format:
===CONTEXT===
[phần context]

===STYLE===
[phần style prompt]

Văn bản cần phân tích:
${sampleTexts.join('\n')}`;

      const result = await aiService.processWithAI(analysisPrompt);
      
      // Parse kết quả
      const contextMatch = result.match(/===CONTEXT===\s*([\s\S]*?)\s*===STYLE===/);
      const styleMatch = result.match(/===STYLE===\s*([\s\S]*)/);
      
      if (contextMatch && styleMatch) {
        const context = contextMatch[1].trim();
        const style = styleMatch[1].trim();
        
        setCustomContext(`Bối cảnh game: ${context}\n\nHướng dẫn dịch: ${style}`);
        setUseContext(true);
        toast({ 
          title: 'Phân tích thành công', 
          description: 'Đã phân tích ngữ cảnh game và cập nhật hướng dẫn dịch.', 
          variant: 'default' 
        });
      } else {
        toast({ title: 'Lỗi', description: 'Không thể phân tích ngữ cảnh game.', variant: 'destructive' });
      }
    } catch (e: any) {
      toast({ title: 'Lỗi', description: e?.message || 'Có lỗi khi phân tích ngữ cảnh.', variant: 'destructive' });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200 space-y-4">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <input
                type="file"
                accept=".csv,.tsv,.txt"
                onChange={handleUpload}
                className="w-64 p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
              />
              <select
                value={targetLanguage}
                onChange={e => setTargetLanguage(e.target.value)}
                className="w-48 p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                {SUPPORTED_LANGUAGES.map(l => (
                  <option key={l.code} value={l.code}>{l.name}</option>
                ))}
              </select>
              {hasData && (
                <>
                  <select
                    value={sourceCol}
                    onChange={e => setSourceCol(parseInt(e.target.value))}
                    className="p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  >
                    {headers.map((h, i) => (
                      <option key={i} value={i}>Nguồn: {h || `Cột ${i + 1}`}</option>
                    ))}
                  </select>
                  <select
                    value={targetCol === 'new' ? 'new' : String(targetCol)}
                    onChange={e => setTargetCol(e.target.value === 'new' ? 'new' : parseInt(e.target.value))}
                    className="p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  >
                    <option value="new">Tạo cột dịch mới</option>
                    {headers.map((h, i) => (
                      <option key={i} value={i}>Đích: {h || `Cột ${i + 1}`}</option>
                    ))}
                  </select>
                  <select
                    value={batchSize}
                    onChange={e => setBatchSize(parseInt(e.target.value))}
                    className="p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  >
                    {[50, 100, 200, 500].map(s => (
                      <option key={s} value={s}>{s} dòng/lần</option>
                    ))}
                  </select>
                </>
              )}
            </div>
            <button
              onClick={() => setUseContext(!useContext)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${useContext ? 'text-primary border-primary' : 'text-gray-600 border-gray-300'} hover:bg-gray-50`}
              title="Bật/tắt sử dụng ngữ cảnh khi dịch"
            >
              <BookOpenIcon className="h-5 w-5" />
              {useContext ? 'Đang dùng ngữ cảnh' : 'Không dùng ngữ cảnh'}
            </button>
            {hasData && (
              <button
                onClick={analyzeGameContext}
                disabled={isAnalyzing}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${isAnalyzing ? 'text-gray-400 border-gray-200 cursor-not-allowed' : 'text-blue-600 border-blue-300 hover:bg-blue-50'}`}
                title="Phân tích ngữ cảnh game tự động"
              >
                <BookOpenIcon className="h-5 w-5" />
                {isAnalyzing ? 'Đang phân tích...' : 'Phân tích game'}
              </button>
            )}
          </div>

          {useContext && (
            <textarea
              value={customContext}
              onChange={e => setCustomContext(e.target.value)}
              placeholder="Nhập ngữ cảnh (xưng hô, thuật ngữ, bối cảnh...)"
              className="w-full p-3 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary min-h-[80px]"
            />
          )}

          {hasData && (
            <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm border border-gray-100">
              <div className="flex items-center gap-3">
                <button
                  onClick={translateAll}
                  disabled={isLoading}
                  className={`py-2 px-4 rounded-lg text-white font-medium transition-all duration-200 flex items-center gap-2 ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-500 hover:bg-red-600'}`}
                >
                  <LanguageIcon className="h-5 w-5" />
                  Dịch toàn bộ cột
                </button>
              </div>
              <div className="flex items-center gap-3">
                <div className="hidden md:flex items-center gap-2">
                  <span className="text-sm text-gray-500">Hiển thị cột:</span>
                  <div className="flex flex-wrap gap-2 max-w-[38rem]">
                    {headers.map((h, i) => (
                      <label key={i} className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full border hover:bg-gray-50 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={!hiddenCols.has(i)}
                          onChange={() => toggleHiddenCol(i)}
                          className="rounded text-primary focus:ring-primary"
                        />
                        <span className="text-gray-700">{h || `Cột ${i + 1}`}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <button onClick={downloadFile} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                  <ArrowDownTrayIcon className="h-4 w-4" /> Tải xuống
                </button>
                <button onClick={copyToClipboard} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                  <ClipboardIcon className="h-4 w-4" /> Copy
                </button>
                <div className="text-sm text-gray-500 hidden sm:block">
                  Đã dịch: {stats.translated} | Lỗi: {stats.error} | Chờ: {stats.pending}
                </div>
              </div>
            </div>
          )}

          {hasData && (
            <div className="overflow-auto max-h-[calc(100vh-320px)]">
              <table className="w-full border-collapse">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="p-3 text-left text-sm font-medium text-gray-700 w-16">#</th>
                    {visibleColumnIndices.map(i => (
                      <th key={i} className="p-3 text-left text-sm font-medium text-gray-700 whitespace-nowrap">{headers[i] || `Cột ${i + 1}`}</th>
                    ))}
                    <th className="p-3 text-left text-sm font-medium text-gray-700 w-24">Dịch</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {rows.map((r, ri) => (
                    <tr key={ri} className={`${rowStatuses[ri]?.status === 'translated' ? 'bg-green-50' : rowStatuses[ri]?.status === 'error' ? 'bg-red-50' : ''} hover:bg-gray-50`}>
                      <td className="p-3 text-sm text-gray-500">{ri + 1}</td>
                      {visibleColumnIndices.map(ci => (
                        <td key={ci} className="p-2 text-sm text-gray-800 align-top">
                          <textarea
                            value={r[ci]}
                            onChange={e => handleCellChange(ri, ci, e.target.value)}
                            className={`w-full p-2 text-sm border rounded focus:ring-2 focus:ring-primary/20 focus:border-primary min-h-[44px] resize-y ${ci === sourceCol ? 'bg-white' : ''}`}
                          />
                        </td>
                      ))}
                      <td className="p-2 align-top">
                        <button
                          onClick={() => translateRow(ri)}
                          disabled={isLoading}
                          className="p-2 text-gray-500 hover:text-primary hover:bg-primary/10 rounded transition-colors"
                          title="Dịch dòng này"
                        >
                          <LanguageIcon className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


