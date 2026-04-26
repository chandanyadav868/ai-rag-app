import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Professional GIF Maker Studio',
  description: 'Create professional animated GIFs in your browser. Add layers, text, shapes, and manage your timeline with our intuitive studio interface.',
  openGraph: {
    title: 'Professional GIF Maker Studio | Polish AI',
    description: 'The ultimate online studio for creating high-quality animated GIFs.',
  }
}

export default function GifMakerLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
