import { useState, useRef, useCallback, ChangeEvent } from 'react'
import { QrCode, Upload, Scan, Copy, Download, History, Share, Maximize2 } from 'lucide-react'
import QRCodeLib from 'qrcode'
import { QrReader } from 'react-qr-reader'

interface QRScanResult {
    text: string
}

export function QRCode() {
    const [activeTab, setActiveTab] = useState<"generate" | "scan">("generate")
    const [text, setText] = useState('')
    const [qrCode, setQrCode] = useState<string>('')
    const [scanResult, setScanResult] = useState<string>('')
    const [isScannerActive, setIsScannerActive] = useState(false)
    const [error, setError] = useState<string>('')
    const fileInputRef = useRef<HTMLInputElement>(null)

    const generateQRCode = useCallback(async () => {
        if (!text) {
            setError('Please enter some text or URL')
            return
        }

        try {
            const url = await QRCodeLib.toDataURL(text, {
                width: 300,
                margin: 2,
            })
            setQrCode(url)
            setError('')
        } catch (err) {
            setError('Failed to generate QR code')
            console.error(err)
        }
    }, [text])

    const downloadQRCode = useCallback(() => {
        if (!qrCode) return
        const link = document.createElement('a')
        link.href = qrCode
        link.download = 'qrcode.png'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }, [qrCode])

    const handleFileUpload = useCallback((event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = () => {
            const img = new Image()
            img.src = reader.result as string
            img.onload = () => {
                const canvas = document.createElement('canvas')
                const ctx = canvas.getContext('2d')
                if (!ctx) return

                canvas.width = img.width
                canvas.height = img.height
                ctx.drawImage(img, 0, 0)
            }
        }
        reader.readAsDataURL(file)
    }, [])

    const handleScanResult = useCallback((result: any) => {
        if (result?.text) {
            setScanResult(result.text)
            setIsScannerActive(false)
        }
    }, [])

    return (
        <div className="max-w-5xl mx-auto p-6 bg-white rounded-xl shadow-sm">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-2">
                    <QrCode className="w-8 h-8" />
                    <div>
                        <h1 className="text-xl font-semibold">QR Code Tool</h1>
                        <p className="text-sm text-gray-500">Generate and scan QR codes easily</p>
                    </div>
                </div>
            </div>

            <div className="flex border-b mb-6">
                <button
                    className={`px-6 py-3 text-sm font-medium ${
                        activeTab === "generate"
                            ? "border-b-2 border-black text-black"
                            : "text-gray-500 hover:text-black"
                    }`}
                    onClick={() => setActiveTab("generate")}
                >
                    Generate
                </button>
                <button
                    className={`px-6 py-3 text-sm font-medium ${
                        activeTab === "scan"
                            ? "border-b-2 border-black text-black"
                            : "text-gray-500 hover:text-black"
                    }`}
                    onClick={() => setActiveTab("scan")}
                >
                    Scan
                </button>
            </div>

            {activeTab === "generate" ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="block font-medium">Enter Text</label>
                            <input
                                type="text"
                                placeholder="Enter any text you want to encode"
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                            />
                        </div>

                        <button
                            onClick={generateQRCode}
                            className="w-full py-2.5 bg-black text-white rounded-lg hover:bg-gray-900"
                        >
                            Generate QR Code
                        </button>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-medium">Preview</h3>
                            <div className="flex items-center space-x-2">
                                <button className="p-2 hover:bg-gray-200 rounded-lg">
                                    <Share className="w-4 h-4" />
                                </button>
                                <button className="p-2 hover:bg-gray-200 rounded-lg">
                                    <Maximize2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {qrCode ? (
                            <div className="flex flex-col items-center justify-center min-h-[300px]">
                                <img src={qrCode} alt="Generated QR Code" className="w-64 h-64 border border-gray-200 rounded-lg p-4 bg-white" />
                                <button
                                    onClick={downloadQRCode}
                                    className="mt-4 px-6 py-2.5 bg-black text-white rounded-lg hover:bg-gray-900 flex items-center"
                                >
                                    <Download className="w-4 h-4 mr-2" />
                                    Download
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center min-h-[300px] text-gray-400">
                                <QrCode className="w-16 h-16 mb-2" />
                                <p>Your QR code will appear here</p>
                            </div>
                        )}

                        {error && <p className="mt-2 text-red-500 text-sm">{error}</p>}
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <div className="space-y-4">
                            <button
                                onClick={() => setIsScannerActive(!isScannerActive)}
                                className={`w-full py-2.5 rounded-lg text-white ${
                                    isScannerActive ? "bg-red-500 hover:bg-red-600" : "bg-black hover:bg-gray-900"
                                }`}
                            >
                                {isScannerActive ? "Stop Scanner" : "Start Scanner"}
                            </button>

                            <div className="relative">
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center justify-center"
                                >
                                    <Upload className="w-4 h-4 mr-2" />
                                    Upload QR Code Image
                                </button>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleFileUpload}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-6">
                        {isScannerActive ? (
                            <div className="relative aspect-square w-full overflow-hidden rounded-lg">
                                <QrReader
                                    onResult={handleScanResult}
                                    constraints={{ facingMode: 'environment' }}
                                    className="w-full h-full"
                                />
                            </div>
                        ) : scanResult ? (
                            <div className="space-y-4">
                                <h3 className="font-medium">Scanned Result</h3>
                                <div className="p-4 bg-white rounded-lg border border-gray-200 break-all">
                                    {scanResult}
                                </div>
                                <button
                                    onClick={() => navigator.clipboard.writeText(scanResult)}
                                    className="w-full py-2.5 bg-black text-white rounded-lg hover:bg-gray-900 flex items-center justify-center"
                                >
                                    <Copy className="w-4 h-4 mr-2" />
                                    Copy to Clipboard
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center min-h-[300px] text-gray-400">
                                <Scan className="w-16 h-16 mb-2" />
                                <p>Start scanner or upload an image</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
} 