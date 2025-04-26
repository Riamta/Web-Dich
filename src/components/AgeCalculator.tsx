'use client'

import { useState } from 'react'
import { CalendarIcon, ClockIcon, CakeIcon, HeartIcon, StarIcon } from '@heroicons/react/24/outline'

interface AgeResult {
    years: number
    months: number
    days: number
    hours: number
    minutes: number
    seconds: number
    totalDays: number
    totalMonths: number
    totalYears: number
    nextBirthday: {
        days: number
        months: number
        date: string
    }
    zodiac: string
    generation: string
}

const zodiacSigns = [
    { name: 'Bạch Dương', date: [3, 21, 4, 19] },
    { name: 'Kim Ngưu', date: [4, 20, 5, 20] },
    { name: 'Song Tử', date: [5, 21, 6, 21] },
    { name: 'Cự Giải', date: [6, 22, 7, 22] },
    { name: 'Sư Tử', date: [7, 23, 8, 22] },
    { name: 'Xử Nữ', date: [8, 23, 9, 22] },
    { name: 'Thiên Bình', date: [9, 23, 10, 23] },
    { name: 'Thiên Yết', date: [10, 24, 11, 21] },
    { name: 'Nhân Mã', date: [11, 22, 12, 21] },
    { name: 'Ma Kết', date: [12, 22, 1, 19] },
    { name: 'Bảo Bình', date: [1, 20, 2, 18] },
    { name: 'Song Ngư', date: [2, 19, 3, 20] }
]

const generations = [
    { name: 'Thế hệ Alpha', range: [2010, 2030] },
    { name: 'Thế hệ Z', range: [1997, 2009] },
    { name: 'Thế hệ Millennials', range: [1981, 1996] },
    { name: 'Thế hệ X', range: [1965, 1980] },
    { name: 'Thế hệ Baby Boomers', range: [1946, 1964] },
    { name: 'Thế hệ Silent', range: [1928, 1945] }
]

export default function AgeCalculator() {
    const [birthDate, setBirthDate] = useState<string>('')
    const [ageResult, setAgeResult] = useState<AgeResult | null>(null)

    const formatDate = (date: Date): string => {
        const day = date.getDate().toString().padStart(2, '0')
        const month = (date.getMonth() + 1).toString().padStart(2, '0')
        const year = date.getFullYear().toString()
        return `${day}/${month}/${year}`
    }

    const parseDate = (dateStr: string): Date | null => {
        const [day, month, year] = dateStr.split('/').map(Number)
        if (isNaN(day) || isNaN(month) || isNaN(year)) return null
        return new Date(year, month - 1, day)
    }

    const calculateAge = (birthDateStr: string) => {
        const birth = parseDate(birthDateStr)
        if (!birth) return

        const now = new Date()

        // Tính tuổi chính xác
        let years = now.getFullYear() - birth.getFullYear()
        let months = now.getMonth() - birth.getMonth()
        let days = now.getDate() - birth.getDate()
        if (days < 0) {
            months--
            const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, birth.getDate())
            days = Math.floor((now.getTime() - lastMonth.getTime()) / (1000 * 60 * 60 * 24))
        }

        if (months < 0) {
            years--
            months += 12
        }

        // Tính tổng số ngày, tháng, năm đã sống
        const totalDays = Math.floor((now.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24))
        const totalMonths = Math.floor(totalDays / 30.44) // Sử dụng giá trị trung bình của tháng
        const totalYears = Math.floor(totalDays / 365.25) // Sử dụng giá trị trung bình của năm

        // Tính giờ, phút, giây
        const diff = now.getTime() - birth.getTime()
        const hours = Math.floor(diff / (1000 * 60 * 60))
        const minutes = Math.floor(diff / (1000 * 60))
        const seconds = Math.floor(diff / 1000)

        // Tính ngày sinh nhật tiếp theo
        const nextBirthday = new Date(now.getFullYear(), birth.getMonth(), birth.getDate())
        if (nextBirthday < now) {
            nextBirthday.setFullYear(now.getFullYear() + 1)
        }
        const daysUntilBirthday = Math.ceil((nextBirthday.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        const monthsUntilBirthday = Math.floor(daysUntilBirthday / 30)

        // Xác định cung hoàng đạo
        const month = birth.getMonth() + 1
        const day = birth.getDate()
        const zodiac = zodiacSigns.find(sign => 
            (month === sign.date[0] && day >= sign.date[1]) || 
            (month === sign.date[2] && day <= sign.date[3])
        )?.name || 'Không xác định'

        // Xác định thế hệ
        const birthYear = birth.getFullYear()
        const generation = generations.find(gen => 
            birthYear >= gen.range[0] && birthYear <= gen.range[1]
        )?.name || 'Không xác định'

        setAgeResult({
            years,
            months,
            days,
            hours,
            minutes,
            seconds,
            totalDays,
            totalMonths,
            totalYears,
            nextBirthday: {
                days: daysUntilBirthday,
                months: monthsUntilBirthday,
                date: formatDate(nextBirthday)
            },
            zodiac,
            generation
        })
    }

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        // Chỉ cho phép nhập số và dấu /
        const formattedValue = value.replace(/[^0-9/]/g, '')
        
        // Tự động thêm dấu / sau 2 số đầu và 2 số tiếp theo
        let newValue = formattedValue
        if (formattedValue.length > 2 && !formattedValue.includes('/')) {
            newValue = formattedValue.slice(0, 2) + '/' + formattedValue.slice(2)
        }
        if (formattedValue.length > 5 && formattedValue.split('/').length === 2) {
            newValue = formattedValue.slice(0, 5) + '/' + formattedValue.slice(5)
        }
        
        // Giới hạn độ dài tối đa là 10 ký tự (dd/mm/yyyy)
        if (newValue.length <= 10) {
            setBirthDate(newValue)
            if (newValue.length === 10) {
                calculateAge(newValue)
            } else {
                setAgeResult(null)
            }
        }
    }

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center gap-2 mb-6">
                    <CakeIcon className="w-6 h-6" />
                    <h2 className="text-2xl font-bold">Tính tuổi</h2>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Ngày sinh (dd/mm/yyyy)
                        </label>
                        <input
                            type="text"
                            value={birthDate}
                            onChange={handleDateChange}
                            placeholder="dd/mm/yyyy"
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-transparent"
                        />
                    </div>

                    {ageResult && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div className="p-4 bg-gray-50 rounded-md">
                                    <div className="flex items-center gap-2 mb-2">
                                        <CalendarIcon className="w-5 h-5" />
                                        <span className="font-medium">Tuổi chính xác</span>
                                    </div>
                                    <div className="text-2xl font-bold">
                                        {ageResult.years} năm, {ageResult.months} tháng, {ageResult.days} ngày
                                    </div>
                                </div>

                                <div className="p-4 bg-gray-50 rounded-md">
                                    <div className="flex items-center gap-2 mb-2">
                                        <ClockIcon className="w-5 h-5" />
                                        <span className="font-medium">Thời gian sống</span>
                                    </div>
                                    <div className="space-y-1">
                                        <div>{ageResult.totalYears.toLocaleString()} năm</div>
                                        <div>{ageResult.totalMonths.toLocaleString()} tháng</div>
                                        <div>{ageResult.totalDays.toLocaleString()} ngày</div>
                                        <div>{ageResult.hours.toLocaleString()} giờ</div>
                                        <div>{ageResult.minutes.toLocaleString()} phút</div>
                                        <div>{ageResult.seconds.toLocaleString()} giây</div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="p-4 bg-gray-50 rounded-md">
                                    <div className="flex items-center gap-2 mb-2">
                                        <HeartIcon className="w-5 h-5" />
                                        <span className="font-medium">Sinh nhật tiếp theo</span>
                                    </div>
                                    <div className="space-y-1">
                                        <div>Còn {ageResult.nextBirthday.days} ngày</div>
                                        <div>Khoảng {ageResult.nextBirthday.months} tháng</div>
                                        <div className="text-sm text-gray-600">
                                            Ngày {ageResult.nextBirthday.date}
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 bg-gray-50 rounded-md">
                                    <div className="flex items-center gap-2 mb-2">
                                        <StarIcon className="w-5 h-5" />
                                        <span className="font-medium">Thông tin thêm</span>
                                    </div>
                                    <div className="space-y-1">
                                        <div>Cung hoàng đạo: {ageResult.zodiac}</div>
                                        <div>Thế hệ: {ageResult.generation}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
} 