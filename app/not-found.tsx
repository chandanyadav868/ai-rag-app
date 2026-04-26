import Link from 'next/link'
import { Home, MoveLeft, Ghost } from 'lucide-react'
import AnimatedSection from '@/components/AnimatedSection'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0a0a0b] px-6 text-center">
      <AnimatedSection className="flex flex-col items-center">
        <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-3xl border border-white/10 bg-[#121212] shadow-2xl">
          <Ghost size={48} className="text-white/20 animate-bounce" />
        </div>
        
        <h1 className="hero-Section-Heading mb-4 tracking-tight">404 - Studio Lost</h1>
        <p className="commonText max-w-md text-gray-400 mb-10">
          Oops! It looks like the page you are looking for has drifted out of our creative universe. Let's get you back on track.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-2xl bg-white px-8 py-3.5 text-sm font-bold text-black transition-all hover:bg-gray-200 shadow-[0_0_20px_rgba(255,255,255,0.2)]"
          >
            <Home size={18} /> Back to Home
          </Link>
          
          <Link
            href="/gif-maker"
            className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-8 py-3.5 text-sm font-bold text-white backdrop-blur-sm transition-all hover:bg-white/10"
          >
            Open GIF Maker
          </Link>
        </div>
      </AnimatedSection>
      
      {/* Decorative Blur */}
      <div className="fixed -bottom-24 -left-24 h-96 w-96 rounded-full bg-purple-600/10 blur-[120px] pointer-events-none" />
      <div className="fixed -top-24 -right-24 h-96 w-96 rounded-full bg-cyan-600/10 blur-[120px] pointer-events-none" />
    </div>
  )
}
