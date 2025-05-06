'use client'

import { useState } from 'react'
import { aiService } from '@/lib/ai-service'
import {
    CurrencyDollarIcon,
    ComputerDesktopIcon,
    ArrowPathIcon,
    ClipboardIcon,
    TrashIcon,
    CpuChipIcon,
    CircleStackIcon,
    SwatchIcon,
    ServerIcon,
    CircleStackIcon as StorageIcon,
    BoltIcon,
    CubeIcon,
    ArrowPathIcon as FanIcon,
    ComputerDesktopIcon as MonitorIcon,
    CommandLineIcon,
    CursorArrowRaysIcon
} from '@heroicons/react/24/outline'

interface PCComponent {
    name: string
    model: string
    price: string
    note?: string
}

interface PCConfig {
    budget: string
    purpose: string
    components: PCComponent[]
    totalPrice: string
    notes: string[]
}

// Component icons
const componentIcons = {
    'CPU': CpuChipIcon,
    'GPU': SwatchIcon,
    'RAM': CircleStackIcon,
    'Mainboard': ServerIcon,
    'Storage': StorageIcon,
    'PSU': BoltIcon,
    'Case': CubeIcon,
    'Cooling': FanIcon,
    'Monitor': MonitorIcon,
    'Keyboard': CommandLineIcon,
    'Mouse': CursorArrowRaysIcon,
    'Other': ComputerDesktopIcon
} as const;

// Component category names in Vietnamese
const componentNames = {
    'CPU': 'Bộ xử lý',
    'GPU': 'Card đồ họa',
    'RAM': 'Bộ nhớ RAM',
    'Mainboard': 'Bo mạch chủ',
    'Storage': 'Ổ cứng',
    'PSU': 'Nguồn máy tính',
    'Case': 'Vỏ máy',
    'Cooling': 'Tản nhiệt',
    'Monitor': 'Màn hình',
    'Keyboard': 'Bàn phím',
    'Mouse': 'Chuột',
    'Other': 'Phụ kiện khác'
} as const;

// Function to format price
const formatPrice = (price: string, showConversion: boolean = false): string => {
    // Handle empty or invalid input
    if (!price || typeof price !== 'string') return '0 VNĐ'

    // Convert common currency formats to numbers
    let numericPrice = price
        .toLowerCase()
        .replace(/[^\d.]/g, '') // Remove non-numeric characters except decimal point
        .replace(/,/g, '') // Remove commas
        .replace(/\.(?=.*\.)/g, '') // Keep only the last decimal point

    let currency = 'VNĐ'
    let exchangeRate = 1

    // Handle common currency words
    if (price.toLowerCase().includes('triệu')) {
        numericPrice = (parseFloat(numericPrice) * 1000000).toString()
    } else if (price.toLowerCase().includes('tỷ')) {
        numericPrice = (parseFloat(numericPrice) * 1000000000).toString()
    } else if (price.toLowerCase().includes('k')) {
        numericPrice = (parseFloat(numericPrice) * 1000).toString()
    } else if (price.toLowerCase().includes('usd')) {
        currency = 'USD'
        exchangeRate = 24000 // Approximate USD to VND conversion
    } else if (price.toLowerCase().includes('eur')) {
        currency = 'EUR'
        exchangeRate = 26000 // Approximate EUR to VND conversion
    } else if (price.toLowerCase().includes('jpy')) {
        currency = 'JPY'
        exchangeRate = 160 // Approximate JPY to VND conversion
    } else if (price.toLowerCase().includes('gbp')) {
        currency = 'GBP'
        exchangeRate = 30000 // Approximate GBP to VND conversion
    } else if (price.toLowerCase().includes('cny')) {
        currency = 'CNY'
        exchangeRate = 3300 // Approximate CNY to VND conversion
    }

    const number = parseFloat(numericPrice)
    
    if (isNaN(number)) return '0 VNĐ'

    // Format with appropriate currency
    if (currency === 'VNĐ') {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(number).replace('VND', 'VNĐ')
    } else {
        // For other currencies, show both original and VND equivalent
        const originalAmount = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(number)

        const vndAmount = new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(number * exchangeRate).replace('VND', 'VNĐ')

        return showConversion ? `${originalAmount} (≈ ${vndAmount})` : originalAmount
    }
}

export default function PCBuilder() {
    const [budget, setBudget] = useState('')
    const [purpose, setPurpose] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [config, setConfig] = useState<PCConfig | null>(null)
    const [configHistory, setConfigHistory] = useState<PCConfig[]>([])
    const [showVNDConversion, setShowVNDConversion] = useState(false)

    const handleGenerateConfig = async () => {
        if (!budget.trim()) {
            setError('Vui lòng nhập ngân sách')
            return
        }

        setIsLoading(true)
        setError(null)
        setConfig(null)

        try {
            const prompt = `Hãy đề xuất cấu hình PC với các thông tin sau:
- Ngân sách: ${budget}
- Mục đích sử dụng: ${purpose || 'Đa năng'}

Yêu cầu:
- Trả về kết quả theo định dạng JSON với các trường:
  + budget: ngân sách (bao gồm đơn vị tiền tệ, ví dụ: "15 triệu VNĐ", "500 USD")
  + purpose: mục đích sử dụng
  + components: mảng các thành phần, mỗi thành phần gồm:
    * name: tên loại (CPU, GPU, RAM, Mainboard, Storage, PSU, Case, Cooling, Monitor, Keyboard, Mouse)
    * model: model cụ thể
    * price: giá tiền (bao gồm đơn vị tiền tệ, ví dụ: "3.5 triệu VNĐ", "150 USD") không ghi kèm chú thích của mệnh giá khác
    * note: ghi chú (nếu có)
  + totalPrice: tổng giá tiền (bao gồm đơn vị tiền tệ, ví dụ: "14.5 triệu VNĐ", "450 USD")
  + notes: mảng các lưu ý
- Chỉ trả về JSON thuần túy, không thêm markdown, không thêm text khác
- KHÔNG thêm \`\`\`json hoặc \`\`\` ở đầu và cuối
- Giá tiền phải phù hợp với ngân sách
- Ưu tiên hiệu năng/giá tiền tốt nhất
- Các thành phần phải tương thích với nhau
- Nếu ngân sách quá thấp, đề xuất cấu hình tối thiểu có thể
- Nếu ngân sách cao, đề xuất cấu hình cao cấp phù hợp
- Sử dụng đơn vị tiền tệ phù hợp với ngân sách đầu vào:
  + Nếu ngân sách là VNĐ: sử dụng "VNĐ" hoặc "triệu VNĐ"
  + Nếu ngân sách là USD: sử dụng "USD"
  + Nếu ngân sách là EUR: sử dụng "EUR"
  + Nếu ngân sách là JPY: sử dụng "JPY"
  + Nếu ngân sách là GBP: sử dụng "GBP"
  + Nếu ngân sách là CNY: sử dụng "CNY"

Ví dụ định dạng JSON mong muốn:
{
  "budget": "15 triệu VNĐ",
  "purpose": "Gaming",
  "components": [
    {
      "name": "CPU",
      "model": "Intel Core i5-12400F",
      "price": "3.5 triệu VNĐ",
      "note": "6 cores, 12 threads, phù hợp gaming"
    },
    {
      "name": "GPU",
      "model": "RTX 3060 12GB",
      "price": "5.5 triệu VNĐ",
      "note": "Đủ sức chơi game 1080p"
    }
  ],
  "totalPrice": "14.5 triệu VNĐ",
  "notes": [
    "Cấu hình cân bằng cho gaming 1080p",
    "Có thể nâng cấp GPU sau này"
  ]
}`

            const result = await aiService.processWithAI(prompt)
            // Clean up the response to ensure it's valid JSON
            const cleanResult = result.replace(/```json\n?|\n?```/g, '').trim()
            const parsedConfig = JSON.parse(cleanResult) as PCConfig

            // Ensure all price values are strings
            parsedConfig.budget = parsedConfig.budget.toString()
            parsedConfig.totalPrice = parsedConfig.totalPrice.toString()
            parsedConfig.components = parsedConfig.components.map(comp => ({
                ...comp,
                price: comp.price.toString()
            }))

            setConfig(parsedConfig)

            // Add to history (max 5 entries)
            setConfigHistory(prev => {
                const updatedHistory = [parsedConfig, ...prev]
                return updatedHistory.slice(0, 5)
            })
        } catch (error) {
            console.error('PC config generation error:', error)
            setError('Có lỗi xảy ra khi tạo cấu hình PC')
        } finally {
            setIsLoading(false)
        }
    }

    const copyToClipboard = () => {
        if (!config) return

        const configText = `Cấu hình PC - ${config.purpose}
Ngân sách: ${config.budget}
Tổng giá: ${config.totalPrice}

Thành phần:
${config.components.map(comp => `- ${componentNames[comp.name as keyof typeof componentNames] || comp.name}: ${comp.model} (${comp.price})${comp.note ? `\n  ${comp.note}` : ''}`).join('\n')}

Lưu ý:
${config.notes.map(note => `- ${note}`).join('\n')}`

        navigator.clipboard.writeText(configText)
    }

    const resetHistory = () => {
        setConfigHistory([])
        setConfig(null)
        setError(null)
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-8 px-4">
            <div className="max-w-6xl mx-auto">
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                    <div className="p-8">
                        <div className="space-y-8">
                            <div className="text-center mb-8">
                                <h1 className="text-3xl font-bold text-gray-800 mb-2">🖥️ PC Builder</h1>
                                <p className="text-gray-600">
                                    Không biết build PC như thế nào? Để chúng tôi giúp bạn!
                                </p>
                            </div>

                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                                            <CurrencyDollarIcon className="h-5 w-5 text-gray-400" />
                                            Ngân sách
                                        </label>
                                        <div className="flex rounded-xl overflow-hidden border-2 border-gray-200 bg-gray-50/50 focus-within:border-gray-400 focus-within:ring-2 focus-within:ring-gray-200 transition-all">
                                            <input
                                                type="text"
                                                value={budget}
                                                onChange={(e) => setBudget(e.target.value)}
                                                placeholder="Ví dụ: 15 triệu, 1000 USD..."
                                                className="flex-1 p-3 border-0 bg-transparent focus:ring-0"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                                            <ComputerDesktopIcon className="h-5 w-5 text-gray-400" />
                                            Mục đích sử dụng
                                        </label>
                                        <input
                                            type="text"
                                            value={purpose}
                                            onChange={(e) => setPurpose(e.target.value)}
                                            placeholder="Ví dụ: Gaming, Đồ họa, Văn phòng..."
                                            className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-gray-400 focus:ring-2 focus:ring-gray-200 transition-all bg-gray-50/50"
                                        />
                                    </div>
                                </div>

                                <button
                                    onClick={handleGenerateConfig}
                                    disabled={isLoading}
                                    className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-gradient-to-r from-gray-800 to-gray-700 text-white rounded-xl hover:from-gray-900 hover:to-gray-800 transition-all transform hover:scale-[1.02] disabled:opacity-70 disabled:hover:scale-100 shadow-lg"
                                >
                                    <ArrowPathIcon className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                                    <span className="font-medium">{isLoading ? 'Đang tạo cấu hình...' : 'Tạo cấu hình PC'}</span>
                                </button>
                            </div>

                            {error && (
                                <div className="mt-4 p-4 bg-red-50 border-2 border-red-200 rounded-xl text-red-600 text-sm">
                                    {error}
                                </div>
                            )}

                            {(config !== null || isLoading) && (
                                <div className="mt-8">
                                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-8 rounded-xl border-2 border-gray-200 text-center transform transition-all hover:scale-[1.02]">
                                        <p className="text-sm text-gray-600 mb-3">Cấu hình PC được đề xuất</p>
                                        <div className="space-y-4">
                                            <div>
                                                <p className="text-3xl font-bold text-gray-800">
                                                    {isLoading ? '...' : `${config?.purpose} - ${config?.budget}`}
                                                </p>
                                                <p className="text-sm text-gray-600">
                                                    {isLoading ? '' : `Tổng giá: ${config?.totalPrice}`}
                                                </p>
                                            </div>

                                            {!isLoading && config && (
                                                <div className="text-left space-y-4">
                                                    <div className="flex items-center justify-between mb-4">
                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                type="checkbox"
                                                                id="showVND"
                                                                checked={showVNDConversion}
                                                                onChange={(e) => setShowVNDConversion(e.target.checked)}
                                                                className="rounded border-gray-300 text-gray-800 focus:ring-gray-500"
                                                            />
                                                            <label htmlFor="showVND" className="text-sm text-gray-600">
                                                                Hiển thị giá quy đổi VNĐ
                                                            </label>
                                                        </div>
                                                        <button
                                                            onClick={copyToClipboard}
                                                            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                                                        >
                                                            <ClipboardIcon className="w-5 h-5" />
                                                            <span className="text-sm font-medium">Copy cấu hình</span>
                                                        </button>
                                                    </div>

                                                    <div className="bg-white rounded-xl p-4 border border-gray-200">
                                                        <h3 className="font-medium text-gray-800 mb-4">Thành phần:</h3>
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                                            {config.components.map((component, index) => {
                                                                const ComponentIcon = componentIcons[component.name as keyof typeof componentIcons] || ComputerDesktopIcon;
                                                                const categoryName = componentNames[component.name as keyof typeof componentNames] || 'Phụ kiện khác';
                                                                return (
                                                                    <div key={index} className="bg-gray-50 rounded-xl p-4 border border-gray-200 hover:border-gray-300 transition-colors">
                                                                        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200">
                                                                            <ComponentIcon className="w-5 h-5 text-gray-600" />
                                                                            <h4 className="text-sm font-medium text-gray-700">{categoryName}</h4>
                                                                        </div>
                                                                        <div className="space-y-2">
                                                                            <div className="flex items-center justify-between">
                                                                                <span className="font-medium text-gray-800">{component.model}</span>
                                                                            </div>
                                                                            {component.note && (
                                                                                <p className="text-sm text-gray-500">{component.note}</p>
                                                                            )}
                                                                        </div>
                                                                        <div className="flex items-center justify-between mt-2">
                                                                            <span className="text-gray-600">
                                                                                {formatPrice(component.price, showVNDConversion)}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                )
                                                            })}
                                                        </div>
                                                    </div>

                                                    {config.notes.length > 0 && (
                                                        <div className="bg-white rounded-xl p-4 border border-gray-200">
                                                            <h3 className="font-medium text-gray-800 mb-3">Lưu ý:</h3>
                                                            <div className="space-y-2">
                                                                {config.notes.map((note, index) => (
                                                                    <div key={index} className="flex items-start gap-2">
                                                                        <span className="text-gray-500">•</span>
                                                                        <span className="text-gray-600">{note}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {configHistory.length > 0 && (
                                <div className="mt-8">
                                    <div className="flex items-center justify-between mb-3">
                                        <p className="text-sm font-medium text-gray-800">📜 Lịch sử cấu hình</p>
                                        <button
                                            onClick={resetHistory}
                                            className="text-xs text-gray-600 hover:text-gray-800 transition-colors flex items-center gap-1"
                                        >
                                            <TrashIcon className="w-4 h-4" />
                                            Xóa lịch sử
                                        </button>
                                    </div>

                                    <div className="bg-gray-50 rounded-xl border-2 border-gray-200 overflow-hidden">
                                        <div className="divide-y divide-gray-200">
                                            {configHistory.map((item, index) => (
                                                <div key={index} className="p-4 text-sm hover:bg-gray-100 transition-colors">
                                                    <p className="font-medium text-gray-800">{item.purpose} - {formatPrice(item.budget)}</p>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-gray-600">{item.components.length} thành phần</span>
                                                        <span className="text-xs text-gray-500">{formatPrice(item.totalPrice)}</span>
                                                    </div>
                                                </div>
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
    )
} 