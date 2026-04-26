import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Give Your Feedback',
  description: 'Share your experience with Polish AI. We value your feedback to improve our image editing and GIF maker tools.',
}

export default function FeedbackLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
