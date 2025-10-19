import CSVTSVTranslation from '@/components/CSVTSVTranslation';

export const metadata = {
  title: 'CSV/TSV Translate',
  description: 'Dịch CSV/TSV bằng AI với khả năng chỉnh sửa trực tiếp',
};

export default function Page() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <h1 className="text-2xl font-semibold text-gray-800 mb-4">Dịch CSV/TSV</h1>
      <CSVTSVTranslation />
    </div>
  );
}




