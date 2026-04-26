import React from 'react'
import AnimatedSection from './AnimatedSection'
import Link from 'next/link'
import { Layers, Play, Image as ImageIcon, Video } from 'lucide-react'

function GifMakerSection() {
  return (
    <AnimatedSection className='mx-auto mt-20 w-full max-w-7xl rounded-3xl border border-white/5 bg-[#121212]/80 backdrop-blur-sm px-4 py-12 sm:px-8 lg:px-12 shadow-2xl overflow-hidden hover:border-white/10 transition-colors'>
      <div className='flex flex-col gap-10 lg:flex-row lg:items-center lg:justify-between'>
        
        {/* Text Content */}
        <div className='flex min-w-0 flex-1 flex-col z-10'>
          <div className="flex items-center gap-2 mb-4">
            <span className="bg-blue-600/20 text-blue-400 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">New Feature</span>
          </div>
          <h1 className='show-Section-Heading tracking-tight mb-4'>Professional GIF Maker Studio</h1>
          <p className='commonText text-gray-400 mb-8 max-w-xl'>
            Bring your images to life with our advanced timeline animation and layer management system. Drag, drop, edit, and instantly export high-quality GIFs right in your browser.
          </p>

          <div className='flex flex-col gap-4 mb-8'>
            <div className='flex items-center gap-3'>
              <div className='bg-white/5 p-2 rounded-lg'><Layers size={20} className='text-blue-400'/></div>
              <span className='font-medium text-gray-300'>Advanced Layer Management</span>
            </div>
            <div className='flex items-center gap-3'>
              <div className='bg-white/5 p-2 rounded-lg'><Play size={20} className='text-green-400'/></div>
              <span className='font-medium text-gray-300'>Frame-by-Frame Timeline</span>
            </div>
            <div className='flex items-center gap-3'>
              <div className='bg-white/5 p-2 rounded-lg'><ImageIcon size={20} className='text-purple-400'/></div>
              <span className='font-medium text-gray-300'>Custom Text & Vector Shapes</span>
            </div>
          </div>

          <Link href='/gif-maker' className='w-fit rounded-xl bg-white px-8 py-3.5 text-sm font-bold text-black transition-all hover:bg-gray-200 shadow-[0_0_20px_rgba(255,255,255,0.3)]'>
            Try GIF Maker Now
          </Link>
        </div>

        {/* Visual Showcase */}
        <AnimatedSection delay={300} className='w-full max-w-2xl shrink-0 lg:w-[50%]'>
          <div className='relative w-full aspect-video rounded-2xl border border-white/10 bg-[#0a0a0b] shadow-2xl overflow-hidden group'>
            {/* Mock Editor UI */}
            <div className='absolute inset-0 flex flex-col'>
              <div className='h-8 border-b border-white/10 bg-[#161618] flex items-center px-4 gap-2'>
                <div className='w-2.5 h-2.5 rounded-full bg-red-500/50'></div>
                <div className='w-2.5 h-2.5 rounded-full bg-yellow-500/50'></div>
                <div className='w-2.5 h-2.5 rounded-full bg-green-500/50'></div>
              </div>
              <div className='flex-1 flex items-center justify-center bg-black relative overflow-hidden'>
                <div className='absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 mix-blend-overlay'></div>
                <div className='absolute h-full w-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/5 via-transparent to-transparent'></div>
                <Video size={64} className='text-white/20 group-hover:text-white/40 transition-colors duration-500 group-hover:scale-110 z-10' />
              </div>
              <div className='h-16 border-t border-white/10 bg-[#161618] flex items-center justify-center gap-2 px-4'>
                 <div className='h-10 w-14 bg-white/10 rounded border-2 border-blue-500/50 transition-colors group-hover:bg-white/20'></div>
                 <div className='h-10 w-14 bg-white/5 rounded transition-colors group-hover:bg-white/10'></div>
                 <div className='h-10 w-14 bg-white/5 rounded transition-colors group-hover:bg-white/10'></div>
                 <div className='h-10 w-14 bg-white/5 rounded transition-colors group-hover:bg-white/10'></div>
              </div>
            </div>
          </div>
        </AnimatedSection>
        
      </div>
    </AnimatedSection>
  )
}

export default GifMakerSection
