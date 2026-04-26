import ButtonDesign from '@/app/(main)/DesignComponents/ButtonDesign'
import SlidingDesign from '@/app/(main)/DesignComponents/SlidingDesign'
import AnimatedSection from './AnimatedSection'
import React from 'react'
import Link from 'next/link'
import { Sparkles, Clapperboard, ArrowRight } from 'lucide-react'

function HeroSection() {
  return (
    <section className='mx-auto flex w-full max-w-7xl flex-col px-4 pt-10 sm:px-6 lg:px-8'>
      <AnimatedSection className='mx-auto max-w-4xl flex flex-col items-center justify-center text-center'>
        {/* Live Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 text-sm font-medium mb-8">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
          </span>
          Now live — Image AI & Professional GIF Maker
        </div>

        {/* Main Heading */}
        <h1 className='hero-Section-Heading mb-3 tracking-tight'>
          Create. Edit. Animate.
        </h1>
        <h1 className='hero-Section-Heading mb-6 tracking-tight'>
          Go Viral on{' '}
          <span className='bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent font-extrabold'>
            Social Media
          </span>
        </h1>
        
        <p className='commonText text-gray-400 md:text-xl max-w-2xl mx-auto font-light mb-10'>
          The all-in-one creative studio. Generate stunning images with AI and craft professional animated GIFs — all in your browser, no software needed.
        </p>

        {/* CTA Buttons */}
        <div className='flex flex-wrap items-center justify-center gap-4 mb-14'>
          <Link
            href='/image-ai'
            className='flex items-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-cyan-600 px-8 py-3.5 text-sm font-bold text-white shadow-[0_0_24px_rgba(147,51,234,0.4)] transition-all hover:scale-105 hover:shadow-[0_0_32px_rgba(147,51,234,0.6)]'
          >
            <Sparkles size={18} /> Try Image AI
          </Link>
          <Link
            href='/gif-maker'
            className='flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-8 py-3.5 text-sm font-bold text-white backdrop-blur-sm transition-all hover:bg-white/10 hover:border-white/30 hover:scale-105'
          >
            <Clapperboard size={18} /> Open GIF Maker
          </Link>
        </div>

        {/* Feature Pills */}
        <div className='flex flex-wrap justify-center gap-3 text-xs font-medium text-white/50 mb-14'>
          {['AI Image Generation', 'Object Removal', 'GIF Timeline', 'Layer Editor', 'Export & Share'].map((pill) => (
            <span key={pill} className='rounded-full border border-white/10 bg-white/5 px-4 py-1.5'>
              {pill}
            </span>
          ))}
        </div>
      </AnimatedSection>

      {/* Hero Visual */}
      <AnimatedSection delay={400} className='mx-auto max-w-6xl w-full'>
        <div className='relative flex h-full w-full overflow-hidden rounded-[2rem] border border-white/10 bg-[#121212] shadow-2xl hover:border-white/20 transition-all duration-700 hover:shadow-[0_0_60px_rgba(147,51,234,0.15)]'>
          <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none z-10 hidden sm:block"></div>
          <SlidingDesign />
        </div>
      </AnimatedSection>
      
    </section>
  )
}

export default HeroSection
