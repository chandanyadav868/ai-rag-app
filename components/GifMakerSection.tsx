import React from 'react'
import AnimatedSection from './AnimatedSection'
import Link from 'next/link'
import { Layers, Play, ImageIcon, Palette, Film, ArrowRight } from 'lucide-react'

const features = [
  { icon: <Layers size={20} className='text-blue-400' />, label: 'Advanced Layer Management', color: 'blue' },
  { icon: <Play size={20} className='text-green-400' />, label: 'Frame-by-Frame Timeline', color: 'green' },
  { icon: <Palette size={20} className='text-pink-400' />, label: 'Shapes, Text & Custom Colors', color: 'pink' },
]

function GifMakerSection() {
  return (
    <AnimatedSection className='mx-auto mt-20 w-full max-w-7xl rounded-3xl border border-white/5 bg-[#121212]/80 backdrop-blur-sm px-4 py-12 sm:px-8 lg:px-12 shadow-2xl overflow-hidden hover:border-white/10 transition-colors'>
      <div className='flex flex-col gap-10 lg:flex-row-reverse lg:items-center lg:justify-between'>

        {/* Text Content */}
        <div className='flex min-w-0 flex-1 flex-col z-10'>
          <div className="flex items-center gap-2 mb-4">
            <span className="bg-blue-600/20 text-blue-400 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">New Tool</span>
          </div>
          <h1 className='show-Section-Heading tracking-tight mb-4'>
            Professional GIF<br className='hidden sm:block' /> Maker Studio
          </h1>
          <p className='commonText text-gray-400 mb-8 max-w-xl'>
            Bring your images to life with a powerful timeline animation system and full layer control. Drag, drop, edit shapes & text, then export stunning high-quality GIFs directly from your browser.
          </p>

          <div className='flex flex-col gap-4 mb-8'>
            {features.map(({ icon, label, color }) => (
              <div key={label} className='flex items-center gap-3'>
                <div className={`bg-white/5 p-2 rounded-lg border border-white/5`}>{icon}</div>
                <span className='font-medium text-gray-300'>{label}</span>
              </div>
            ))}
          </div>

          <Link
            href='/gif-maker'
            className='group flex w-fit items-center gap-2 rounded-xl bg-white px-8 py-3.5 text-sm font-bold text-black transition-all hover:bg-gray-200 shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(255,255,255,0.35)]'
          >
            Open GIF Maker
            <ArrowRight size={16} className='transition-transform group-hover:translate-x-1' />
          </Link>
        </div>

        {/* Visual Showcase (Mock Editor) */}
        <AnimatedSection delay={300} className='w-full shrink-0 lg:w-[52%]'>
          <div className='relative w-full aspect-video rounded-2xl border border-white/10 bg-[#0a0a0b] shadow-2xl overflow-hidden group'>
            
            {/* Title Bar */}
            <div className='h-9 border-b border-white/10 bg-[#161618] flex items-center justify-between px-4'>
              <div className='flex items-center gap-2'>
                <div className='w-3 h-3 rounded-full bg-red-500/70'></div>
                <div className='w-3 h-3 rounded-full bg-yellow-500/70'></div>
                <div className='w-3 h-3 rounded-full bg-green-500/70'></div>
              </div>
              <span className='text-white/30 text-xs font-medium'>GIF Studio</span>
              <div className='w-16' />
            </div>

            {/* Canvas Area */}
            <div className='flex flex-1 h-[calc(100%-36px-52px)] relative overflow-hidden'>
              {/* Side Layers Panel */}
              <div className='hidden sm:flex w-28 border-r border-white/5 bg-[#161618] flex-col gap-1.5 p-2'>
                <div className='text-[9px] font-bold uppercase tracking-widest text-white/30 px-1 mb-1'>Layers</div>
                {['Text Layer', 'Image', 'Rectangle', 'Background'].map((layer, i) => (
                  <div key={layer} className={`text-[10px] text-white/60 rounded-md px-2 py-1.5 font-medium transition-colors ${i === 0 ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30' : 'hover:bg-white/5'}`}>
                    {layer}
                  </div>
                ))}
              </div>

              {/* Main Canvas */}
              <div className='flex-1 bg-black flex items-center justify-center relative overflow-hidden'>
                <div className='absolute inset-0 bg-gradient-to-br from-blue-500/8 to-purple-500/8'></div>
                <div className='absolute inset-0' style={{backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize: '20px 20px'}}></div>
                {/* Mock canvas content */}
                <div className='relative z-10 flex flex-col items-center gap-3'>
                  <div className='rounded-xl bg-blue-500/20 border border-blue-400/30 px-6 py-2'>
                    <span className='text-blue-300 font-bold text-base tracking-wide'>Hello World!</span>
                  </div>
                  <div className='flex gap-2'>
                    <div className='w-8 h-8 rounded-full bg-pink-500/60 border border-pink-400/40'></div>
                    <div className='w-14 h-8 rounded-md bg-purple-500/60 border border-purple-400/40'></div>
                    <div className='w-0 h-0 border-l-[16px] border-r-[16px] border-b-[28px] border-l-transparent border-r-transparent border-b-cyan-500/60 self-center'></div>
                  </div>
                </div>
                {/* Zoom indicator */}
                <div className='absolute bottom-2 right-2 text-[10px] text-white/30 bg-black/40 rounded px-2 py-0.5'>100%</div>
              </div>
            </div>

            {/* Timeline Bar */}
            <div className='h-[52px] border-t border-white/10 bg-[#161618] flex items-center px-4 gap-2'>
              <div className='flex items-center gap-1.5 mr-3'>
                <div className='w-5 h-5 rounded-full bg-white/80 flex items-center justify-center'>
                  <Play size={9} fill='black' className='text-black ml-0.5' />
                </div>
              </div>
              {[1, 2, 3, 4].map(n => (
                <div key={n} className={`h-9 w-14 rounded border-2 transition-colors group-hover:scale-[1.02] ${n === 1 ? 'border-blue-500/70 bg-blue-500/10' : 'border-white/10 bg-white/5 group-hover:bg-white/8'}`}>
                  <div className='flex items-end justify-start h-full px-1 pb-1'>
                    <span className='text-[9px] font-bold text-white/40'>{n}</span>
                  </div>
                </div>
              ))}
              <div className='ml-auto rounded-lg bg-green-600/70 px-3 py-1 text-[10px] font-bold text-white border border-green-500/30'>
                Export GIF
              </div>
            </div>
          </div>
        </AnimatedSection>

      </div>
    </AnimatedSection>
  )
}

export default GifMakerSection
