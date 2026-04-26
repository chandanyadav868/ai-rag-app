import Image from 'next/image';
import React, { useRef, useState } from 'react'
import CopyBox from './CopyBox';
import AnimatedSection from './AnimatedSection';
import Link from 'next/link';
import { Sparkles, Wand2 } from 'lucide-react';

interface BeforeAfterComponentsProps {
  beforePhoto: string;
  afterPhoto: string;
  headingTags: string;
  paragraphTags: string;
  copyTags: string;
}

function BeforeAfterComponents({afterPhoto,beforePhoto,copyTags,headingTags,paragraphTags}:BeforeAfterComponentsProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [position, setPosition] = useState<number>(50);
  const copyingRefELement = useRef<(HTMLParagraphElement | null)[]>([])
  const [copying, setCopying] = useState<{ id: number; active: boolean; } | undefined>()

  const handleEvent = (e: React.MouseEvent) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = e.clientX 
    const rectX = rect.left 
    const x = clientX - rectX 
    const percentage = (x / rect.width) * 100;
    const saftyPercentage = Math.max(0, Math.min(100, percentage));
    setPosition(saftyPercentage);
  }

  const copyToClipboard = (index: number) => {
    if (!copyingRefELement.current) return
    setCopying({ id: index, active: true })
    const text = copyingRefELement.current[index]?.innerText ?? ''
    navigator.clipboard.writeText(text);

    setTimeout(() => {
      setCopying(undefined)
    }, 1000);
  }

  return (
    <AnimatedSection className='mx-auto mt-20 w-full max-w-7xl rounded-3xl border border-white/5 bg-[#121212]/80 backdrop-blur-sm px-4 py-12 sm:px-8 lg:px-12 shadow-2xl overflow-hidden hover:border-white/10 transition-colors'>
      <div className='flex flex-col gap-10 lg:flex-row lg:items-center lg:justify-between'>
        
        {/* Text Content */}
        <div className='flex min-w-0 flex-1 flex-col z-10'>
          <div className="flex items-center gap-2 mb-4">
            <span className="bg-purple-600/20 text-purple-400 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">AI Feature</span>
          </div>
          <h1 className='show-Section-Heading tracking-tight mb-4'>{headingTags}</h1>
          <p className='commonText text-gray-400 mb-8 max-w-xl'>
            {paragraphTags}
          </p>

          <div className='flex flex-col gap-4 mb-8'>
            <div className='flex items-center gap-3'>
              <div className='bg-white/5 p-2 rounded-lg'><Sparkles size={20} className='text-purple-400'/></div>
              <span className='font-medium text-gray-300'>Smart Object Removal</span>
            </div>
            <div className='flex items-center gap-3'>
              <div className='bg-white/5 p-2 rounded-lg'><Wand2 size={20} className='text-cyan-400'/></div>
              <span className='font-medium text-gray-300'>Seamless Background Infill</span>
            </div>
          </div>

          <Link href='/image-ai' className='w-fit rounded-xl bg-white px-8 py-3.5 text-sm font-bold text-black transition-all hover:bg-gray-200 shadow-[0_0_20px_rgba(255,255,255,0.3)] mb-8'>
            Try Image AI Now
          </Link>
          
          <div className='w-full'>
             <p className='text-xs text-white/50 mb-2 uppercase font-bold tracking-wider'>Example Prompt</p>
             <div className='copyingSectionScrollbar flex w-full gap-4 overflow-x-auto pb-4'>
               {Array.from({ length: 1 }).map((_, index) => (
                 <CopyBox key={index} copyRef={copyingRefELement} copying={copying} width={80} copyToClipboard={copyToClipboard} index={index} text={copyTags} className='bg-white/[0.03] border-white/10 hover:bg-white/[0.06] transition-colors rounded-2xl p-4 w-full' />
               ))}
             </div>
          </div>
        </div>

        {/* Visual Showcase (Slider) */}
        <AnimatedSection delay={200} className='w-full max-w-2xl shrink-0 lg:w-[50%]'>
          <div ref={containerRef}
            onMouseDown={handleEvent}
            onMouseMove={(el) => el.buttons === 1 && handleEvent(el)} 
            className='relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0b] cursor-col-resize shadow-2xl hover:border-white/20 hover:shadow-[0_0_30px_rgba(255,255,255,0.1)] transition-all'>

            <Image src={beforePhoto} width={1000} height={1000} alt='Before' className='object-cover top-0 left-0 w-full h-full' style={{ zIndex: 99 }} />

            {/* After Image Wrapper */}
            <div
              className="absolute top-0 left-0 h-full overflow-hidden"
              style={{ clipPath: `inset(0 0 0 ${position}%)` }}
            >
              <Image
                src={afterPhoto}
                width={1000}
                height={1000}
                alt="After"
                className="w-full h-full object-cover"
              />
            </div>

            <div style={{ zIndex: 99, left: `${position}%`, transform: `translateX(-50%)` }} className='h-full w-[2px] bg-purple-400/80 absolute top-0 left-0 drop-shadow-[0_0_8px_rgba(168,85,247,0.8)] pointer-events-none'>
              {/* Drag handle circle */}
              <div className="absolute top-1/2 -translate-y-1/2 -left-[11px] w-6 h-6 bg-purple-500 rounded-full shadow-[0_0_12px_rgba(168,85,247,0.9)] border-2 border-white flex items-center justify-center pointer-events-none">
                <div className="flex gap-0.5">
                  <div className="w-0.5 h-2.5 bg-black/40 rounded-full"></div>
                  <div className="w-0.5 h-2.5 bg-black/40 rounded-full"></div>
                </div>
              </div>
            </div>
            
            <div className='absolute bottom-4 left-4 z-50 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 text-xs font-bold text-white uppercase tracking-wider'>Before</div>
            <div className='absolute bottom-4 right-4 z-50 bg-purple-600/60 backdrop-blur-md px-3 py-1 rounded-full border border-purple-400/30 text-xs font-bold text-white uppercase tracking-wider'>After</div>

          </div>
        </AnimatedSection>
      </div>
    </AnimatedSection>
  )
}

export default BeforeAfterComponents
