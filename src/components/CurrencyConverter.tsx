'use client'

import { useState, useEffect, useCallback } from 'react'
import { ArrowRightLeft, RefreshCw } from 'lucide-react'

interface Currency {
    code: string
    name: string
    symbol: string
}

const commonCurrencies: Currency[] = [
    { code: 'USD', name: 'US Dollar', symbol: '$' },
    { code: 'EUR', name: 'Euro', symbol: '€' },
    { code: 'GBP', name: 'British Pound', symbol: '£' },
    { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
    { code: 'VND', name: 'Vietnamese Dong', symbol: '₫' },
    { code: 'KRW', name: 'South Korean Won', symbol: '₩' },
    { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
    { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
    { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
    { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
    { code: 'CHF', name: 'Swiss Franc', symbol: 'Fr' },
    { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$' },
    { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$' },
    { code: 'THB', name: 'Thai Baht', symbol: '฿' },
    { code: 'PHP', name: 'Philippine Peso', symbol: '₱' },
    { code: 'TWD', name: 'Taiwan Dollar', symbol: 'NT$' },
    { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM' },
    { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
    { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp' },
    { code: 'RUB', name: 'Russian Ruble', symbol: '₽' }
].sort((a, b) => a.name.localeCompare(b.name))

const quickConversions = [
    { from: 'USD', to: 'VND', amount: 1 },
    { from: 'JPY', to: 'VND', amount: 100 },
    { from: 'CNY', to: 'VND', amount: 1 },
    { from: 'EUR', to: 'VND', amount: 1 },
    { from: 'GBP', to: 'VND', amount: 1 },
    { from: 'KRW', to: 'VND', amount: 1000 }
]

export default function CurrencyConverter() {
    const [amount, setAmount] = useState<string>('')
    const [fromCurrency, setFromCurrency] = useState<string>('USD')
    const [toCurrency, setToCurrency] = useState<string>('VND')
    const [result, setResult] = useState<number | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [exchangeRates, setExchangeRates] = useState<{[key: string]: number} | null>(null)
    const [quickResults, setQuickResults] = useState<{[key: string]: number}>({})

    const fetchExchangeRates = useCallback(async () => {
        if (!amount || isNaN(Number(amount))) {
            setError('Vui lòng nhập số tiền hợp lệ')
            return
        }

        setLoading(true)
        setError(null)

        try {
            // Fetch rates for main conversion
            const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${fromCurrency}`)
            const data = await response.json()
            
            if (data.rates) {
                setExchangeRates(data.rates)
                const rate = data.rates[toCurrency]
                const convertedAmount = Number(amount) * rate
                setResult(convertedAmount)
            } else {
                throw new Error('Không thể lấy tỷ giá')
            }

            // Fetch rates for each quick conversion pair
            const newQuickResults: {[key: string]: number} = {}
            for (const conv of quickConversions) {
                try {
                    const convResponse = await fetch(`https://api.exchangerate-api.com/v4/latest/${conv.from}`)
                    const convData = await convResponse.json()
                    if (convData.rates && convData.rates[conv.to]) {
                        newQuickResults[`${conv.from}-${conv.to}`] = conv.amount * convData.rates[conv.to]
                    }
                } catch (err) {
                    console.error(`Error fetching rates for ${conv.from}-${conv.to}:`, err)
                }
            }
            setQuickResults(newQuickResults)
        } catch (err) {
            setError('Có lỗi xảy ra khi chuyển đổi tiền tệ')
            setResult(null)
        } finally {
            setLoading(false)
        }
    }, [amount, fromCurrency, toCurrency])

    // Tự động chuyển đổi khi input thay đổi
    useEffect(() => {
        if (amount && !isNaN(Number(amount))) {
            fetchExchangeRates()
        }
    }, [amount, fromCurrency, toCurrency, fetchExchangeRates])

    const handleQuickConvert = (from: string, to: string, amount: number) => {
        setFromCurrency(from)
        setToCurrency(to)
        setAmount(amount.toString())
    }

    const handleSwapCurrencies = () => {
        const newFromCurrency = toCurrency
        const newToCurrency = fromCurrency
        setFromCurrency(newFromCurrency)
        setToCurrency(newToCurrency)
    }

    const formatCurrencyValue = (value: number, currencyCode: string) => {
        const currency = commonCurrencies.find(c => c.code === currencyCode)
        return `${currency?.symbol || ''} ${value.toLocaleString()}`
    }

    return (
        <div className="max-w-6xl mx-auto p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h2 className="text-2xl font-bold mb-6">Chuyển đổi tiền tệ</h2>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Số tiền
                                </label>
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="Nhập số tiền"
                                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-transparent"
                                />
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Từ tiền tệ
                                    </label>
                                    <select
                                        value={fromCurrency}
                                        onChange={(e) => setFromCurrency(e.target.value)}
                                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-transparent"
                                    >
                                        {commonCurrencies.map((currency) => (
                                            <option key={currency.code} value={currency.code}>
                                                {currency.code} - {currency.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <button
                                    onClick={handleSwapCurrencies}
                                    className="mt-6 p-2 rounded-full hover:bg-gray-100"
                                    title="Đảo ngược tiền tệ"
                                >
                                    <ArrowRightLeft className="w-5 h-5" />
                                </button>

                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Sang tiền tệ
                                    </label>
                                    <select
                                        value={toCurrency}
                                        onChange={(e) => setToCurrency(e.target.value)}
                                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-transparent"
                                    >
                                        {commonCurrencies.map((currency) => (
                                            <option key={currency.code} value={currency.code}>
                                                {currency.code} - {currency.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {error && (
                                <div className="text-red-500 text-sm mt-2">
                                    {error}
                                </div>
                            )}

                            {result !== null && (
                                <div className="mt-4 p-4 bg-gray-50 rounded-md">
                                    <div className="text-sm text-gray-600">Kết quả:</div>
                                    <div className="text-2xl font-bold">
                                        {formatCurrencyValue(Number(amount), fromCurrency)} = {formatCurrencyValue(result, toCurrency)}
                                    </div>
                                    <div className="text-sm text-gray-500 mt-2">
                                        Tỷ giá: 1 {fromCurrency} = {(result / Number(amount)).toFixed(4)} {toCurrency}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-semibold mb-4">Chuyển đổi nhanh</h3>
                    <div className="space-y-4">
                        {quickConversions.map((conv) => {
                            const key = `${conv.from}-${conv.to}`
                            const fromCurrency = commonCurrencies.find(c => c.code === conv.from)
                            const toCurrency = commonCurrencies.find(c => c.code === conv.to)
                            return (
                                <button
                                    key={key}
                                    onClick={() => handleQuickConvert(conv.from, conv.to, conv.amount)}
                                    className="w-full p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
                                >
                                    <div className="flex justify-between items-center">
                                        <div className="text-sm text-gray-600">
                                            {fromCurrency?.symbol} {conv.amount} {conv.from}
                                        </div>
                                        <div className="text-sm text-gray-500">=</div>
                                        <div className="text-sm font-medium">
                                            {toCurrency?.symbol} {quickResults[key]?.toLocaleString() || '...'} {conv.to}
                                        </div>
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                </div>
            </div>
        </div>
    )
} 