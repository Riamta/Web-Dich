import ConversationTranslator from '@/components/ConversationTranslator'

export default function ConversationPage() {
  return (
    <div className="container max-w-6xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dịch hội thoại</h1>
        <p className="text-gray-500 mt-2">
          Dịch hội thoại hai chiều với nhiều ngôn ngữ khác nhau. Chọn ngôn ngữ của bạn và ngôn ngữ của người đối thoại để bắt đầu.
        </p>
      </div>

      <ConversationTranslator />
    </div>
  )
} 