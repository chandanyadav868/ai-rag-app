import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'AI Chat Assistant',
  description: 'Chat with our advanced AI assistant. Get help with creative projects, summarize content, and explore new ideas with Gemini AI.',
  openGraph: {
    title: 'AI Chat Assistant | Polish AI',
    description: 'Intelligent conversation and creative assistance with our AI chat studio.',
  }
}

export default function ChatAiLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
