'use client'

import { useState, useEffect, useRef } from 'react'
import { Html5QrcodeScanner } from 'html5-qrcode'
import QRCode from 'qrcode'
import { ClipboardDocumentIcon } from '@heroicons/react/24/outline'

export function QRCodeComponent() {
    const [text, setText] = useState('')
    const [qrCode, setQrCode] = useState('')
    const [scanResult, setScanResult] = useState('')
    const [isScanning, setIsScanning] = useState(false)
    const scannerRef = useRef<Html5QrcodeScanner | null>(null)

    useEffect(() => {
        return () => {
            // Cleanup scanner on unmount
            if (scannerRef.current) {
                scannerRef.current.clear()
            }
        }
    }, [])

    const generateQR = async () => {
        try {
            const url = await QRCode.toDataURL(text)
            setQrCode(url)
        } catch (err) {
            console.error('Failed to generate QR code:', err)
        }
    }

    const startScanner = () => {
        setIsScanning(true)
        scannerRef.current = new Html5QrcodeScanner(
            'qr-reader',
            { fps: 10, qrbox: { width: 250, height: 250 } },
            /* verbose= */ false
        )

        scannerRef.current.render(onScanSuccess, onScanFailure)
    }

    const stopScanner = () => {
        if (scannerRef.current) {
            scannerRef.current.clear()
            setIsScanning(false)
        }
    }

    const onScanSuccess = (decodedText: string) => {
        setScanResult(decodedText)
        stopScanner()
    }

    const onScanFailure = (error: string) => {
        // Handle scan failure if needed
        console.warn(`QR code scan failed: ${error}`)
    }

    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text)
        } catch (err) {
            console.error('Failed to copy:', err)
        }
    }

    const downloadQR = () => {
        const link = document.createElement('a')
        link.href = qrCode
        link.download = 'qrcode.png'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
                    {/* Generate QR Section */}
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold">Tạo mã QR</h2>
                        <div>
                            <input
                                type="text"
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                placeholder="Nhập nội dung..."
                                className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                            />
                        </div>
                        <button
                            onClick={generateQR}
                            className="w-full py-2 bg-black text-white rounded-lg hover:bg-gray-900 transition-colors"
                        >
                            Tạo mã QR
                        </button>
                        {qrCode && (
                            <div className="space-y-4">
                                <div className="flex justify-center">
                                    <img src={qrCode} alt="QR Code" className="w-48 h-48" />
                                </div>
                                <button
                                    onClick={downloadQR}
                                    className="w-full py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                    Tải xuống
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Scan QR Section */}
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold">Quét mã QR</h2>
                        {!isScanning ? (
                            <button
                                onClick={startScanner}
                                className="w-full py-2 bg-black text-white rounded-lg hover:bg-gray-900 transition-colors"
                            >
                                Bắt đầu quét
                            </button>
                        ) : (
                            <button
                                onClick={stopScanner}
                                className="w-full py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                            >
                                Dừng quét
                            </button>
                        )}
                        <div id="qr-reader" className="w-full"></div>
                        {scanResult && (
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <div className="flex items-center justify-between gap-2">
                                    <p className="text-sm break-all">{scanResult}</p>
                                    <button
                                        onClick={() => copyToClipboard(scanResult)}
                                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                                    >
                                        <ClipboardDocumentIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
} 