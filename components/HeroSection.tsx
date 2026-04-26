import ButtonDesign from '@/app/(main)/DesignComponents/ButtonDesign'
import SlidingDesign from '@/app/(main)/DesignComponents/SlidingDesign'
import AnimatedSection from './AnimatedSection'
import React from 'react'

function HeroSection() {
  return (
    <section className='mx-auto flex w-full max-w-7xl flex-col px-4 pt-10 sm:px-6 lg:px-8'>
      <AnimatedSection className='mx-auto max-w-4xl flex flex-col items-center justify-center text-center'>
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 text-sm font-medium mb-8">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
          </span>
          Next-Gen Image Processing
        </div>
        <h1 className='hero-Section-Heading mb-2 tracking-tight'>AI Powered Image Editing</h1>
        <h1 className='hero-Section-Heading mb-6 tracking-tight'>
          Become Viral on
          <span className='bg-gradient-to-r from-red-500 via-pink-500 to-purple-500 bg-clip-text text-transparent font-extrabold ml-3'>Social Media</span>
        </h1>
        <p className='commonText text-gray-300 md:text-xl max-w-2xl mx-auto font-light'>Transform your ideas into captivating visuals with our AI-powered image generator and suite of intelligent editing tools.</p>
      </AnimatedSection>

      <AnimatedSection delay={200} className='mx-auto mt-10 flex w-full max-w-xl flex-wrap items-center justify-center gap-3 rounded-3xl border border-white/5 bg-white/[0.02] p-4 shadow-xl backdrop-blur-sm'>
        <ButtonDesign text='Get Started Free' link='image-editing' className='!text-xl px-8 py-3 !bg-gradient-to-r !from-cyan-500 !to-blue-600 !text-white !font-bold hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:scale-105 transition-all !outline-none' />
      </AnimatedSection>
      
      <AnimatedSection delay={400} className='mx-auto max-w-6xl w-full mt-14'>
        <div className='relative flex h-full w-full overflow-hidden rounded-[2rem] border border-white/10 bg-[#121212] shadow-2xl hover:border-white/20 transition-all duration-700 hover:shadow-[0_0_40px_rgba(0,0,0,0.8)]'>
          <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none z-10 hidden sm:block"></div>
          <SlidingDesign />
        </div>
      </AnimatedSection>
      
    </section>
  )
}

export default HeroSection


