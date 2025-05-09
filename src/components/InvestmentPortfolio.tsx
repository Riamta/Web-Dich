'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
    ChartBarIcon,
    PlusIcon,
    TrashIcon,
    PencilIcon,
    ArrowUpIcon,
    ArrowDownIcon,
    Cog6ToothIcon,
    XMarkIcon,
    ArrowRightIcon,
    DocumentTextIcon,
    ArrowPathIcon,
    LightBulbIcon,
} from '@heroicons/react/24/outline';
import { LineChart, PieChart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { aiService } from '../lib/ai-service';

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
);

interface Investment {
    id: string;
    type: 'stock';
    symbol: string;
    purchasePrice: number;
    quantity: number;
    purchaseDate: string;
    notes?: string;
    transactions: InvestmentTransaction[];
    currentQuantity: number;
    currentPrice?: number;
    lastAnalysis?: {
        recommendation: 'buy' | 'sell' | 'hold';
        confidence: number;
        reasoning: string;
        timestamp: string;
    };
}

interface InvestmentTransaction {
    id: string;
    investmentId: string;
    transactionType: 'buy' | 'sell';
    price: number;
    quantity: number;
    date: string;
    notes?: string;
    investmentType: 'stock';
    symbol: string;
}

export default function InvestmentPortfolio() {
    const { user } = useAuth();
    const [investments, setInvestments] = useState<Investment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [editingInvestment, setEditingInvestment] = useState<Investment | null>(null);
    const [activeTab, setActiveTab] = useState<'overview' | 'history'>('overview');
    const [selectedInvestment, setSelectedInvestment] = useState<Investment | null>(null);
    const [showTransactionHistory, setShowTransactionHistory] = useState(false);
    const [showCharts, setShowCharts] = useState(true);
    const [filter, setFilter] = useState({
        type: 'all' as 'all' | 'stock',
        period: 'all' as 'all' | 'day' | 'month' | 'year',
        day: format(new Date(), 'yyyy-MM-dd'),
        month: format(new Date(), 'yyyy-MM'),
        year: format(new Date(), 'yyyy'),
    });

    const [formData, setFormData] = useState({
        type: 'stock',
        symbol: '',
        transactionType: 'buy' as 'buy' | 'sell',
        price: '',
        quantity: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        notes: '',
    });

    const [selectedPortfolioItem, setSelectedPortfolioItem] = useState<Investment | null>(null);
    const [showPortfolioHistory, setShowPortfolioHistory] = useState(false);
    const [updatingPrices, setUpdatingPrices] = useState<Record<string, boolean>>({});
    const [isUpdatingAll, setIsUpdatingAll] = useState(false);
    const [autoUpdateEnabled, setAutoUpdateEnabled] = useState(true);
    const [analyzingInvestment, setAnalyzingInvestment] = useState<string | null>(null);
    const [analyzingPortfolio, setAnalyzingPortfolio] = useState(false);
    const [portfolioAnalysis, setPortfolioAnalysis] = useState<{
        overview: string;
        rebalancingAdvice: string;
        detailedAdvice: {
            stocks: string;
        };
        timestamp: string;
    } | null>(null);

    // Load investments from localStorage on component mount
    useEffect(() => {
        const savedInvestments = localStorage.getItem('investments');
        if (savedInvestments) {
            setInvestments(JSON.parse(savedInvestments));
        }
        setLoading(false);
    }, []);

    // Save investments to localStorage whenever they change
    useEffect(() => {
        if (!loading) {
            localStorage.setItem('investments', JSON.stringify(investments));
        }
    }, [investments, loading]);

    // Auto update prices every 5 minutes
    useEffect(() => {
        if (!autoUpdateEnabled) return;

        const updatePrices = async () => {
            const portfolio = getCurrentPortfolio();
            const uniqueSymbols = Array.from(new Set(portfolio.map(item => item.symbol)));

            for (const symbol of uniqueSymbols) {
                const item = portfolio.find(p => p.symbol === symbol);
                if (item) {
                    await fetchCurrentPrice(symbol, item.type);
                }
            }
        };

        // Initial update
        updatePrices();

        // Set up interval
        const interval = setInterval(updatePrices, 5 * 60 * 1000); // 5 minutes

        return () => clearInterval(interval);
    }, [autoUpdateEnabled, investments]);

    // Function to analyze investment
    const analyzeInvestment = async (investment: Investment) => {
        try {
            setAnalyzingInvestment(investment.symbol);

            // Prepare investment data for analysis
            const analysisData = {
                symbol: investment.symbol,
                type: investment.type,
                currentPrice: investment.currentPrice,
                purchasePrice: investment.purchasePrice,
                quantity: investment.currentQuantity,
                transactions: investment.transactions.map(t => ({
                    type: t.transactionType,
                    price: t.price,
                    quantity: t.quantity,
                    date: t.date
                })),
                profitLoss: calculateProfitLoss(investment),
                profitLossPercentage: ((investment.currentPrice || 0) - investment.purchasePrice) / investment.purchasePrice * 100
            };

            // Get AI analysis
            const prompt = `You are a JSON API. Analyze this investment and return ONLY a JSON object, no other text.

Input data:
{
    "symbol": "${investment.symbol}",
    "type": "${investment.type === 'stock' ? 'Stock' : 'Cryptocurrency'}",
    "currentPrice": ${investment.currentPrice},
    "purchasePrice": ${investment.purchasePrice},
    "quantity": ${investment.currentQuantity},
    "profitLoss": ${calculateProfitLoss(investment)},
    "profitLossPercentage": ${((investment.currentPrice || 0) - investment.purchasePrice) / investment.purchasePrice * 100},
    "transactions": ${JSON.stringify(analysisData.transactions)}
}

Required JSON response format:
{
    "recommendation": "buy|sell|hold",
    "confidence": number between 0-100,
    "reasoning": "string explaining the recommendation in Vietnamese"
}

IMPORTANT: Return ONLY the JSON object, no other text or explanation. The reasoning field MUST be in Vietnamese language.`;

            const response = await aiService.processWithAI(prompt);

            // Extract JSON from response
            let analysis;
            try {
                // Try to find JSON in the response
                const jsonMatch = response.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    analysis = JSON.parse(jsonMatch[0]);
                } else {
                    throw new Error('No JSON found in response');
                }
            } catch (parseError) {
                console.error('Error parsing AI response:', parseError);
                // Fallback to default analysis
                analysis = {
                    recommendation: 'hold',
                    confidence: 50,
                    reasoning: 'Unable to analyze at this time. Please try again later.'
                };
            }

            // Validate analysis
            if (!['buy', 'sell', 'hold'].includes(analysis.recommendation)) {
                throw new Error('Invalid recommendation');
            }
            if (typeof analysis.confidence !== 'number' || isNaN(analysis.confidence) || analysis.confidence < 0 || analysis.confidence > 100) {
                throw new Error('Invalid confidence');
            }
            if (typeof analysis.reasoning !== 'string') {
                throw new Error('Invalid reasoning');
            }

            // Update investment with analysis
            const updatedInvestment: Investment = {
                ...investment,
                lastAnalysis: {
                    recommendation: analysis.recommendation as 'buy' | 'sell' | 'hold',
                    confidence: analysis.confidence,
                    reasoning: analysis.reasoning,
                    timestamp: new Date().toISOString()
                }
            };

            // Update state and force UI refresh
            setInvestments(prev => prev.map(inv =>
                inv.symbol === investment.symbol ? updatedInvestment : inv
            ));

            // Force modal refresh if it's open
            if (selectedInvestment?.symbol === investment.symbol) {
                setSelectedInvestment(updatedInvestment);
            }

        } catch (error) {
            console.error('Error analyzing investment:', error);
            // Set default analysis
            const defaultAnalysis = {
                recommendation: 'hold' as const,
                confidence: 50,
                reasoning: 'Không thể phân tích lúc này. Vui lòng thử lại sau.',
                timestamp: new Date().toISOString()
            };

            const updatedInvestment: Investment = {
                ...investment,
                lastAnalysis: defaultAnalysis
            };

            setInvestments(prev => prev.map(inv =>
                inv.symbol === investment.symbol ? updatedInvestment : inv
            ));

            // Force modal refresh if it's open
            if (selectedInvestment?.symbol === investment.symbol) {
                setSelectedInvestment(updatedInvestment);
            }
        } finally {
            setAnalyzingInvestment(null);
        }
    };

    // Auto analyze investments when prices are updated
    useEffect(() => {
        const portfolio = getCurrentPortfolio();
        portfolio.forEach(investment => {
            if (investment.currentPrice && (!investment.lastAnalysis ||
                new Date().getTime() - new Date(investment.lastAnalysis.timestamp).getTime() > 30 * 60 * 1000)) {
                analyzeInvestment(investment);
            }
        });
    }, [investments]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Function to get current portfolio holdings
    const getCurrentPortfolio = () => {
        const portfolioMap = new Map<string, Investment>();

        investments.forEach(inv => {
            const existing = portfolioMap.get(inv.symbol);
            if (existing) {
                // Update existing holding
                existing.currentQuantity += inv.quantity;
                existing.transactions.push(...inv.transactions);
            } else {
                // Add new holding
                portfolioMap.set(inv.symbol, {
                    ...inv,
                    currentQuantity: inv.quantity,
                    transactions: [...inv.transactions]
                });
            }
        });

        return Array.from(portfolioMap.values());
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const newTransaction: InvestmentTransaction = {
            id: Date.now().toString(),
            investmentId: editingInvestment?.id || Date.now().toString(),
            transactionType: formData.transactionType,
            price: parseFloat(formData.price),
            quantity: parseFloat(formData.quantity),
            date: formData.date,
            notes: formData.notes,
            investmentType: 'stock',
            symbol: formData.symbol.toUpperCase()
        };

        const existingInvestment = investments.find(inv =>
            inv.symbol === formData.symbol.toUpperCase() &&
            inv.type === 'stock'
        );

        if (formData.transactionType === 'sell') {
            if (!existingInvestment) {
                alert('Không tìm thấy khoản đầu tư này để bán!');
                return;
            }

            const currentQuantity = existingInvestment.currentQuantity;
            if (currentQuantity < parseFloat(formData.quantity)) {
                alert(`Số lượng không đủ để bán! Số lượng hiện có: ${currentQuantity}`);
                return;
            }
        }

        if (existingInvestment) {
            // Update existing investment
            setInvestments(prev => prev.map(inv => {
                if (inv.id === existingInvestment.id) {
                    return {
                        ...inv,
                        quantity: formData.transactionType === 'buy'
                            ? inv.quantity + parseFloat(formData.quantity)
                            : inv.quantity - parseFloat(formData.quantity),
                        transactions: [...inv.transactions, newTransaction]
                    };
                }
                return inv;
            }));
        } else {
            if (formData.transactionType === 'sell') {
                alert('Không thể bán khi chưa có khoản đầu tư này!');
                return;
            }
            // Create new investment
            const newInvestment: Investment = {
                id: Date.now().toString(),
                type: 'stock',
                symbol: formData.symbol.toUpperCase(),
                purchasePrice: parseFloat(formData.price),
                quantity: parseFloat(formData.quantity),
                purchaseDate: formData.date,
                notes: formData.notes,
                transactions: [newTransaction],
                currentQuantity: parseFloat(formData.quantity)
            };
            setInvestments(prev => [...prev, newInvestment]);
        }

        // Reset form
        setFormData({
            type: 'stock',
            symbol: '',
            transactionType: 'buy',
            price: '',
            quantity: '',
            date: format(new Date(), 'yyyy-MM-dd'),
            notes: '',
        });
        setShowAddForm(false);
        setEditingInvestment(null);
    };

    const handleDelete = (id: string) => {
        if (confirm('Bạn có chắc chắn muốn xóa khoản đầu tư này?')) {
            setInvestments(prev => prev.filter(inv => inv.id !== id));
        }
    };

    const handleEdit = (investment: Investment) => {
        setEditingInvestment(investment);
        setFormData({
            type: 'stock',
            symbol: investment.symbol,
            transactionType: 'buy',
            price: investment.purchasePrice.toString(),
            quantity: investment.quantity.toString(),
            date: investment.purchaseDate,
            notes: investment.notes || '',
        });
        setShowAddForm(true);
    };

    const calculateTotalValue = (type: 'stock' | 'crypto' | 'all') => {
        return getCurrentPortfolio()
            .filter(inv => type === 'all' || inv.type === type)
            .reduce((total, inv) => total + calculateCurrentValue(inv), 0);
    };

    const calculateTotalProfitLoss = (type: 'stock' | 'crypto' | 'all') => {
        return getCurrentPortfolio()
            .filter(inv => type === 'all' || inv.type === type)
            .reduce((total, inv) => total + calculateProfitLoss(inv), 0);
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            maximumFractionDigits: 0
        }).format(amount);
    };

    const filteredInvestments = investments.filter(investment => {
        if (filter.type !== 'all' && investment.type !== filter.type) {
            return false;
        }
        if (filter.period !== 'all') {
            const investmentDate = new Date(investment.purchaseDate);
            switch (filter.period) {
                case 'day':
                    return format(investmentDate, 'yyyy-MM-dd') === filter.day;
                case 'month':
                    return format(investmentDate, 'yyyy-MM') === filter.month;
                case 'year':
                    return format(investmentDate, 'yyyy') === filter.year;
                default:
                    return true;
            }
        }
        return true;
    });

    const getInvestmentHistory = (investment: Investment) => {
        return investment.transactions || [];
    };

    // Add sell transaction function
    const handleSell = (investment: Investment, quantity: number, price: number, date: string, notes?: string) => {
        const sellTransaction: InvestmentTransaction = {
            id: Date.now().toString(),
            investmentId: investment.id,
            transactionType: 'sell',
            price,
            quantity,
            date,
            notes,
            investmentType: 'stock',
            symbol: investment.symbol
        };

        setInvestments(prev => prev.map(inv => {
            if (inv.id === investment.id) {
                return {
                    ...inv,
                    quantity: inv.quantity - quantity,
                    transactions: [...inv.transactions, sellTransaction]
                };
            }
            return inv;
        }));
    };

    // Add function to fetch current price
    const fetchCurrentPrice = async (symbol: string, type: 'stock' | 'crypto') => {
        try {
            setUpdatingPrices(prev => ({ ...prev, [symbol]: true }));

            let price: number | null = null;

            if (type === 'stock') {
                // Fetch stock price from API
                const response = await fetch(`https://vnstock-t4km.onrender.com/api/stock/intraday/${symbol}?page_size=1`);
                const data = await response.json();

                if (data && data.length > 0 && typeof data[0].price === 'number') {
                    price = data[0].price * 1000; // Convert to correct format (e.g., 23.4 -> 23,400)
                }
            } else {
                // Use AI service for crypto prices
                const prompt = `Tìm giá hiện tại của tiền điện tử ${symbol}. Chỉ trả về một object JSON duy nhất theo format: {"price": "20.000"} với giá theo định dạng tiền Việt Nam. KHÔNG thêm bất kỳ text nào khác.`;

                const response = await aiService.processWithGoogleSearch(prompt);
                console.log(response);

                try {
                    // Try parsing as JSON first
                    const data = JSON.parse(response.text);
                    if (data && typeof data.price === 'string') {
                        price = parseFloat(data.price.replace(/\./g, ''));
                    }
                } catch (parseError) {
                    console.log('JSON parse failed, trying to extract price from text');
                    // Fallback: Try to extract price from text
                    const priceMatch = response.text.match(/\d{1,3}(\.\d{3})*/);
                    if (priceMatch) {
                        price = parseFloat(priceMatch[0].replace(/\./g, ''));
                    }
                }
            }

            if (price !== null) {
                // Update investment with new price
                setInvestments(prev => prev.map(inv => {
                    if (inv.symbol === symbol) {
                        return {
                            ...inv,
                            currentPrice: price
                        };
                    }
                    return inv;
                }));
            } else {
                console.error('Could not extract price from response');
            }
        } catch (error) {
            console.error('Error fetching price:', error);
        } finally {
            setUpdatingPrices(prev => ({ ...prev, [symbol]: false }));
        }
    };

    // Add function to calculate current value
    const calculateCurrentValue = (investment: Investment) => {
        if (investment.currentPrice) {
            return investment.currentPrice * investment.currentQuantity;
        }
        return investment.purchasePrice * investment.currentQuantity;
    };

    // Add function to calculate profit/loss
    const calculateProfitLoss = (investment: Investment) => {
        if (!investment.currentPrice) return 0;
        const currentValue = investment.currentPrice * investment.currentQuantity;
        const purchaseValue = investment.purchasePrice * investment.currentQuantity;
        return currentValue - purchaseValue;
    };

    // Add function to update all prices
    const updateAllPrices = async () => {
        try {
            setIsUpdatingAll(true);
            const portfolio = getCurrentPortfolio();

            // Update prices for all unique symbols
            const uniqueSymbols = new Set(portfolio.map(item => item.symbol));
            const updatePromises = Array.from(uniqueSymbols).map(async (symbol) => {
                const item = portfolio.find(p => p.symbol === symbol);
                if (item) {
                    await fetchCurrentPrice(symbol, 'stock');
                }
            });

            await Promise.all(updatePromises);
        } catch (error) {
            console.error('Error updating all prices:', error);
        } finally {
            setIsUpdatingAll(false);
        }
    };

    // Function to analyze entire portfolio
    const analyzePortfolio = async () => {
        try {
            setAnalyzingPortfolio(true);

            // Prepare portfolio data for analysis
            const portfolioData = {
                totalValue: calculateTotalValue('all'),
                stockValue: calculateTotalValue('stock'),
                totalProfitLoss: calculateTotalProfitLoss('all'),
                stockProfitLoss: calculateTotalProfitLoss('stock'),
                investments: getCurrentPortfolio().map(inv => ({
                    symbol: inv.symbol,
                    type: inv.type,
                    value: calculateCurrentValue(inv),
                    profitLoss: calculateProfitLoss(inv),
                    percentage: (calculateCurrentValue(inv) / calculateTotalValue('all')) * 100
                }))
            };

            // Get AI analysis
            const prompt = `You are a JSON API. Analyze this investment portfolio and return ONLY a JSON object, no other text.

Input data:
{
    "totalValue": ${portfolioData.totalValue},
    "stockValue": ${portfolioData.stockValue},
    "totalProfitLoss": ${portfolioData.totalProfitLoss},
    "stockProfitLoss": ${portfolioData.stockProfitLoss},
    "investments": ${JSON.stringify(portfolioData.investments)}
}

Required JSON response format:
{
    "overview": "string - Tổng quan về danh mục đầu tư bằng tiếng Việt",
    "rebalancingAdvice": "string - Lời khuyên tái cân bằng danh mục bằng tiếng Việt",
    "detailedAdvice": {
        "stocks": "string - Lời khuyên chi tiết cho phần chứng khoán bằng tiếng Việt"
    }
}

IMPORTANT: Return ONLY the JSON object, no other text or explanation. All text fields MUST be in Vietnamese language.`;

            const response = await aiService.processWithAI(prompt);

            // Extract JSON from response
            let analysis;
            try {
                const jsonMatch = response.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    analysis = JSON.parse(jsonMatch[0]);
                } else {
                    throw new Error('No JSON found in response');
                }
            } catch (parseError) {
                console.error('Error parsing AI response:', parseError);
                throw new Error('Failed to parse AI response');
            }

            // Update state with analysis
            setPortfolioAnalysis({
                ...analysis,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Error analyzing portfolio:', error);
            // Set default analysis
            setPortfolioAnalysis({
                overview: 'Không thể phân tích danh mục lúc này. Vui lòng thử lại sau.',
                rebalancingAdvice: 'Không thể đưa ra lời khuyên tái cân bằng lúc này.',
                detailedAdvice: {
                    stocks: 'Không thể phân tích phần chứng khoán lúc này.'
                },
                timestamp: new Date().toISOString()
            });
        } finally {
            setAnalyzingPortfolio(false);
        }
    };

    // Auto analyze portfolio when investments change
    useEffect(() => {
        if (investments.length > 0 && (!portfolioAnalysis ||
            new Date().getTime() - new Date(portfolioAnalysis.timestamp).getTime() > 30 * 60 * 1000)) {
            analyzePortfolio();
        }
    }, [investments]);

    return (
        <div className="bg-white border border-gray-200 rounded-lg sm:rounded-xl shadow-sm overflow-hidden max-w-5xl mx-auto mt-2 sm:mt-6 mb-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-6 border-b border-gray-200 gap-3 sm:gap-4">
                <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-black flex items-center justify-center">
                        <LineChart className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-base sm:text-xl font-semibold">Quản lý đầu tư</h1>
                        <p className="text-xs sm:text-sm text-gray-500">Theo dõi danh mục đầu tư của bạn</p>
                    </div>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <button
                        onClick={() => setAutoUpdateEnabled(!autoUpdateEnabled)}
                        className={`flex-1 sm:flex-none flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 text-xs sm:text-sm ${autoUpdateEnabled
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            } rounded-lg transition-colors`}
                    >
                        <ArrowPathIcon className={`h-4 w-4 ${autoUpdateEnabled ? 'animate-spin' : ''}`} />
                        <span className="sm:hidden">
                            {autoUpdateEnabled ? 'Đang cập nhật' : 'Tắt cập nhật'}
                        </span>
                    </button>
                    <button
                        onClick={updateAllPrices}
                        disabled={isUpdatingAll}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 text-xs sm:text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                    >
                        <ArrowPathIcon className={`h-4 w-4 ${isUpdatingAll ? 'animate-spin' : ''}`} />
                        <span className="hidden sm:inline">Cập nhật giá</span>
                        <span className="sm:hidden">Cập nhật</span>
                    </button>
                    <button
                        onClick={() => setShowSettings(true)}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 text-xs sm:text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                        <Cog6ToothIcon className="h-4 w-4" />
                        <span className="hidden sm:inline">Cài đặt</span>
                    </button>
                    <button
                        onClick={() => setShowAddForm(true)}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 text-xs sm:text-sm bg-black text-white rounded-lg hover:bg-gray-900 transition-colors"
                    >
                        <PlusIcon className="h-4 w-4" />
                        <span className="hidden sm:inline">Thêm giao dịch</span>
                        <span className="sm:hidden">Thêm</span>
                    </button>
                </div>
            </div>

            <div className="flex border-b border-gray-200">
                <button
                    className={`flex-1 px-3 sm:px-4 py-2 sm:py-3 font-medium text-xs sm:text-sm transition-colors ${activeTab === 'overview'
                        ? 'border-b-2 border-gray-900 text-gray-900'
                        : 'text-gray-500 hover:text-gray-900'
                        }`}
                    onClick={() => setActiveTab('overview')}
                >
                    Tổng quan
                </button>
                <button
                    className={`flex-1 px-3 sm:px-4 py-2 sm:py-3 font-medium text-xs sm:text-sm transition-colors ${activeTab === 'history'
                        ? 'border-b-2 border-gray-900 text-gray-900'
                        : 'text-gray-500 hover:text-gray-900'
                        }`}
                    onClick={() => setActiveTab('history')}
                >
                    Lịch sử giao dịch
                </button>
            </div>

            <div className="p-3 sm:p-6">
                {activeTab === 'overview' ? (
                    <div>
                        {/* Summary Cards Section */}
                        <div className="py-3 px-2 sm:p-6 border-b border-gray-200">
                            <div className="grid grid-cols-1 gap-2 mb-4">
                                <div className="w-full flex items-center gap-2">
                                    <span className="text-xs text-gray-500 whitespace-nowrap">Loại:</span>
                                    <select
                                        value={filter.type}
                                        onChange={(e) => setFilter(prev => ({ ...prev, type: e.target.value as 'all' | 'stock' }))}
                                        className="flex-1 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-black"
                                    >
                                        <option value="all">Tất cả</option>
                                        <option value="stock">Chứng khoán</option>
                                    </select>
                                </div>

                                <div className="w-full flex flex-col sm:flex-row sm:items-center gap-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-gray-500 whitespace-nowrap">Thời gian:</span>
                                        <div className="flex flex-wrap gap-1">
                                            <button
                                                className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors ${filter.period === 'all'
                                                    ? 'bg-black text-white'
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                    }`}
                                                onClick={() => setFilter(prev => ({ ...prev, period: 'all' }))}
                                            >
                                                Tất cả
                                            </button>
                                            <button
                                                className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors ${filter.period === 'day'
                                                    ? 'bg-black text-white'
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                    }`}
                                                onClick={() => setFilter(prev => ({ ...prev, period: 'day' }))}
                                            >
                                                Ngày
                                            </button>
                                            <button
                                                className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors ${filter.period === 'month'
                                                    ? 'bg-black text-white'
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                    }`}
                                                onClick={() => setFilter(prev => ({ ...prev, period: 'month' }))}
                                            >
                                                Tháng
                                            </button>
                                            <button
                                                className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors ${filter.period === 'year'
                                                    ? 'bg-black text-white'
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                    }`}
                                                onClick={() => setFilter(prev => ({ ...prev, period: 'year' }))}
                                            >
                                                Năm
                                            </button>
                                        </div>
                                    </div>

                                    {filter.period !== 'all' && (
                                        <div className="w-full sm:w-auto flex items-center gap-2 mt-2 sm:mt-0">
                                            {filter.period === 'day' && (
                                                <input
                                                    type="date"
                                                    value={filter.day}
                                                    onChange={(e) => setFilter(prev => ({ ...prev, day: e.target.value }))}
                                                    className="flex-1 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-black"
                                                />
                                            )}
                                            {filter.period === 'month' && (
                                                <input
                                                    type="month"
                                                    value={filter.month}
                                                    onChange={(e) => setFilter(prev => ({ ...prev, month: e.target.value }))}
                                                    className="flex-1 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-black"
                                                />
                                            )}
                                            {filter.period === 'year' && (
                                                <input
                                                    type="number"
                                                    value={filter.year}
                                                    onChange={(e) => setFilter(prev => ({ ...prev, year: e.target.value }))}
                                                    min="2000"
                                                    max="2100"
                                                    className="flex-1 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-black"
                                                    placeholder="Năm"
                                                />
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">
                                <div className="p-3 sm:p-4 bg-gray-50 rounded-lg sm:rounded-xl">
                                    <p className="text-xs text-gray-500">Tổng giá trị</p>
                                    <p className="text-base sm:text-2xl font-semibold truncate text-gray-900">
                                        {formatCurrency(calculateTotalValue('all'))}
                                    </p>
                                </div>
                                <div className="p-3 sm:p-4 bg-gray-50 rounded-lg sm:rounded-xl">
                                    <p className="text-xs text-gray-500">Chứng khoán</p>
                                    <p className="text-base sm:text-2xl font-semibold truncate text-blue-600">
                                        {formatCurrency(calculateTotalValue('stock'))}
                                    </p>
                                </div>
                                <div className="p-3 sm:p-4 bg-gray-50 rounded-lg sm:rounded-xl">
                                    <p className="text-xs text-gray-500">Số khoản đầu tư</p>
                                    <p className="text-base sm:text-2xl font-semibold truncate">{filteredInvestments.length}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4 mt-2 sm:mt-4">
                                <div className="p-3 sm:p-4 bg-gray-50 rounded-lg sm:rounded-xl">
                                    <p className="text-xs text-gray-500">Tổng lãi/lỗ</p>
                                    <p className={`text-base sm:text-2xl font-semibold truncate ${calculateTotalProfitLoss('all') >= 0 ? 'text-green-600' : 'text-red-600'
                                        }`}>
                                        {calculateTotalProfitLoss('all') >= 0 ? '+' : ''}{formatCurrency(calculateTotalProfitLoss('all'))}
                                    </p>
                                </div>
                                <div className="p-3 sm:p-4 bg-gray-50 rounded-lg sm:rounded-xl">
                                    <p className="text-xs text-gray-500">Lãi/lỗ CK</p>
                                    <p className={`text-base sm:text-2xl font-semibold truncate ${calculateTotalProfitLoss('stock') >= 0 ? 'text-green-600' : 'text-red-600'
                                        }`}>
                                        {calculateTotalProfitLoss('stock') >= 0 ? '+' : ''}{formatCurrency(calculateTotalProfitLoss('stock'))}
                                    </p>
                                </div>
                                <div className="p-3 sm:p-4 bg-gray-50 rounded-lg sm:rounded-xl">
                                    <p className="text-xs text-gray-500">Tỷ lệ lãi/lỗ</p>
                                    <p className={`text-base sm:text-2xl font-semibold truncate ${calculateTotalProfitLoss('all') >= 0 ? 'text-green-600' : 'text-red-600'
                                        }`}>
                                        {(() => {
                                            const totalValue = calculateTotalValue('all');
                                            const totalProfitLoss = calculateTotalProfitLoss('all');
                                            if (totalValue === 0) return '0%';
                                            const percentage = (totalProfitLoss / (totalValue - totalProfitLoss)) * 100;
                                            return `${percentage >= 0 ? '+' : ''}${percentage.toFixed(2)}%`;
                                        })()}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Portfolio Analysis Section */}
                        <div className="border-t border-gray-200">
                            <div className="p-3 sm:p-5">
                                <div className="flex items-center justify-between mb-3 sm:mb-4">
                                    <h2 className="text-sm sm:text-base font-semibold text-gray-900">
                                        Phân tích danh mục
                                    </h2>
                                    <button
                                        onClick={analyzePortfolio}
                                        disabled={analyzingPortfolio}
                                        className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                                    >
                                        <LightBulbIcon className={`h-3.5 w-3.5 ${analyzingPortfolio ? 'animate-pulse' : ''}`} />
                                        {analyzingPortfolio ? 'Đang phân tích...' : 'Phân tích lại'}
                                    </button>
                                </div>

                                {portfolioAnalysis ? (
                                    <div className="space-y-4">
                                        {/* Overview */}
                                        <div className="p-4 bg-gray-50 rounded-lg">
                                            <h3 className="text-sm font-medium text-gray-900 mb-2">Tổng quan</h3>
                                            <p className="text-sm text-gray-700">
                                                {portfolioAnalysis.overview}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-2">
                                                Cập nhật lúc: {format(new Date(portfolioAnalysis.timestamp), 'dd/MM/yyyy HH:mm')}
                                            </p>
                                        </div>

                                        {/* Rebalancing Advice */}
                                        <div className="p-4 bg-gray-50 rounded-lg">
                                            <h3 className="text-sm font-medium text-gray-900 mb-2">Lời khuyên tái cân bằng</h3>
                                            <p className="text-sm text-gray-700">
                                                {portfolioAnalysis.rebalancingAdvice}
                                            </p>
                                        </div>

                                        {/* Detailed Advice */}
                                        <div className="p-4 bg-gray-50 rounded-lg">
                                            <h3 className="text-sm font-medium text-gray-900 mb-2">Chứng khoán</h3>
                                            <p className="text-sm text-gray-700">
                                                {portfolioAnalysis.detailedAdvice.stocks}
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-4 bg-gray-50 rounded-lg text-center">
                                        <p className="text-sm text-gray-500">
                                            Chưa có phân tích. Nhấn nút "Phân tích lại" để nhận lời khuyên.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Recent Investments */}
                        <div className="border-t border-gray-200">
                            <div className="p-3 sm:p-5">
                                <div className="flex items-center justify-between mb-3 sm:mb-4">
                                    <h2 className="text-sm sm:text-base font-semibold text-gray-900">
                                        Danh mục đầu tư
                                        <span className="text-xs sm:text-sm font-normal text-gray-600 ml-1">
                                            ({Math.min(investments.length, 10)} khoản)
                                        </span>
                                    </h2>
                                    <span className="text-xs sm:text-sm text-gray-600">
                                        {format(new Date(), 'MMMM yyyy', { locale: vi })}
                                    </span>
                                </div>

                                {filteredInvestments.length > 0 ? (
                                    <div className="space-y-2">
                                        {filteredInvestments.slice(0, 10).map((inv) => (
                                            <div
                                                key={inv.id}
                                                className="group flex items-center gap-3 sm:gap-4 p-2 sm:p-3 rounded-lg hover:bg-gray-100 transition-all duration-200 cursor-pointer"
                                                onClick={() => {
                                                    setSelectedInvestment(inv);
                                                    setShowTransactionHistory(true);
                                                }}
                                            >
                                                <div
                                                    className={`p-2 sm:p-2.5 rounded-lg ${inv.type === 'stock'
                                                        ? 'bg-blue-100 border border-blue-200'
                                                        : 'bg-purple-100 border border-purple-200'
                                                        }`}
                                                >
                                                    {inv.type === 'stock' ? (
                                                        <LineChart className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                                                    ) : (
                                                        <PieChart className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                                                    )}
                                                </div>

                                                <div className="flex-1 flex items-center justify-between min-w-0">
                                                    <div className="space-y-0.5 sm:space-y-1 truncate pr-2">
                                                        <h3 className="text-xs sm:text-sm font-medium text-gray-900">
                                                            {inv.symbol}
                                                        </h3>
                                                        <p className="text-[10px] sm:text-xs text-gray-600 truncate">
                                                            {inv.notes || 'Không có ghi chú'} • {format(new Date(inv.purchaseDate), 'dd/MM/yyyy')}
                                                        </p>
                                                    </div>

                                                    <div className="flex items-center gap-1 sm:gap-2 pl-1 sm:pl-3">
                                                        <div className="text-right">
                                                            <div className="flex items-center gap-1">
                                                                <span className="text-xs sm:text-sm font-medium text-gray-900">
                                                                    {formatCurrency(inv.purchasePrice * inv.quantity)}
                                                                </span>
                                                                {inv.currentPrice && (
                                                                    <span className="text-[10px] sm:text-xs text-gray-500">
                                                                        → {formatCurrency(inv.currentPrice * inv.quantity)}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {inv.currentPrice && (
                                                                <div className="flex items-center gap-1">
                                                                    <span className={`text-[10px] sm:text-xs font-medium ${calculateProfitLoss(inv) >= 0 ? 'text-green-600' : 'text-red-600'
                                                                        }`}>
                                                                        {calculateProfitLoss(inv) >= 0 ? '+' : ''}{formatCurrency(calculateProfitLoss(inv))}
                                                                    </span>
                                                                    <span className={`text-[10px] sm:text-xs font-medium ${calculateProfitLoss(inv) >= 0 ? 'text-green-600' : 'text-red-600'
                                                                        }`}>
                                                                        ({(() => {
                                                                            const percentage = ((inv.currentPrice - inv.purchasePrice) / inv.purchasePrice) * 100;
                                                                            return `${percentage >= 0 ? '+' : ''}${percentage.toFixed(2)}%`;
                                                                        })()})
                                                                    </span>
                                                                </div>
                                                            )}
                                                            {inv.currentPrice && (
                                                                <div className="text-[10px] sm:text-xs text-gray-500">
                                                                    Giá: {formatCurrency(inv.purchasePrice)} → {formatCurrency(inv.currentPrice)}
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className="flex items-center sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    fetchCurrentPrice(inv.symbol, 'stock');
                                                                }}
                                                                disabled={updatingPrices[inv.symbol]}
                                                                className="p-1 sm:p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-full transition-colors"
                                                            >
                                                                <ArrowPathIcon className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${updatingPrices[inv.symbol] ? 'animate-spin' : ''}`} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 sm:py-10">
                                        <DocumentTextIcon className="h-10 w-10 sm:h-14 sm:w-14 mx-auto text-gray-300" />
                                        <p className="mt-2 text-gray-500 text-sm sm:text-base">Chưa có khoản đầu tư nào.</p>
                                    </div>
                                )}
                            </div>

                            {investments.length > 10 && (
                                <div className="p-3 border-t border-gray-100">
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('history')}
                                        className="w-full flex items-center justify-center gap-2 py-2 sm:py-2.5 px-3 sm:px-4 rounded-lg text-xs sm:text-sm font-medium 
                                        bg-gradient-to-r from-black to-gray-800 text-white
                                        hover:from-gray-800 hover:to-gray-700
                                        shadow-sm hover:shadow transform transition-all duration-200
                                        active:translate-y-0.5
                                        focus:outline-none focus:ring-2 focus:ring-gray-500"
                                    >
                                        <span>Xem tất cả đầu tư</span>
                                        <ArrowRightIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div>
                        {/* Investment History Tab */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-semibold">Lịch sử giao dịch</h2>
                                <div className="flex items-center gap-2">
                                    <select
                                        value={filter.type}
                                        onChange={(e) => setFilter(prev => ({ ...prev, type: e.target.value as 'all' | 'stock' }))}
                                        className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-black"
                                    >
                                        <option value="all">Tất cả loại</option>
                                        <option value="stock">Chứng khoán</option>
                                    </select>
                                    <select
                                        value={filter.period}
                                        onChange={(e) => setFilter(prev => ({ ...prev, period: e.target.value as 'all' | 'day' | 'month' | 'year' }))}
                                        className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-black"
                                    >
                                        <option value="all">Tất cả thời gian</option>
                                        <option value="day">Hôm nay</option>
                                        <option value="month">Tháng này</option>
                                        <option value="year">Năm nay</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {investments.length > 0 ? (
                                    investments
                                        .filter(inv => filter.type === 'all' || inv.type === filter.type)
                                        .flatMap(inv =>
                                            inv.transactions
                                                .filter(trans => {
                                                    if (filter.period === 'all') return true;
                                                    const transDate = new Date(trans.date);
                                                    const now = new Date();
                                                    switch (filter.period) {
                                                        case 'day':
                                                            return format(transDate, 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd');
                                                        case 'month':
                                                            return format(transDate, 'yyyy-MM') === format(now, 'yyyy-MM');
                                                        case 'year':
                                                            return format(transDate, 'yyyy') === format(now, 'yyyy');
                                                        default:
                                                            return true;
                                                    }
                                                })
                                                .map(trans => ({
                                                    ...trans,
                                                    investmentType: inv.type,
                                                    symbol: inv.symbol
                                                }))
                                        )
                                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                        .map((transaction) => (
                                            <div
                                                key={transaction.id}
                                                className="flex items-center gap-4 p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                                            >
                                                <div
                                                    className={`p-2.5 rounded-lg ${transaction.transactionType === 'buy'
                                                        ? 'bg-green-100 border border-green-200'
                                                        : 'bg-red-100 border border-red-200'
                                                        }`}
                                                >
                                                    {transaction.transactionType === 'buy' ? (
                                                        <ArrowDownIcon className="w-5 h-5 text-green-600" />
                                                    ) : (
                                                        <ArrowUpIcon className="w-5 h-5 text-red-600" />
                                                    )}
                                                </div>

                                                <div className="flex-1">
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <h3 className="text-sm font-medium text-gray-900">
                                                                {transaction.transactionType === 'buy' ? 'Mua' : 'Bán'} {transaction.quantity} {transaction.investmentType === 'stock' ? 'cổ phiếu' : 'coin'} {transaction.symbol}
                                                            </h3>
                                                            <p className="text-xs text-gray-600 mt-1">
                                                                {format(new Date(transaction.date), 'dd/MM/yyyy HH:mm')}
                                                            </p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-sm font-medium text-gray-900">
                                                                {formatCurrency(transaction.price * transaction.quantity)}
                                                            </p>
                                                            <p className="text-xs text-gray-600">
                                                                Giá: {formatCurrency(transaction.price)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    {transaction.notes && (
                                                        <p className="text-xs text-gray-600 mt-2">
                                                            {transaction.notes}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                ) : (
                                    <div className="text-center py-8">
                                        <DocumentTextIcon className="h-10 w-10 mx-auto text-gray-300" />
                                        <p className="mt-2 text-gray-500">Chưa có giao dịch nào.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Transaction History Modal */}
                {showTransactionHistory && selectedInvestment && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-lg">
                            <div className="flex items-center justify-between p-4 border-b border-gray-100">
                                <div>
                                    <h2 className="text-lg font-semibold">
                                        {selectedInvestment.symbol}
                                    </h2>
                                    <p className="text-sm text-gray-600">
                                        {selectedInvestment.type === 'stock' ? 'Chứng khoán' : 'Tiền điện tử'}
                                    </p>
                                </div>
                                <button
                                    onClick={() => {
                                        setShowTransactionHistory(false);
                                        setSelectedInvestment(null);
                                    }}
                                    className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                                >
                                    <XMarkIcon className="h-5 w-5 text-gray-500" />
                                </button>
                            </div>

                            <div className="p-4">
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                                    <div className="p-3 bg-gray-50 rounded-lg">
                                        <p className="text-xs text-gray-500">Giá trị đầu tư</p>
                                        <div className="space-y-1">
                                            <p className="text-sm text-gray-600">
                                                Mua: {formatCurrency(selectedInvestment.purchasePrice * selectedInvestment.quantity)}
                                            </p>
                                            {selectedInvestment.currentPrice && (
                                                <p className="text-sm text-gray-900">
                                                    Hiện tại: {formatCurrency(selectedInvestment.currentPrice * selectedInvestment.quantity)}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="p-3 bg-gray-50 rounded-lg">
                                        <p className="text-xs text-gray-500">Lãi/lỗ</p>
                                        <p className={`text-lg font-semibold ${calculateProfitLoss(selectedInvestment) >= 0 ? 'text-green-600' : 'text-red-600'
                                            }`}>
                                            {calculateProfitLoss(selectedInvestment) >= 0 ? '+' : ''}{formatCurrency(calculateProfitLoss(selectedInvestment))}
                                        </p>
                                        {selectedInvestment.currentPrice && (
                                            <p className={`text-sm ${calculateProfitLoss(selectedInvestment) >= 0 ? 'text-green-600' : 'text-red-600'
                                                }`}>
                                                {(() => {
                                                    const percentage = ((selectedInvestment.currentPrice - selectedInvestment.purchasePrice) / selectedInvestment.purchasePrice) * 100;
                                                    return `${percentage >= 0 ? '+' : ''}${percentage.toFixed(2)}%`;
                                                })()}
                                            </p>
                                        )}
                                    </div>
                                    <div className="p-3 bg-gray-50 rounded-lg">
                                        <p className="text-xs text-gray-500">Giá cổ phiếu</p>
                                        <div className="space-y-1">
                                            <p className="text-sm text-gray-600">
                                                Mua: {formatCurrency(selectedInvestment.purchasePrice)}
                                            </p>
                                            {selectedInvestment.currentPrice && (
                                                <p className="text-sm text-gray-900">
                                                    Hiện tại: {formatCurrency(selectedInvestment.currentPrice)}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="p-3 bg-gray-50 rounded-lg">
                                        <p className="text-xs text-gray-500">Số lượng</p>
                                        <p className="text-lg font-semibold text-gray-900">
                                            {selectedInvestment.currentQuantity}
                                        </p>
                                    </div>
                                </div>

                                {/* AI Analysis Section */}
                                <div className="mb-6">
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-sm font-medium text-gray-900">Phân tích AI</h3>
                                        <button
                                            onClick={() => analyzeInvestment(selectedInvestment)}
                                            disabled={analyzingInvestment === selectedInvestment.symbol}
                                            className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                                        >
                                            <LightBulbIcon className={`h-3.5 w-3.5 ${analyzingInvestment === selectedInvestment.symbol ? 'animate-pulse' : ''}`} />
                                            {analyzingInvestment === selectedInvestment.symbol ? 'Đang phân tích...' : 'Phân tích lại'}
                                        </button>
                                    </div>

                                    {selectedInvestment.lastAnalysis ? (
                                        <div className="p-4 bg-gray-50 rounded-lg">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className={`px-2 py-1 rounded text-xs font-medium ${selectedInvestment.lastAnalysis.recommendation === 'buy'
                                                        ? 'bg-green-100 text-green-700'
                                                        : selectedInvestment.lastAnalysis.recommendation === 'sell'
                                                            ? 'bg-red-100 text-red-700'
                                                            : 'bg-yellow-100 text-yellow-700'
                                                        }`}>
                                                        {selectedInvestment.lastAnalysis.recommendation === 'buy'
                                                            ? 'Mua thêm'
                                                            : selectedInvestment.lastAnalysis.recommendation === 'sell'
                                                                ? 'Nên bán'
                                                                : 'Giữ nguyên'}
                                                    </span>
                                                    <span className="text-xs text-gray-500">
                                                        Độ tin cậy: {selectedInvestment.lastAnalysis.confidence}%
                                                    </span>
                                                </div>
                                                <span className="text-xs text-gray-500">
                                                    {format(new Date(selectedInvestment.lastAnalysis.timestamp), 'dd/MM/yyyy HH:mm')}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-700">
                                                {selectedInvestment.lastAnalysis.reasoning}
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="p-4 bg-gray-50 rounded-lg text-center">
                                            <p className="text-sm text-gray-500">
                                                Chưa có phân tích. Nhấn nút "Phân tích lại" để nhận lời khuyên.
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-sm font-medium text-gray-900">Lịch sử giao dịch</h3>
                                    <button
                                        onClick={() => fetchCurrentPrice(selectedInvestment.symbol, 'stock')}
                                        disabled={updatingPrices[selectedInvestment.symbol]}
                                        className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                                    >
                                        <ArrowPathIcon className={`h-3.5 w-3.5 ${updatingPrices[selectedInvestment.symbol] ? 'animate-spin' : ''}`} />
                                        Cập nhật giá
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    {getInvestmentHistory(selectedInvestment).map((transaction) => (
                                        <div
                                            key={transaction.id}
                                            className="flex items-center gap-4 p-3 rounded-lg bg-gray-50"
                                        >
                                            <div
                                                className={`p-2.5 rounded-lg ${transaction.transactionType === 'buy'
                                                    ? 'bg-green-100 border border-green-200'
                                                    : 'bg-red-100 border border-red-200'
                                                    }`}
                                            >
                                                {transaction.transactionType === 'buy' ? (
                                                    <ArrowDownIcon className="w-5 h-5 text-green-600" />
                                                ) : (
                                                    <ArrowUpIcon className="w-5 h-5 text-red-600" />
                                                )}
                                            </div>

                                            <div className="flex-1">
                                                <div className="flex items-center justify-between">
                                                    <h3 className="text-sm font-medium text-gray-900">
                                                        {transaction.transactionType === 'buy' ? 'Mua' : 'Bán'} {transaction.quantity} {selectedInvestment.type === 'stock' ? 'cổ phiếu' : 'coin'}
                                                    </h3>
                                                    <span className="text-sm font-medium text-gray-900">
                                                        {formatCurrency(transaction.price * transaction.quantity)}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-600 mt-1">
                                                    Giá: {formatCurrency(transaction.price)} • {format(new Date(transaction.date), 'dd/MM/yyyy')}
                                                </p>
                                                {transaction.notes && (
                                                    <p className="text-xs text-gray-600 mt-1">
                                                        {transaction.notes}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
} 