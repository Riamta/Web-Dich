'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ExpenseService, Expense, UserSettings, Wallet } from '../lib/expense-service';
import { ChartBarIcon, PlusIcon, TrashIcon, PencilIcon, SparklesIcon, ArrowUpIcon, ArrowDownIcon, Cog6ToothIcon, PencilSquareIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { aiService } from '../lib/ai-service';
import ReactMarkdown from 'react-markdown';

const EXPENSE_CATEGORIES = [
    'Ăn uống',
    'Di chuyển',
    'Giải trí',
    'Mua sắm',
    'Hóa đơn',
    'Y tế',
    'Giáo dục',
    'Du lịch', 
    'Nhà cửa',
    'Tiền điện',
    'Tiền nước',
    'Tiền internet',
    'Tiền điện thoại',
    'Bảo hiểm',
    'Quần áo',
    'Mỹ phẩm',
    'Thể thao',
    'Sách vở',
    'Đồ gia dụng',
    'Quà tặng',
    'Từ thiện',
    'Tiết kiệm',
    'Trả nợ',
    'Làm rơi tiền',
    'Sinh nhật',
    'Khác'
];

const INCOME_CATEGORIES = [
    'Lương',
    'Thưởng',
    'Đầu tư',
    'Kinh doanh', 
    'Cho thuê',
    'Bán hàng',
    'Freelance',
    'Tiền lãi',
    'Cổ tức',
    'Bảo hiểm',
    'Thừa kế',
    'Quà tặng',
    'Nhặt được tiền',
    'Sinh nhật',
    'Khác'
];

export function ExpenseManager() {
    const { user } = useAuth();
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
    const [smartInput, setSmartInput] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isIncome, setIsIncome] = useState(false);
    const [settings, setSettings] = useState<UserSettings>({
        currency: {
            symbol: 'đ',
            position: 'after',
            decimalSeparator: ',',
            thousandsSeparator: '.'
        }
    });
    const [formData, setFormData] = useState({
        amount: '',
        category: '',
        description: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        type: 'expense' as 'expense' | 'income'
    });
    const [filter, setFilter] = useState({
        type: 'all' as 'all' | 'income' | 'expense',
        period: 'all' as 'all' | 'day' | 'month' | 'year',
        day: format(new Date(), 'yyyy-MM-dd'),
        month: format(new Date(), 'yyyy-MM'),
        year: format(new Date(), 'yyyy'),
        category: 'all' as 'all' | string
    });
    const [wallet, setWallet] = useState<Wallet | null>(null);
    const [showWalletModal, setShowWalletModal] = useState(false);
    const [newBalance, setNewBalance] = useState('');

    const expenseService = ExpenseService.getInstance();

    useEffect(() => {
        if (user) {
            loadExpenses();
            loadSettings();
            loadWallet();
        }
    }, [user]);

    const loadExpenses = async () => {
        try {
            setLoading(true);
            const userExpenses = await expenseService.getExpenses(user!.uid);
            setExpenses(userExpenses);
        } catch (error) {
            setError('Không thể tải danh sách chi tiêu');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const loadSettings = async () => {
        try {
            const userSettings = await expenseService.getUserSettings(user!.uid);
            setSettings(userSettings);
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    };

    const loadWallet = async () => {
        if (!user) return;
        try {
            const userWallet = await expenseService.getWallet(user.uid);
            setWallet(userWallet);
        } catch (error) {
            console.error('Error loading wallet:', error);
            setError('Không thể tải số dư ví');
        }
    };

    const handleSaveSettings = async () => {
        try {
            await expenseService.updateUserSettings(user!.uid, settings);
            setShowSettings(false);
        } catch (error) {
            console.error('Error saving settings:', error);
            setError('Không thể lưu cài đặt');
        }
    };

    const formatCurrency = (amount: number) => {
        return expenseService.formatCurrency(amount, settings);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        // Đóng modal ngay lập tức
        setShowAddForm(false);
        setEditingExpense(null);

        try {
            const expenseData = {
                userId: user.uid,
                amount: parseFloat(formData.amount) * (formData.type === 'expense' ? -1 : 1),
                category: formData.category,
                description: formData.description || '',
                date: new Date(formData.date),
                type: formData.type
            };

            if (editingExpense) {
                // Cập nhật UI ngay lập tức
                const updatedExpense = {
                    ...editingExpense,
                    ...expenseData
                };
                setExpenses(prev => prev.map(exp => 
                    exp.id === editingExpense.id ? updatedExpense : exp
                ));
                // Cập nhật số dư ví
                setWallet(prev => prev ? {
                    ...prev,
                    balance: prev.balance - editingExpense.amount + expenseData.amount
                } : null);
                
                await expenseService.updateExpense(editingExpense.id!, expenseData);
            } else {
                // Thêm vào UI ngay lập tức
                const tempId = 'temp-' + Date.now();
                const tempExpense = {
                    ...expenseData,
                    id: tempId,
                    createdAt: new Date()
                };
                setExpenses(prev => [tempExpense, ...prev]);
                // Cập nhật số dư ví
                setWallet(prev => prev ? {
                    ...prev,
                    balance: prev.balance + expenseData.amount
                } : null);
                
                // Thêm vào database và cập nhật lại với ID thật
                const savedExpense = await expenseService.addExpense(expenseData);
                setExpenses(prev => prev.map(exp => 
                    exp.id === tempId ? savedExpense : exp
                ));
            }

            // Reset form data
            setFormData({
                amount: '',
                category: '',
                description: '',
                date: format(new Date(), 'yyyy-MM-dd'),
                type: 'expense'
            });
        } catch (error) {
            setError('Không thể lưu chi tiêu');
            console.error(error);
            // Rollback UI changes
            if (editingExpense) {
                loadExpenses();
                loadWallet();
            } else {
                const tempId = 'temp-' + Date.now();
                setExpenses(prev => prev.filter(exp => exp.id !== tempId));
                loadWallet();
            }
        }
    };

    const handleDelete = async (expenseId: string) => {
        if (!confirm('Bạn có chắc chắn muốn xóa chi tiêu này?')) return;

        try {
            // Lưu expense để rollback nếu cần
            const expenseToDelete = expenses.find(exp => exp.id === expenseId);
            if (!expenseToDelete) return;

            // Cập nhật UI ngay lập tức
            setExpenses(prev => prev.filter(exp => exp.id !== expenseId));
            setWallet(prev => prev ? {
                ...prev,
                balance: prev.balance - expenseToDelete.amount
            } : null);

            await expenseService.deleteExpense(expenseId);
        } catch (error) {
            setError('Không thể xóa chi tiêu');
            console.error(error);
            // Rollback UI changes
            loadExpenses();
            loadWallet();
        }
    };

    const handleEdit = (expense: Expense) => {
        setEditingExpense(expense);
        setFormData({
            amount: Math.abs(expense.amount).toString(),
            category: expense.category,
            description: expense.description,
            date: format(expense.date, 'yyyy-MM-dd'),
            type: expense.amount >= 0 ? 'income' : 'expense'
        });
        setShowAddForm(true);
    };

    const analyzeExpense = async (text: string) => {
        if (!text.trim() || !user) return;
        
        setIsAnalyzing(true);
        try {
            const prompt = `Phân tích giao dịch từ mô tả sau và trả về kết quả theo định dạng JSON:
            "${text}"
            
            Yêu cầu:
            1. Xác định đây là thu nhập hay chi tiêu
            2. Tìm số tiền trong mô tả (nếu có)
            3. Chọn danh mục phù hợp từ danh sách đã cho:
               - Danh mục chi tiêu: ${EXPENSE_CATEGORIES.join(', ')}
               - Danh mục thu nhập: ${INCOME_CATEGORIES.join(', ')}
            4. Tóm tắt mô tả ngắn gọn
            
            Chỉ trả về JSON, không thêm bất kỳ text nào khác:
            {
                "type": "income" | "expense",
                "amount": number,
                "category": "string", // Phải là một trong các danh mục đã cho
                "description": "string"
            }`;

            const aiResult = await aiService.processWithAI(prompt);
            
            const cleanResult = aiResult
                .replace(/```json/g, '')
                .replace(/```/g, '')
                .trim();
            
            const analysis = JSON.parse(cleanResult);

            const validCategories = analysis.type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
            if (!validCategories.includes(analysis.category)) {
                analysis.category = analysis.type === 'expense' ? 'Khác' : 'Lương';
            }

            const expenseData = {
                userId: user.uid,
                amount: analysis.amount * (analysis.type === 'expense' ? -1 : 1),
                category: analysis.category,
                description: analysis.description || text,
                date: new Date(),
                type: analysis.type
            };

            // Thêm vào UI ngay lập tức
            const tempId = 'temp-' + Date.now();
            const tempExpense = {
                ...expenseData,
                id: tempId,
                createdAt: new Date()
            };
            setExpenses(prev => [tempExpense, ...prev]);
            setWallet(prev => prev ? {
                ...prev,
                balance: prev.balance + expenseData.amount
            } : null);

            // Thêm vào database và cập nhật lại với ID thật
            const savedExpense = await expenseService.addExpense(expenseData);
            setExpenses(prev => prev.map(exp => 
                exp.id === tempId ? savedExpense : exp
            ));

            setSmartInput(''); // Xóa input sau khi thêm thành công
        } catch (error) {
            console.error('Error analyzing expense:', error);
            setError('Không thể phân tích giao dịch. Vui lòng thử lại.');
            // Rollback UI changes
            const tempId = 'temp-' + Date.now();
            setExpenses(prev => prev.filter(exp => exp.id !== tempId));
            loadWallet();
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleUpdateWallet = async () => {
        if (!user || !newBalance) return;
        try {
            const balance = parseFloat(newBalance);
            await expenseService.updateWalletBalance(user.uid, balance);
            setWallet(prev => prev ? { ...prev, balance } : null);
            setShowWalletModal(false);
            setNewBalance('');
        } catch (error) {
            console.error('Error updating wallet:', error);
            setError('Không thể cập nhật số dư ví');
        }
    };

    const filteredExpenses = expenses.filter(expense => {
        // Lọc theo loại
        if (filter.type !== 'all' && 
            (filter.type === 'income' ? expense.amount <= 0 : expense.amount >= 0)) {
            return false;
        }

        // Lọc theo danh mục
        if (filter.category !== 'all' && expense.category !== filter.category) {
            return false;
        }

        // Lọc theo thời gian
        if (filter.period !== 'all') {
            const expenseDate = new Date(expense.date);
            
            switch (filter.period) {
                case 'day':
                    return format(expenseDate, 'yyyy-MM-dd') === filter.day;
                case 'month':
                    return format(expenseDate, 'yyyy-MM') === filter.month;
                case 'year':
                    return format(expenseDate, 'yyyy') === filter.year;
                default:
                    return true;
            }
        }

        return true;
    });

    const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const income = filteredExpenses.filter(e => e.amount > 0).reduce((sum, e) => sum + e.amount, 0);
    const expense = filteredExpenses.filter(e => e.amount < 0).reduce((sum, e) => sum + Math.abs(e.amount), 0);
    const balance = income - expense;

    const categoryTotals = filteredExpenses.reduce((acc, expense) => {
        const category = expense.category;
        const amount = Math.abs(expense.amount);
        acc[category] = (acc[category] || 0) + amount;
        return acc;
    }, {} as Record<string, number>);

    return (
        <div className="max-w-6xl mx-auto p-4">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div className="flex items-center space-x-2">
                        <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center">
                            <ChartBarIcon className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-semibold">Quản lý tài chính</h1>
                            <p className="text-sm text-gray-500">Theo dõi thu nhập và chi tiêu của bạn</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowWalletModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            <PencilSquareIcon className="h-5 w-5" />
                            Số dư ví: {wallet ? formatCurrency(wallet.balance) : '0đ'}
                        </button>
                        <button
                            onClick={() => setShowSettings(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            <Cog6ToothIcon className="h-5 w-5" />
                            Cài đặt
                        </button>
                        <button
                            onClick={() => setShowAddForm(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900 transition-colors"
                        >
                            <PlusIcon className="h-5 w-5" />
                            Thêm giao dịch
                        </button>
                    </div>
                </div>

                {/* Wallet Modal */}
                {showWalletModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-xl p-6 w-full max-w-md">
                            <h2 className="text-xl font-semibold mb-4">Cập nhật số dư ví</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Số dư mới
                                    </label>
                                    <input
                                        type="number"
                                        value={newBalance}
                                        onChange={(e) => setNewBalance(e.target.value)}
                                        placeholder="Nhập số dư mới"
                                        className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 mt-6">
                                <button
                                    onClick={() => {
                                        setShowWalletModal(false);
                                        setNewBalance('');
                                    }}
                                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    Hủy
                                </button>
                                <button
                                    onClick={handleUpdateWallet}
                                    className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900 transition-colors"
                                >
                                    Cập nhật
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Settings Modal */}
                {showSettings && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-xl p-6 w-full max-w-md">
                            <h2 className="text-xl font-semibold mb-4">Cài đặt tiền tệ</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Ký hiệu tiền tệ
                                    </label>
                                    <input
                                        type="text"
                                        value={settings.currency.symbol}
                                        onChange={(e) => setSettings(prev => ({
                                            ...prev,
                                            currency: { ...prev.currency, symbol: e.target.value }
                                        }))}
                                        className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Vị trí ký hiệu
                                    </label>
                                    <select
                                        value={settings.currency.position}
                                        onChange={(e) => setSettings(prev => ({
                                            ...prev,
                                            currency: { ...prev.currency, position: e.target.value as 'before' | 'after' }
                                        }))}
                                        className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                                    >
                                        <option value="before">Trước số tiền</option>
                                        <option value="after">Sau số tiền</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Dấu phân cách thập phân
                                    </label>
                                    <input
                                        type="text"
                                        value={settings.currency.decimalSeparator}
                                        onChange={(e) => setSettings(prev => ({
                                            ...prev,
                                            currency: { ...prev.currency, decimalSeparator: e.target.value }
                                        }))}
                                        className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Dấu phân cách hàng nghìn
                                    </label>
                                    <input
                                        type="text"
                                        value={settings.currency.thousandsSeparator}
                                        onChange={(e) => setSettings(prev => ({
                                            ...prev,
                                            currency: { ...prev.currency, thousandsSeparator: e.target.value }
                                        }))}
                                        className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 mt-6">
                                <button
                                    onClick={() => setShowSettings(false)}
                                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    Hủy
                                </button>
                                <button
                                    onClick={handleSaveSettings}
                                    className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900 transition-colors"
                                >
                                    Lưu
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Smart Input */}
                <div className="p-6 border-b border-gray-200">
                    <div className="relative">
                        <input
                            type="text"
                            value={smartInput}
                            onChange={(e) => setSmartInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    analyzeExpense(smartInput);
                                }
                            }}
                            placeholder="Nhập mô tả giao dịch (ví dụ: Tôi vừa đi ăn hết 30.000 hoặc Nhận lương tháng 10.000.000)"
                            className="w-full p-4 pr-12 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                        />
                        <button
                            onClick={() => analyzeExpense(smartInput)}
                            disabled={isAnalyzing || !smartInput.trim()}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-500 hover:text-black disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isAnalyzing ? (
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black" />
                            ) : (
                                <SparklesIcon className="h-5 w-5" />
                            )}
                        </button>
                    </div>
                    <p className="mt-2 text-sm text-gray-500">
                        Nhấn Enter hoặc nút <SparklesIcon className="h-4 w-4 inline" /> để AI phân tích giao dịch
                    </p>
                </div>

                {/* Summary */}
                <div className="p-6 border-b border-gray-200">
                    <div className="flex flex-col md:flex-row gap-4 mb-4">
                        <div className="flex flex-wrap gap-2">
                            <select
                                value={filter.type}
                                onChange={(e) => setFilter(prev => ({ ...prev, type: e.target.value as any }))}
                                className="p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                            >
                                <option value="all">Tất cả</option>
                                <option value="income">Thu nhập</option>
                                <option value="expense">Chi tiêu</option>
                            </select>
                            <select
                                value={filter.category}
                                onChange={(e) => setFilter(prev => ({ ...prev, category: e.target.value }))}
                                className="p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                            >
                                <option value="all">Tất cả danh mục</option>
                                {filter.type === 'all' && (
                                    <>
                                        <optgroup label="Thu nhập">
                                            {INCOME_CATEGORIES.map(category => (
                                                <option key={category} value={category}>{category}</option>
                                            ))}
                                        </optgroup>
                                        <optgroup label="Chi tiêu">
                                            {EXPENSE_CATEGORIES.map(category => (
                                                <option key={category} value={category}>{category}</option>
                                            ))}
                                        </optgroup>
                                    </>
                                )}
                                {filter.type === 'income' && INCOME_CATEGORIES.map(category => (
                                    <option key={category} value={category}>{category}</option>
                                ))}
                                {filter.type === 'expense' && EXPENSE_CATEGORIES.map(category => (
                                    <option key={category} value={category}>{category}</option>
                                ))}
                            </select>
                            <select
                                value={filter.period}
                                onChange={(e) => setFilter(prev => ({ ...prev, period: e.target.value as any }))}
                                className="p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                            >
                                <option value="all">Tất cả thời gian</option>
                                <option value="day">Theo ngày</option>
                                <option value="month">Theo tháng</option>
                                <option value="year">Theo năm</option>
                            </select>
                            {filter.period === 'day' && (
                                <input
                                    type="date"
                                    value={filter.day}
                                    onChange={(e) => setFilter(prev => ({ ...prev, day: e.target.value }))}
                                    className="p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                                />
                            )}
                            {filter.period === 'month' && (
                                <input
                                    type="month"
                                    value={filter.month}
                                    onChange={(e) => setFilter(prev => ({ ...prev, month: e.target.value }))}
                                    className="p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                                />
                            )}
                            {filter.period === 'year' && (
                                <input
                                    type="number"
                                    value={filter.year}
                                    onChange={(e) => setFilter(prev => ({ ...prev, year: e.target.value }))}
                                    min="2000"
                                    max="2100"
                                    className="p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black w-24"
                                    placeholder="Năm"
                                />
                            )}
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="p-4 bg-gray-50 rounded-xl">
                            <p className="text-sm text-gray-500">Số dư</p>
                            <p className={`text-2xl font-semibold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatCurrency(balance)}
                            </p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-xl">
                            <p className="text-sm text-gray-500">Thu nhập</p>
                            <p className="text-2xl font-semibold text-green-600">
                                {formatCurrency(income)}
                            </p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-xl">
                            <p className="text-sm text-gray-500">Chi tiêu</p>
                            <p className="text-2xl font-semibold text-red-600">
                                {formatCurrency(expense)}
                            </p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-xl">
                            <p className="text-sm text-gray-500">Số giao dịch</p>
                            <p className="text-2xl font-semibold">{filteredExpenses.length}</p>
                        </div>
                    </div>
                </div>

                {/* Add/Edit Form Modal */}
                {showAddForm && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-xl p-6 w-full max-w-md">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-semibold">
                                    {editingExpense ? 'Sửa giao dịch' : 'Thêm giao dịch mới'}
                                </h2>
                                <button
                                    onClick={() => {
                                        setShowAddForm(false);
                                        setEditingExpense(null);
                                        setFormData({
                                            amount: '',
                                            category: '',
                                            description: '',
                                            date: format(new Date(), 'yyyy-MM-dd'),
                                            type: 'expense'
                                        });
                                    }}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    <XMarkIcon className="h-6 w-6" />
                                </button>
                            </div>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="flex gap-4">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setFormData(prev => ({ ...prev, type: 'expense' }));
                                            setIsIncome(false);
                                        }}
                                        className={`flex-1 px-4 py-2 rounded-lg border transition-colors ${
                                            formData.type === 'expense'
                                                ? 'bg-red-50 border-red-200 text-red-600'
                                                : 'bg-gray-50 border-gray-200 text-gray-600'
                                        }`}
                                    >
                                        <ArrowDownIcon className="h-5 w-5 inline mr-2" />
                                        Chi tiêu
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setFormData(prev => ({ ...prev, type: 'income' }));
                                            setIsIncome(true);
                                        }}
                                        className={`flex-1 px-4 py-2 rounded-lg border transition-colors ${
                                            formData.type === 'income'
                                                ? 'bg-green-50 border-green-200 text-green-600'
                                                : 'bg-gray-50 border-gray-200 text-gray-600'
                                        }`}
                                    >
                                        <ArrowUpIcon className="h-5 w-5 inline mr-2" />
                                        Thu nhập
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Số tiền
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.amount}
                                            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                            className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Danh mục
                                        </label>
                                        <select
                                            value={formData.category}
                                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                            className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                                            required
                                        >
                                            <option value="">Chọn danh mục</option>
                                            {(formData.type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES).map((category) => (
                                                <option key={category} value={category}>
                                                    {category}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Mô tả <span className="text-gray-400">(không bắt buộc)</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                                        placeholder="Nhập mô tả (nếu có)"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Ngày
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.date}
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                        className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                                        required
                                    />
                                </div>
                                <div className="flex justify-end gap-2 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowAddForm(false);
                                            setEditingExpense(null);
                                            setFormData({
                                                amount: '',
                                                category: '',
                                                description: '',
                                                date: format(new Date(), 'yyyy-MM-dd'),
                                                type: 'expense'
                                            });
                                        }}
                                        className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                    >
                                        Hủy
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900 transition-colors"
                                    >
                                        {editingExpense ? 'Cập nhật' : 'Thêm'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Expenses List */}
                <div className="p-6">
                    {loading ? (
                        <div className="flex justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black" />
                        </div>
                    ) : filteredExpenses.length === 0 ? (
                        <div className="text-center text-gray-500">
                            <p>Không có giao dịch nào phù hợp</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredExpenses.map((expense) => (
                                <div
                                    key={expense.id}
                                    className="p-4 bg-gray-50 rounded-xl flex items-center justify-between"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                                            expense.amount >= 0 ? 'bg-green-600' : 'bg-red-600'
                                        }`}>
                                            {expense.amount >= 0 ? (
                                                <ArrowUpIcon className="h-6 w-6 text-white" />
                                            ) : (
                                                <ArrowDownIcon className="h-6 w-6 text-white" />
                                            )}
                                        </div>
                                        <div>
                                            <p className={`font-medium ${
                                                expense.amount >= 0 ? 'text-green-600' : 'text-red-600'
                                            }`}>
                                                {Math.abs(expense.amount).toLocaleString('vi-VN')}đ
                                            </p>
                                            <p className="text-sm text-gray-500">{expense.description}</p>
                                            <p className="text-xs text-gray-400">
                                                {format(expense.date, 'dd/MM/yyyy', { locale: vi })}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`px-3 py-1 rounded-full text-sm ${
                                            expense.amount >= 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                                        }`}>
                                            {expense.category}
                                        </span>
                                        <button
                                            onClick={() => handleEdit(expense)}
                                            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                        >
                                            <PencilIcon className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(expense.id!)}
                                            className="p-2 text-gray-500 hover:text-red-500 hover:bg-gray-100 rounded-lg transition-colors"
                                        >
                                            <TrashIcon className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* AI Analysis */}
                {filteredExpenses.length > 0 && (
                    <div className="p-6 border-t border-gray-200">
                        <h2 className="text-lg font-medium mb-4">Phân tích AI</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 bg-gray-50 rounded-xl">
                                <h3 className="font-medium mb-2">Chi tiêu theo danh mục</h3>
                                <div className="space-y-2">
                                    {Object.entries(categoryTotals).map(([category, total]) => (
                                        <div key={category} className="flex items-center justify-between">
                                            <span className="text-sm">{category}</span>
                                            <span className="text-sm font-medium">
                                                {formatCurrency(total)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-xl">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="font-medium">Gợi ý từ AI</h3>
                                    {filteredExpenses[0].aiAnalysis && (
                                        <span className="text-xs text-gray-500">
                                            Cập nhật: {format(filteredExpenses[0].aiAnalysis.lastUpdated, 'dd/MM/yyyy HH:mm', { locale: vi })}
                                        </span>
                                    )}
                                </div>
                                <div className="space-y-3">
                                    {filteredExpenses[0].aiAnalysis?.suggestions.map((suggestion, index) => (
                                        <div key={index} className="flex items-start gap-3 p-3 bg-white rounded-lg shadow-sm">
                                            <div className="w-2 h-2 rounded-full bg-black mt-2" />
                                            <div className="flex-1">
                                                <ReactMarkdown
                                                    components={{
                                                        p: ({ children }) => <p className="text-sm">{children}</p>,
                                                        strong: ({ children }) => <strong className="font-medium text-black">{children}</strong>,
                                                        em: ({ children }) => <em className="italic">{children}</em>,
                                                        ul: ({ children }) => <ul className="list-disc pl-4 mt-1">{children}</ul>,
                                                        ol: ({ children }) => <ol className="list-decimal pl-4 mt-1">{children}</ol>,
                                                        li: ({ children }) => <li className="text-sm">{children}</li>,
                                                        code: ({ children }) => <code className="bg-gray-100 px-1 rounded">{children}</code>,
                                                        a: ({ href, children }) => (
                                                            <a href={href} className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
                                                                {children}
                                                            </a>
                                                        ),
                                                    }}
                                                >
                                                    {suggestion}
                                                </ReactMarkdown>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="p-4 bg-red-50 text-red-600 text-sm">
                        {error}
                    </div>
                )}
            </div>
        </div>
    );
}