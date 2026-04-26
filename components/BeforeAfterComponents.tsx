import Image from 'next/image';
import React, { useRef, useState } from 'react'
import CopyBox from './CopyBox';
import AnimatedSection from './AnimatedSection';

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
    <AnimatedSection className='mx-auto my-20 flex w-full max-w-7xl flex-col gap-10 px-4 sm:px-6 lg:flex-row lg:items-center lg:px-8'>
      <div className='flex min-w-0 flex-1 flex-col px-1 sm:px-2 z-10'>
        <h1 className='show-Section-Heading tracking-tight mb-4'>{headingTags}</h1>
        <p className='commonText text-gray-400'>{paragraphTags}</p>

        <div className='copyingSectionScrollbar mx-auto mt-8 flex w-full gap-4 overflow-x-auto pb-4'>
          {Array.from({ length: 1 }).map((_, index) => (
            <CopyBox key={index} copyRef={copyingRefELement} copying={copying} width={80} copyToClipboard={copyToClipboard} index={index} text={copyTags} className='bg-white/[0.03] border-white/10 hover:bg-white/[0.06] transition-colors rounded-2xl p-4' />
          ))}
        </div>
      </div>


      {/* // hum containerRef aur mouseEvent dono es par hi lga rhai hai kyuki ref se es ki width aur heigh calculte kar sakte hai aur image ki bhi, onMouseMove ye bta ta hai ki aap ne div par click kis jagah par kiya hai */}
      <AnimatedSection delay={200} className='w-full max-w-2xl shrink-0'>
        <div ref={containerRef}
          onMouseDown={handleEvent}
          onMouseMove={(el) => el.buttons === 0 && handleEvent(el)} className='relative my-auto aspect-[4/3] w-full overflow-hidden rounded-[2rem] border border-white/10 bg-black cursor-col-resize shadow-2xl hover:border-white/20 hover:shadow-[0_0_30px_rgba(255,255,255,0.1)] transition-all'>

          <Image src={beforePhoto} width={1000} height={1000} alt='Before' className='object-cover top-0 left-0 w-full h-full' style={{ zIndex: 99 }} />

          {/* ✅ After Image Wrapper (this width changes, NOT the image) */}
          <div
            className="absolute top-0 left-0 h-full overflow-hidden"
            // style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }} // right to left
            style={{ clipPath: `inset(0 0 0 ${position}%)` }} // left to right
          >
            <Image
              src={afterPhoto}
              width={1000}
              height={1000}
              alt="After"
              className="w-full h-full object-cover"
            />
          </div>

          <div style={{ zIndex: 99, left: `${position}%`, transform: `translateX(-50%)` }} className='h-full w-[3px] bg-cyan-400/80 absolute top-0 left-0 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]'>
            {/* Drag handle circle */}
            <div className="absolute top-1/2 -translate-y-1/2 -left-[10.5px] w-6 h-6 bg-cyan-400 rounded-full shadow-[0_0_12px_rgba(34,211,238,0.9)] border-2 border-white flex items-center justify-center">
              <div className="flex gap-0.5">
                <div className="w-0.5 h-2.5 bg-black/40 rounded-full"></div>
                <div className="w-0.5 h-2.5 bg-black/40 rounded-full"></div>
              </div>
            </div>

          </div>


        </div>
      </AnimatedSection>
    </AnimatedSection>
  )
}

export default BeforeAfterComponents
