'use client';

import { useState, useEffect, useRef } from 'react';
import { DocumentArrowUpIcon, PhotoIcon, FolderArrowDownIcon } from '@heroicons/react/24/outline';
import { MdContentCopy, MdEdit, MdClose, MdDelete, MdArrowDownward } from 'react-icons/md';
import ReactMarkdown from 'react-markdown';
import { useTabState } from '../hooks/useTabState';
import { Tooltip } from 'react-tooltip';
import { SUPPORTED_LANGUAGES } from '@/constants/languages';

export default function TextSummarization() {
    const [mounted, setMounted] = useState(false);
    const [inputText, setInputText] = useState('');
    const [summary, setSummary] = useState('');
    const [selectedLanguage, setSelectedLanguage] = useTabState('summarizeLanguage', 'vi');
    const [summaryType, setSummaryType] = useTabState('summarizeType', 'concise');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editedSummary, setEditedSummary] = useState('');
    const [files, setFiles] = useState<File[]>([]);
    const [fileSummaries, setFileSummaries] = useState<{ name: string; content: string }[]>([]);
    const [showFileUpload, setShowFileUpload] = useState(false);
    const [progress, setProgress] = useState(0);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const resultRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setMounted(true);
        if (window.performance && window.performance.navigation.type === window.performance.navigation.TYPE_RELOAD) {
            setInputText('');
            setSummary('');
            setFiles([]);
            setFileSummaries([]);
            setImagePreviews([]);
        }
    }, []);

    if (!mounted) {
        return <div className="min-h-screen"></div>;
    }

    const getWordCount = (text: string) => {
        return text.trim().split(/\s+/).filter(word => word.length > 0).length;
    };

    const getCharacterCount = (text: string) => {
        return text.length;
    };

    const scrollToResults = () => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleClearText = () => {
        setInputText('');
        setFiles([]);
        setFileSummaries([]);
    };

    const createImagePreview = (file: File): Promise<string> => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                resolve(reader.result as string);
            };
            reader.readAsDataURL(file);
        });
    };

    const handlePaste = async (e: React.ClipboardEvent) => {
        const items = e.clipboardData.items;
        
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            
            if (item.type.startsWith('image/')) {
                e.preventDefault();
                const file = item.getAsFile();
                if (file) {
                    const preview = await createImagePreview(file);
                    setFiles(prev => [...prev, file]);
                    setImagePreviews(prev => [...prev, preview]);
                }
                return;
            }
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            const newPreviews = await Promise.all(
                newFiles.map(file => createImagePreview(file))
            );
            setFiles(prev => [...prev, ...newFiles]);
            setImagePreviews(prev => [...prev, ...newPreviews]);
            setShowFileUpload(false);
        }
    };

    const handleRemoveFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
        setFileSummaries(prev => prev.filter((_, i) => i !== index));
        setImagePreviews(prev => prev.filter((_, i) => i !== index));
    };

    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                const base64String = reader.result as string;
                // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
                const base64 = base64String.split(',')[1];
                resolve(base64);
            };
            reader.onerror = error => reject(error);
        });
    };

    const handleSummarize = async () => {
        if (!inputText.trim() && files.length === 0) return;

        setIsLoading(true);
        setError(null);
        setProgress(0);

        try {
            if (files.length > 0) {
                console.log('🚀 Sending files for summarization...');
                
                // Convert files to base64
                const fileData = await Promise.all(
                    files.map(async (file) => {
                        const base64 = await fileToBase64(file);
                        return {
                            name: file.name,
                            type: file.type,
                            data: base64
                        };
                    })
                );

                const response = await fetch('/api/summarize', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ 
                        files: fileData,
                        language: selectedLanguage,
                        type: summaryType 
                    }),
                });

                if (!response.ok) {
                    throw new Error('Failed to summarize files');
                }

                const data = await response.json();
                setFileSummaries(data.summaries);
            } else if (inputText.trim()) {
                console.log('🚀 Sending text for summarization...');
                const response = await fetch('/api/summarize', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ 
                        text: inputText, 
                        language: selectedLanguage,
                        type: summaryType 
                    }),
                });

                if (!response.ok) {
                    throw new Error('Failed to summarize text');
                }

                const data = await response.json();
                setSummary(data.summary);
            }
            scrollToResults();
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Có lỗi xảy ra khi tóm tắt');
            setSummary('');
            setFileSummaries([]);
        } finally {
            setIsLoading(false);
            setProgress(0);
        }
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
            const errorNotification = document.createElement('div');
            errorNotification.className = 'fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
            errorNotification.textContent = 'Không thể sao chép văn bản';
            document.body.appendChild(errorNotification);
            setTimeout(() => {
                errorNotification.remove();
            }, 2000);
        }
    };

    const handleOpenEditModal = () => {
        setEditedSummary(summary);
        setShowEditModal(true);
    };

    const handleSaveEdit = () => {
        setSummary(editedSummary);
        setShowEditModal(false);
    };

    return (
        <>
            {/* Input Form */}
            <div className="space-y-4">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
                    <div className="flex items-center justify-between">
                        <label htmlFor="text" className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                            <DocumentArrowUpIcon className="h-5 w-5 text-gray-400" />
                            Nội dung cần tóm tắt
                        </label>
                        <div className="flex items-center gap-2">
                            <select
                                value={summaryType}
                                onChange={(e) => setSummaryType(e.target.value)}
                                className="text-sm border border-gray-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 min-w-[160px]"
                            >
                                <option value="concise">Tóm tắt ngắn gọn</option>
                                <option value="detailed">Tóm tắt chi tiết</option>
                                <option value="bullet">Tóm tắt điểm chính</option>
                            </select>
                            <select
                                value={selectedLanguage}
                                onChange={(e) => setSelectedLanguage(e.target.value)}
                                className="text-sm border border-gray-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 min-w-[140px]"
                            >
                                {SUPPORTED_LANGUAGES.filter(lang => lang.code !== 'auto').map((lang) => (
                                    <option key={lang.code} value={lang.code}>
                                        {lang.name}
                                    </option>
                                ))}
                            </select>
                            <button
                                onClick={() => setShowFileUpload(true)}
                                className="p-2 hover:bg-gray-50 rounded-full transition-colors duration-200"
                                data-tooltip-id="upload-tooltip"
                                data-tooltip-content="Tải lên file"
                            >
                                <FolderArrowDownIcon className="h-5 w-5 text-gray-500" />
                            </button>
                            {(inputText || files.length > 0) && (
                                <button
                                    onClick={handleClearText}
                                    className="p-2 hover:bg-red-50 rounded-full transition-colors duration-200"
                                    data-tooltip-id="clear-tooltip"
                                    data-tooltip-content="Xóa nội dung"
                                >
                                    <MdDelete className="h-5 w-5 text-red-500" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* File Upload Modal */}
                    {showFileUpload && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-bold text-gray-800">Tải lên file</h3>
                                    <button
                                        onClick={() => setShowFileUpload(false)}
                                        className="p-1 hover:bg-gray-100 rounded-full transition-colors duration-200"
                                    >
                                        <MdClose className="h-6 w-6 text-gray-500" />
                                    </button>
                                </div>
                                <div className="space-y-4">
                                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                                        <input
                                            type="file"
                                            multiple
                                            onChange={handleFileChange}
                                            className="hidden"
                                            id="file-upload"
                                            accept=".txt,.md,.json,image/*"
                                        />
                                        <label
                                            htmlFor="file-upload"
                                            className="cursor-pointer flex flex-col items-center gap-2"
                                        >
                                            <FolderArrowDownIcon className="h-12 w-12 text-gray-400" />
                                            <span className="text-gray-600">Kéo thả file vào đây hoặc click để chọn</span>
                                            <span className="text-sm text-gray-500">Hỗ trợ: .txt, .md, .json, hình ảnh</span>
                                        </label>
                                    </div>
                                    {files.length > 0 && (
                                        <div className="space-y-2">
                                            <h4 className="font-medium text-gray-700">File đã chọn:</h4>
                                            <div className="space-y-2">
                                                {files.map((file, index) => (
                                                    <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                                                        <div className="flex items-center gap-2">
                                                            {file.type.startsWith('image/') ? (
                                                                <div className="flex items-center gap-2">
                                                                    <img 
                                                                        src={imagePreviews[index]} 
                                                                        alt={file.name}
                                                                        className="w-8 h-8 object-cover rounded"
                                                                    />
                                                                    <PhotoIcon className="h-5 w-5 text-blue-500" />
                                                                </div>
                                                            ) : (
                                                                <DocumentArrowUpIcon className="h-5 w-5 text-gray-500" />
                                                            )}
                                                            <span className="text-sm text-gray-700">{file.name}</span>
                                                        </div>
                                                        <button
                                                            onClick={() => handleRemoveFile(index)}
                                                            className="p-1 hover:bg-red-50 rounded-full transition-colors duration-200"
                                                        >
                                                            <MdDelete className="h-5 w-5 text-red-500" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="relative">
                        <textarea
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onPaste={handlePaste}
                            placeholder="Nhập hoặc dán văn bản/ảnh cần tóm tắt vào đây..."
                            className="w-full h-[400px] p-4 text-base border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 resize-none bg-gray-50/50"
                            disabled={isLoading}
                        />
                        {files.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-2">
                                {files.map((file, index) => (
                                    file.type.startsWith('image/') && (
                                        <div key={index} className="relative group">
                                            <img 
                                                src={imagePreviews[index]} 
                                                alt={file.name}
                                                className="w-20 h-20 object-cover rounded-lg"
                                            />
                                            <button
                                                onClick={() => handleRemoveFile(index)}
                                                className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                            >
                                                <MdDelete className="h-4 w-4" />
                                            </button>
                                        </div>
                                    )
                                ))}
                            </div>
                        )}
                        {isLoading && (
                            <div className="absolute inset-0 bg-gray-50/80 flex items-center justify-center">
                                <div className="flex flex-col items-center gap-3">
                                    <div className="relative">
                                        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="w-6 h-6 border-2 border-primary/30 border-t-transparent rounded-full animate-spin"></div>
                                        </div>
                                    </div>
                                    <span className="text-primary font-medium">Đang xử lý...</span>
                                    {progress > 0 && (
                                        <div className="w-48 bg-gray-200 rounded-full h-2">
                                            <div
                                                className="bg-primary h-2 rounded-full transition-all duration-300"
                                                style={{ width: `${progress}%` }}
                                            ></div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={handleSummarize}
                        disabled={isLoading || (!inputText.trim() && files.length === 0)}
                        className={`w-full py-3 px-4 rounded-lg text-white font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                            isLoading || (!inputText.trim() && files.length === 0)
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-primary hover:bg-primary/90 shadow-sm hover:shadow-md'
                        }`}
                    >
                        {isLoading ? (
                            <span className="flex items-center gap-2">
                                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    />
                                </svg>
                                Đang xử lý...
                            </span>
                        ) : (
                            <>
                                Tóm tắt nội dung
                                <MdArrowDownward className="h-5 w-5" />
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Output */}
            <div ref={resultRef} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
                <div className="flex items-center justify-between">
                    <label htmlFor="text" className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                        <DocumentArrowUpIcon className="h-5 w-5 text-gray-400" />
                        Kết quả tóm tắt
                        {summary && (
                            <span className="text-xs text-gray-500">
                                ({getWordCount(summary)} từ)
                            </span>
                        )}
                    </label>
                    {summary && (
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleOpenEditModal}
                                className="flex items-center gap-2 text-gray-500 hover:text-primary transition-colors duration-200"
                                data-tooltip-id="edit-tooltip"
                                data-tooltip-content="Chỉnh sửa kết quả"
                            >
                                <MdEdit className="h-5 w-5" />
                                <span className="hidden sm:inline">Chỉnh sửa</span>
                            </button>
                            <button
                                onClick={() => copyToClipboard(summary)}
                                className="flex items-center gap-2 text-primary hover:text-primary/90 transition-colors duration-200"
                                data-tooltip-id="copy-tooltip"
                                data-tooltip-content="Sao chép vào clipboard"
                            >
                                <MdContentCopy className="h-5 w-5" />
                                <span className="hidden sm:inline">Sao chép</span>
                            </button>
                        </div>
                    )}
                </div>

                <div className="min-h-[400px] bg-gray-50/50 rounded-lg p-4">
                    {error ? (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
                            {error}
                        </div>
                    ) : fileSummaries.length > 0 ? (
                        <div className="space-y-6">
                            {fileSummaries.map((fileSummary, index) => (
                                <div key={index} className="border-b border-gray-200 pb-6 last:border-0">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-medium text-gray-800">{fileSummary.name}</h3>
                                        <button
                                            onClick={() => copyToClipboard(fileSummary.content)}
                                            className="flex items-center gap-2 text-primary hover:text-primary/90 transition-colors duration-200"
                                        >
                                            <MdContentCopy className="h-5 w-5" />
                                            <span className="hidden sm:inline">Sao chép</span>
                                        </button>
                                    </div>
                                    <article className="prose prose-lg max-w-none prose-headings:font-bold prose-h2:text-2xl prose-h2:mb-4 prose-p:text-base prose-ul:text-base">
                                        <ReactMarkdown>{fileSummary.content}</ReactMarkdown>
                                    </article>
                                </div>
                            ))}
                        </div>
                    ) : summary ? (
                        <article className="prose prose-lg max-w-none prose-headings:font-bold prose-h2:text-2xl prose-h2:mb-4 prose-p:text-base prose-ul:text-base">
                            <ReactMarkdown>{summary}</ReactMarkdown>
                        </article>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center p-4">
                            <div className="w-16 h-16 mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                                <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <p className="text-gray-500 mb-1">Chưa có nội dung tóm tắt</p>
                            <p className="text-sm text-gray-400">Nhập văn bản hoặc tải lên file và nhấn nút "Tóm tắt nội dung" để bắt đầu</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Tooltips */}
            <Tooltip id="clear-tooltip" />
            <Tooltip id="edit-tooltip" />
            <Tooltip id="copy-tooltip" />
            <Tooltip id="upload-tooltip" />

            {/* Edit Modal */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] flex flex-col">
                        <div className="flex items-center justify-between p-4 border-b border-gray-200">
                            <h3 className="text-lg font-bold text-gray-800">Chỉnh sửa tóm tắt</h3>
                            <button
                                onClick={() => setShowEditModal(false)}
                                className="p-1 hover:bg-gray-100 rounded-full transition-colors duration-200"
                            >
                                <MdClose className="h-6 w-6 text-gray-500" />
                            </button>
                        </div>

                        <div className="p-4 flex-1 overflow-auto">
                            <textarea
                                value={editedSummary}
                                onChange={(e) => setEditedSummary(e.target.value)}
                                className="w-full h-[400px] p-4 text-base border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 resize-none"
                                placeholder="Chỉnh sửa nội dung tóm tắt..."
                            />
                        </div>

                        <div className="p-4 border-t border-gray-200 flex justify-end gap-3">
                            <button
                                onClick={() => setShowEditModal(false)}
                                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleSaveEdit}
                                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors duration-200"
                            >
                                Lưu thay đổi
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
} 