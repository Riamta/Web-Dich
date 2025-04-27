'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

const INTEREST_TERMS = [
    { label: '1 tháng', value: 1 },
    { label: '3 tháng', value: 3 },
    { label: '6 tháng', value: 6 },
    { label: '9 tháng', value: 9 },
    { label: '12 tháng', value: 12 },
    { label: '18 tháng', value: 18 },
    { label: '24 tháng', value: 24 },
    { label: '36 tháng', value: 36 }
];

type InterestType = 'simple' | 'compound';
type CompoundingFrequency = 'monthly' | 'quarterly' | 'semi-annually' | 'annually';

export function InterestCalculator() {
    const [principal, setPrincipal] = useState('');
    const [interestRate, setInterestRate] = useState('');
    const [term, setTerm] = useState(''); // Empty by default
    const [interestType, setInterestType] = useState<InterestType>('simple');
    const [compoundingFrequency, setCompoundingFrequency] = useState<CompoundingFrequency>('monthly');
    const [results, setResults] = useState<{
        term: number;
        total: number;
        interest: number;
        monthly: number;
    }[]>([]);

    const formatInputNumber = (value: string) => {
        // Remove all non-digit characters
        const numbers = value.replace(/\D/g, '');
        
        // Format with thousand separators
        return numbers.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    };

    const handlePrincipalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formattedValue = formatInputNumber(e.target.value);
        setPrincipal(formattedValue);
    };

    const handleTermChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, '');
        setTerm(value);
    };

    const calculateInterest = () => {
        if (!principal || !interestRate) return;

        // Remove thousand separators before calculation
        const p = parseFloat(principal.replace(/\./g, ''));
        const r = parseFloat(interestRate) / 100;
        
        let terms: number[];
        if (!term) {
            // If term is empty, calculate for common deposit terms
            terms = [1, 3, 6, 9, 12, 18, 24, 36];
        } else {
            // If term is specified, only calculate for that term
            terms = [parseInt(term)];
        }

        const newResults = terms.map(t => {
            let total: number;
            let interest: number;
            
            if (interestType === 'simple') {
                // Simple interest calculation
                total = p * (1 + r * t / 12);
                interest = total - p;
            } else {
                // Compound interest calculation
                let periodsPerYear: number;
                switch (compoundingFrequency) {
                    case 'monthly':
                        periodsPerYear = 12;
                        break;
                    case 'quarterly':
                        periodsPerYear = 4;
                        break;
                    case 'semi-annually':
                        periodsPerYear = 2;
                        break;
                    case 'annually':
                        periodsPerYear = 1;
                        break;
                    default:
                        periodsPerYear = 12;
                }
                
                const ratePerPeriod = r / periodsPerYear;
                const totalPeriods = (t / 12) * periodsPerYear;
                
                total = p * Math.pow(1 + ratePerPeriod, totalPeriods);
                interest = total - p;
            }
            
            const monthly = interest / t;
            
            return {
                term: t,
                total,
                interest,
                monthly
            };
        });

        setResults(newResults);
    };

    const formatCurrency = (amount: number) => {
        return amount.toLocaleString('vi-VN', {
            style: 'currency',
            currency: 'VND'
        });
    };

    return (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden p-6 mx-auto px-2 py-8 max-w-7xl">
            <div className="mb-6">
                <h1 className="text-2xl font-semibold mb-2">CÔNG CỤ TÍNH LÃI SUẤT TIẾT KIỆM NGÂN HÀNG</h1>
                <p className="text-gray-600 mb-4">
                    Công cụ tính lãi suất tiết kiệm ngân hàng giúp bạn dễ dàng biết được số tiền lãi trong tương lai. 
                    Từ đó có thể so sánh các mức lãi suất ngân hàng, kỳ hạn gửi và đưa ra quyết định có lợi nhất cho mình.
                </p>
            </div>

            <div className="mb-6">
                <div className="flex border border-gray-200 rounded-lg overflow-hidden mb-4">
                    <button
                        className={`flex-1 py-2 px-4 ${interestType === 'simple' ? 'bg-black text-white' : 'bg-white text-gray-700'}`}
                        onClick={() => setInterestType('simple')}
                    >
                        Lãi suất cố định
                    </button>
                    <button
                        className={`flex-1 py-2 px-4 ${interestType === 'compound' ? 'bg-black text-white' : 'bg-white text-gray-700'}`}
                        onClick={() => setInterestType('compound')}
                    >
                        Lãi kép
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Số tiền gửi
                    </label>
                    <div className="relative">
                        <input
                            type="text"
                            value={principal}
                            onChange={handlePrincipalChange}
                            className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black pr-12"
                            placeholder="Ví dụ: 10.000.000"
                            inputMode="numeric"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">VNĐ</span>
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Lãi suất gửi
                    </label>
                    <div className="relative">
                        <input
                            type="number"
                            value={interestRate}
                            onChange={(e) => setInterestRate(e.target.value)}
                            className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black pr-12"
                            placeholder="Ví dụ: 6.5"
                            step="0.1"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%/năm</span>
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Kỳ hạn gửi
                    </label>
                    <div className="relative">
                        <input
                            type="text"
                            value={term}
                            onChange={handleTermChange}
                            className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black pr-12"
                            placeholder="Bỏ trống để xem tất cả kỳ hạn"
                            inputMode="numeric"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">tháng</span>
                    </div>
                </div>

                {interestType === 'compound' && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tần suất gộp lãi
                        </label>
                        <select 
                            value={compoundingFrequency}
                            onChange={(e) => setCompoundingFrequency(e.target.value as CompoundingFrequency)}
                            className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                        >
                            <option value="monthly">Hàng tháng</option>
                            <option value="quarterly">Hàng quý</option>
                            <option value="semi-annually">Nửa năm</option>
                            <option value="annually">Hàng năm</option>
                        </select>
                    </div>
                )}
            </div>

            <button
                onClick={calculateInterest}
                className="w-full px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900 transition-colors mb-6"
            >
                Thực hiện
            </button>

            {results.length > 0 && (
                <>
                    <div className="overflow-x-auto mb-6">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-200">
                                    <th className="text-left py-2 px-4">Kỳ hạn</th>
                                    <th className="text-right py-2 px-4">Tổng tiền</th>
                                    <th className="text-right py-2 px-4">Tiền lãi</th>
                                    <th className="text-right py-2 px-4">Lãi/tháng</th>
                                </tr>
                            </thead>
                            <tbody>
                                {results.map((result, index) => (
                                    <tr key={index} className="border-b border-gray-100">
                                        <td className="py-2 px-4">{result.term} tháng</td>
                                        <td className="py-2 px-4 text-right">{formatCurrency(result.total)}</td>
                                        <td className="py-2 px-4 text-right text-green-600">{formatCurrency(result.interest)}</td>
                                        <td className="py-2 px-4 text-right text-blue-600">{formatCurrency(result.monthly)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                        {interestType === 'simple' ? (
                            <>
                                <h3 className="font-semibold mb-2">Công thức tính lãi suất cố định:</h3>
                                <p className="text-gray-600 mb-4">
                                    Số tiền lãi = Số tiền gửi × lãi suất (%năm)/12 × số tháng gửi.
                                </p>
                                
                                <h3 className="font-semibold mb-2">Ví dụ:</h3>
                                <p className="text-gray-600">
                                    Gửi tiết kiệm 30.000.000 đồng với kỳ hạn 12 tháng tại ngân hàng có mức lãi suất 6,8%/năm:
                                </p>
                                <ul className="list-disc list-inside text-gray-600 mt-2 space-y-1">
                                    <li>Lãi suất hàng tháng là 30.000.000 × 6,8/100/12 × 1 = 170.000 đồng</li>
                                    <li>Lãi suất sau 12 tháng gửi là 30.000.000 × 6,8/100/12 × 12 = 2.040.000 đồng</li>
                                </ul>
                            </>
                        ) : (
                            <>
                                <h3 className="font-semibold mb-2">Công thức tính lãi kép:</h3>
                                <p className="text-gray-600 mb-4">
                                    Số tiền nhận được = Số tiền gửi × (1 + r/n)<sup>nt</sup>
                                </p>
                                <p className="text-gray-600 mb-4">
                                    Trong đó:<br />
                                    r = lãi suất hàng năm<br />
                                    n = số lần gộp lãi mỗi năm<br />
                                    t = số năm gửi tiền
                                </p>
                                
                                <h3 className="font-semibold mb-2">Ví dụ:</h3>
                                <p className="text-gray-600">
                                    Gửi tiết kiệm 30.000.000 đồng với kỳ hạn 12 tháng, lãi suất 6,8%/năm, gộp lãi hàng tháng:
                                </p>
                                <ul className="list-disc list-inside text-gray-600 mt-2 space-y-1">
                                    <li>Số tiền nhận được = 30.000.000 × (1 + 0,068/12)<sup>12×1</sup> = 32.101.486 đồng</li>
                                    <li>Tiền lãi = 32.101.486 - 30.000.000 = 2.101.486 đồng</li>
                                </ul>
                            </>
                        )}
                    </div>
                </>
            )}
        </div>
    );
} 