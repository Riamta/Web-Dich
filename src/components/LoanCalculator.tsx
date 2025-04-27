'use client';

import { useState } from 'react';

const LOAN_TERMS = [
    { label: '3 tháng', value: 3 },
    { label: '6 tháng', value: 6 },
    { label: '9 tháng', value: 9 },
    { label: '12 tháng', value: 12 },
    { label: '18 tháng', value: 18 },
    { label: '24 tháng', value: 24 },
    { label: '36 tháng', value: 36 },
    { label: '48 tháng', value: 48 },
    { label: '60 tháng', value: 60 }
];

export function LoanCalculator() {
    const [loanAmount, setLoanAmount] = useState('');
    const [interestRate, setInterestRate] = useState('');
    const [term, setTerm] = useState('');
    const [results, setResults] = useState<{
        monthlyPayment: number;
        totalPayment: number;
        totalInterest: number;
        paymentSchedule: {
            month: number;
            principal: number;
            interest: number;
            remaining: number;
        }[];
    } | null>(null);

    const formatInputNumber = (value: string) => {
        const numbers = value.replace(/\D/g, '');
        return numbers.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    };

    const handleLoanAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formattedValue = formatInputNumber(e.target.value);
        setLoanAmount(formattedValue);
    };

    const handleTermChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, '');
        setTerm(value);
    };

    const calculateLoan = () => {
        if (!loanAmount || !interestRate || !term) return;

        const p = parseFloat(loanAmount.replace(/\./g, ''));
        const r = parseFloat(interestRate) / 100 / 12; // Monthly interest rate
        const n = parseInt(term);

        // Calculate monthly payment using the formula: P * r * (1 + r)^n / ((1 + r)^n - 1)
        const monthlyPayment = p * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
        const totalPayment = monthlyPayment * n;
        const totalInterest = totalPayment - p;

        // Calculate payment schedule
        const paymentSchedule = [];
        let remaining = p;
        for (let i = 1; i <= n; i++) {
            const interest = remaining * r;
            const principal = monthlyPayment - interest;
            remaining -= principal;
            paymentSchedule.push({
                month: i,
                principal,
                interest,
                remaining: Math.max(0, remaining)
            });
        }

        setResults({
            monthlyPayment,
            totalPayment,
            totalInterest,
            paymentSchedule
        });
    };

    const formatCurrency = (amount: number) => {
        return amount.toLocaleString('vi-VN', {
            style: 'currency',
            currency: 'VND'
        });
    };

    return (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mx-auto px-2 py-8 max-w-7xl">
            <div className="mb-6">  
                <h1 className="text-2xl font-semibold mb-2">CÔNG CỤ TÍNH LÃI VAY NGÂN HÀNG</h1>
                <p className="text-gray-600 mb-4">
                    Công cụ tính lãi vay ngân hàng giúp bạn dễ dàng biết được số tiền phải trả hàng tháng và tổng số tiền phải trả.
                    Từ đó có thể so sánh các mức lãi suất vay và đưa ra quyết định phù hợp nhất.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Số tiền vay
                    </label>
                    <div className="relative">
                        <input
                            type="text"
                            value={loanAmount}
                            onChange={handleLoanAmountChange}
                            className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black pr-12"
                            placeholder="Ví dụ: 100.000.000"
                            inputMode="numeric"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">VNĐ</span>
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Lãi suất vay
                    </label>
                    <div className="relative">
                        <input
                            type="number"
                            value={interestRate}
                            onChange={(e) => setInterestRate(e.target.value)}
                            className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black pr-12"
                            placeholder="Ví dụ: 12"
                            step="0.1"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%/năm</span>
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Thời hạn vay
                    </label>
                    <div className="relative">
                        <input
                            type="text"
                            value={term}
                            onChange={handleTermChange}
                            className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black pr-12"
                            placeholder="Nhập số tháng"
                            inputMode="numeric"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">tháng</span>
                    </div>
                </div>
            </div>

            <button
                onClick={calculateLoan}
                className="w-full px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900 transition-colors mb-6"
            >
                Tính toán
            </button>

            {results && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <div className="text-sm text-gray-500">Số tiền trả hàng tháng</div>
                            <div className="text-xl font-semibold">{formatCurrency(results.monthlyPayment)}</div>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <div className="text-sm text-gray-500">Tổng số tiền phải trả</div>
                            <div className="text-xl font-semibold">{formatCurrency(results.totalPayment)}</div>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <div className="text-sm text-gray-500">Tổng tiền lãi</div>
                            <div className="text-xl font-semibold text-red-600">{formatCurrency(results.totalInterest)}</div>
                        </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="font-semibold mb-4">Lịch trả nợ</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-200">
                                        <th className="text-left py-2 px-4">Tháng</th>
                                        <th className="text-right py-2 px-4">Gốc</th>
                                        <th className="text-right py-2 px-4">Lãi</th>
                                        <th className="text-right py-2 px-4">Còn lại</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {results.paymentSchedule.map((payment, index) => (
                                        <tr key={index} className="border-b border-gray-100">
                                            <td className="py-2 px-4">{payment.month}</td>
                                            <td className="py-2 px-4 text-right">{formatCurrency(payment.principal)}</td>
                                            <td className="py-2 px-4 text-right text-red-600">{formatCurrency(payment.interest)}</td>
                                            <td className="py-2 px-4 text-right">{formatCurrency(payment.remaining)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-gray-50 rounded-lg p-4 mt-6">
                <h3 className="font-semibold mb-2">Công thức tính lãi vay:</h3>
                <p className="text-gray-600 mb-4">
                    Số tiền trả hàng tháng = Số tiền vay x (lãi suất/12) x (1 + lãi suất/12)^số tháng / ((1 + lãi suất/12)^số tháng - 1)
                </p>
                
                <h3 className="font-semibold mb-2">Ví dụ:</h3>
                <p className="text-gray-600">
                    Vay 100.000.000 đồng với lãi suất 12%/năm trong 12 tháng:
                </p>
                <ul className="list-disc list-inside text-gray-600 mt-2 space-y-1">
                    <li>Lãi suất hàng tháng: 12%/12 = 1%</li>
                    <li>Số tiền trả hàng tháng: 8.884,88 đồng</li>
                    <li>Tổng số tiền phải trả: 106.618,56 đồng</li>
                    <li>Tổng tiền lãi: 6.618,56 đồng</li>
                </ul>
            </div>
        </div>
    );
} 