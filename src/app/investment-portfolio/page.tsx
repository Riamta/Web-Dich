import InvestmentPortfolio from '@/components/InvestmentPortfolio';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Quản Lý Đầu Tư | Investment Portfolio',
    description: 'Theo dõi và quản lý danh mục đầu tư chứng khoán và tiền điện tử',
    keywords: 'đầu tư, chứng khoán, tiền điện tử, crypto, portfolio, quản lý đầu tư',
};

export default function InvestmentPortfolioPage() {
    return (
        <main className="min-h-screen bg-background">
            <div className="container mx-auto py-8">
                <h1 className="text-3xl font-bold text-center mb-8">
                    Quản Lý Đầu Tư
                </h1>
                <InvestmentPortfolio />
            </div>
        </main>
    );
} 