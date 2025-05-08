'use client';

import React, { useState } from 'react';
import { Loader2, LineChart } from "lucide-react";
import { aiService } from '@/lib/ai-service';
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from 'react-markdown';

export default function StockAnalyzer() {
    const [stockSymbol, setStockSymbol] = useState('');
    const [loading, setLoading] = useState(false);
    const [analysis, setAnalysis] = useState<string | null>(null);
    const [stockHistory, setStockHistory] = useState<string[]>([]);
    const [analysisPeriod, setAnalysisPeriod] = useState<number>(30); // Default to 30 days
    const [sharesOwned, setSharesOwned] = useState<string>('');
    const { toast } = useToast();

    const analysisPeriods = [
        { value: 1, label: '1 ngày' },
        { value: 3, label: '3 ngày' },
        { value: 7, label: '7 ngày' },
        { value: 30, label: '30 ngày' },
        { value: 90, label: '90 ngày' },
        { value: 180, label: '180 ngày' },
        { value: 365, label: '1 năm' },
        { value: 0, label: 'Tất cả' },
    ];

    const analyzeStock = async () => {
        if (!stockSymbol.trim()) {
            toast({
                title: "Lỗi",
                description: "Vui lòng nhập mã chứng khoán",
                variant: "destructive",
            });
            return;
        }

        setLoading(true);
        try {
            const timeframeText = analysisPeriod === 0 
                ? "toàn bộ lịch sử" 
                : `${analysisPeriod} ngày gần đây`;
                
            const ownershipInfo = sharesOwned && parseInt(sharesOwned) > 0
                ? `\n\nNgười dùng hiện đang nắm giữ ${sharesOwned} cổ phiếu. Vui lòng đưa ra lời khuyên cụ thể cho trường hợp này, bao gồm chiến lược phù hợp (giữ/bán bớt/mua thêm) và ước tính giá trị danh mục.`
                : '';
                
            const prompt = `Phân tích chi tiết về mã chứng khoán ${stockSymbol.toUpperCase()} trong ${timeframeText} bao gồm:
1. Thông tin cơ bản về công ty
2. Tình hình tài chính gần đây
3. Xu hướng giá cổ phiếu trong ${timeframeText}
4. Đánh giá rủi ro
5. Lời khuyên đầu tư (nên mua/bán/giữ)

Hãy phân tích dựa trên dữ liệu thực tế và đưa ra lời khuyên khách quan. Trả về kết quả theo định dạng markdown.${ownershipInfo}`;

            const result = await aiService.processWithGoogleSearch(prompt);
            setAnalysis(result.text);
            
            // Add to history (only if not already there)
            if (!stockHistory.includes(stockSymbol.toUpperCase())) {
                setStockHistory(prev => {
                    const updatedHistory = [stockSymbol.toUpperCase(), ...prev];
                    return updatedHistory.slice(0, 10); // Keep only 10 entries
                });
            }
        } catch (error) {
            toast({
                title: "Lỗi",
                description: "Không thể phân tích mã chứng khoán. Vui lòng thử lại sau.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const resetHistory = () => {
        setStockHistory([]);
        setAnalysis(null);
    };

    const handleSharesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Allow only numbers
        const value = e.target.value.replace(/[^0-9]/g, '');
        setSharesOwned(value);
    };

    return (
        <div className="min-h-screen to-gray-50 py-8 px-4">
            <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                    <div className="p-8">
                        <div className="space-y-8">
                            <div className="text-center mb-8">
                                <h1 className="text-3xl font-bold text-gray-800 mb-2">📈 Phân Tích Chứng Khoán</h1>
                                <p className="text-gray-600">
                                    Nhập mã chứng khoán để nhận phân tích chi tiết và lời khuyên đầu tư
                                </p>
                            </div>

                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Mã chứng khoán</label>
                                        <input
                                            type="text"
                                            placeholder="Nhập mã chứng khoán (VD: VNM, FPT, VIC...)"
                                            value={stockSymbol}
                                            onChange={(e) => setStockSymbol(e.target.value.toUpperCase())}
                                            className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-sm focus:border-gray-400 focus:ring-2 focus:ring-gray-200 transition-all"
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Khoảng thời gian phân tích</label>
                                        <select
                                            value={analysisPeriod}
                                            onChange={(e) => setAnalysisPeriod(Number(e.target.value))}
                                            className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-sm focus:border-gray-400 focus:ring-2 focus:ring-gray-200 transition-all"
                                        >
                                            {analysisPeriods.map(period => (
                                                <option key={period.value} value={period.value}>
                                                    {period.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Số lượng cổ phiếu đang nắm giữ <span className="text-gray-500 text-xs">(không bắt buộc)</span>
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Nhập số lượng cổ phiếu bạn đang sở hữu"
                                        value={sharesOwned}
                                        onChange={handleSharesChange}
                                        className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-sm focus:border-gray-400 focus:ring-2 focus:ring-gray-200 transition-all"
                                    />
                                </div>
                                
                                <button
                                    onClick={analyzeStock}
                                    disabled={loading}
                                    className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl hover:from-gray-700 hover:to-gray-800 transition-all transform hover:scale-[1.02] disabled:opacity-70 disabled:hover:scale-100 shadow-lg"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            <span className="font-medium">Đang phân tích...</span>
                                        </>
                                    ) : (
                                        <>
                                            <LineChart className="w-5 h-5" />
                                            <span className="font-medium">Phân tích</span>
                                        </>
                                    )}
                                </button>
                            </div>

                            {(analysis !== null || loading) && (
                                <div className="mt-8">
                                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-8 rounded-xl border-2 border-gray-200 transition-all">
                                        <div className="flex flex-wrap items-center gap-2 mb-3">
                                            <p className="text-sm text-gray-600 font-medium">Kết quả phân tích</p>
                                            <span className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded-full">
                                                {analysisPeriod === 0 ? 'Tất cả' : `${analysisPeriod} ngày`}
                                            </span>
                                            {sharesOwned && parseInt(sharesOwned) > 0 && (
                                                <span className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded-full">
                                                    {sharesOwned} cổ phiếu
                                                </span>
                                            )}
                                        </div>
                                        
                                        {loading ? (
                                            <div className="text-center py-8">
                                                <Loader2 className="w-10 h-10 animate-spin mx-auto text-gray-500" />
                                                <p className="mt-4 text-gray-700">Đang tìm thông tin...</p>
                                            </div>
                                        ) : (
                                            <div className="prose prose-slate prose-headings:text-gray-800 prose-strong:text-gray-700 prose-a:text-gray-600 hover:prose-a:text-gray-800 max-w-none">
                                                <ReactMarkdown>{analysis || ''}</ReactMarkdown>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {stockHistory.length > 0 && (
                                <div className="mt-8">
                                    <div className="flex items-center justify-between mb-3">
                                        <p className="text-sm font-medium text-gray-700">📜 Lịch sử tìm kiếm</p>
                                        <button
                                            onClick={resetHistory}
                                            className="text-xs text-gray-500 hover:text-gray-800 transition-colors"
                                        >
                                            Xóa lịch sử
                                        </button>
                                    </div>

                                    <div className="bg-gray-50 rounded-xl border-2 border-gray-200 overflow-hidden">
                                        <div className="divide-y divide-gray-200">
                                            {stockHistory.map((symbol, index) => (
                                                <button 
                                                    key={index} 
                                                    className="p-4 text-sm hover:bg-gray-100 transition-colors w-full text-left"
                                                    onClick={() => {
                                                        setStockSymbol(symbol);
                                                        analyzeStock();
                                                    }}
                                                >
                                                    <p className="font-medium text-gray-800">{symbol}</p>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
} 