import React from 'react'
import AnimatedSection from './AnimatedSection'
import Link from 'next/link'
import { Video, Zap, BrainCircuit, ShieldCheck, ArrowRight, Play, Sparkles } from 'lucide-react'

const features = [
  { icon: <Zap size={20} className='text-cyan-400' />, label: 'Real-time Processing', desc: 'Neural engines optimized for speed.' },
  { icon: <BrainCircuit size={20} className='text-purple-400' />, label: 'Edge Precision', desc: 'Handles complex hair and details.' },
  { icon: <ShieldCheck size={20} className='text-emerald-400' />, label: 'Privacy Secured', desc: 'Secure local-first processing.' },
]

function VideoAiSection() {
  return (
    <AnimatedSection className='mx-auto mt-20 w-full max-w-7xl rounded-[48px] border border-white/5 bg-[#0a182b]/40 backdrop-blur-3xl px-6 py-16 sm:px-10 lg:px-16 shadow-[0_32px_64px_rgba(0,0,0,0.5)] overflow-hidden hover:border-cyan-500/10 transition-all duration-700'>
      <div className='flex flex-col gap-12 lg:flex-row lg:items-center lg:justify-between'>

        {/* Text Content */}
        <div className='flex min-w-0 flex-1 flex-col z-10'>
          <div className="flex items-center gap-2 mb-6">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                <Sparkles size={12} />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">New Era of Video AI</span>
            </div>
          </div>
          <h2 className='text-4xl md:text-6xl font-black tracking-tight text-white mb-6 leading-[1.1]'>
            AI Video <br />
            <span className="bg-gradient-to-r from-cyan-400 to-blue-600 bg-clip-text text-transparent">Background Removal</span>
          </h2>
          <p className='text-lg text-white/40 mb-10 max-w-xl font-medium leading-relaxed'>
            Transform your video content instantly. Our state-of-the-art AI removes backgrounds from any video with cinematic precision, all within your browser.
          </p>

          <div className='grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12'>
            {features.map(({ icon, label, desc }) => (
              <div key={label} className='flex flex-col gap-3 p-4 rounded-3xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] transition-all'>
                <div className='bg-white/5 w-10 h-10 flex items-center justify-center rounded-xl border border-white/5'>{icon}</div>
                <div>
                    <div className='text-sm font-black text-white/90 mb-1'>{label}</div>
                    <div className='text-[10px] text-white/40 font-medium leading-normal'>{desc}</div>
                </div>
              </div>
            ))}
          </div>

          <Link
            href='/video-bg-removal'
            className='group flex w-fit items-center gap-3 rounded-2xl bg-white px-10 py-4 text-xs font-black uppercase tracking-widest text-black transition-all hover:bg-cyan-400 shadow-xl shadow-cyan-500/10 hover:shadow-cyan-500/25 active:scale-95'
          >
            Start Editing Video
            <ArrowRight size={16} className='transition-transform group-hover:translate-x-1' />
          </Link>
        </div>

        {/* Visual Showcase */}
        <AnimatedSection delay={300} className='w-full shrink-0 lg:w-[45%]'>
          <div className='relative w-full aspect-[4/5] rounded-[40px] border border-white/10 bg-black shadow-2xl overflow-hidden group'>
             {/* Mock Video Preview */}
             <div className="absolute inset-0 bg-[url('https://ik.imagekit.io/o66qwandt/images/canvas-export%20(15).png?updatedAt=1759047926139')] bg-cover bg-center transition-all duration-1000 group-hover:scale-110"></div>
             <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent"></div>
             
             {/* Scanline Effect */}
             <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-full h-px bg-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.8)] animate-scan absolute top-0"></div>
             </div>

             {/* UI Overlays */}
             <div className="absolute top-6 left-6 right-6 flex items-center justify-between">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/60 border border-white/10 backdrop-blur-md">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                    <span className="text-[10px] font-black text-white tracking-widest uppercase">Analyzing...</span>
                </div>
                <div className="p-2.5 rounded-xl bg-black/60 border border-white/10 backdrop-blur-md text-white/40">
                    <Video size={16} />
                </div>
             </div>

             <div className="absolute bottom-6 left-6 right-6">
                <div className="p-6 rounded-[32px] bg-black/60 border border-white/10 backdrop-blur-2xl space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-cyan-500 flex items-center justify-center text-black">
                                <Play size={16} fill="black" />
                            </div>
                            <div>
                                <div className="text-[10px] font-black text-white uppercase tracking-widest">Previewing</div>
                                <div className="text-[9px] text-white/40 font-medium">Neural Mask Applied</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            {[1,2,3].map(i => <div key={i} className="w-1 h-3 rounded-full bg-cyan-500/40"></div>)}
                        </div>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                        <div className="h-full w-2/3 bg-cyan-500 rounded-full shadow-[0_0_10px_rgba(6,182,212,0.5)]"></div>
                    </div>
                </div>
             </div>
          </div>
        </AnimatedSection>

      </div>
    </AnimatedSection>
  )
}

export default VideoAiSection
