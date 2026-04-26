import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'AI Image Generator & Editor',
  description: 'Generate high-quality images from text descriptions using Gemini AI. Enhance your photos with professional artistic styles and effects.',
  openGraph: {
    title: 'AI Image Generator & Editor | Polish AI',
    description: 'Create stunning visuals with our advanced AI image generator.',
  }
}

export default function ImageAiLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
