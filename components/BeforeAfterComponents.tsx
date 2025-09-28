import Image from 'next/image';
import React, { useRef, useState } from 'react'
import CopyBox from './CopyBox';

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
    // e.clientX , ye btata hai ki aap window sreen se kitna dur hai on x axis par, 
    // check karo ki kya abhi bhi containerRef ke current mai null value to nhi hai, div ref attach ho gya hai
    if (!containerRef.current) return

    // aap us div ki bahut si property nikar sakte hai with getBoundingClientRect se
    const rect = containerRef.current.getBoundingClientRect();

    // ab aap pta kariye ki wo middle line kaha par hai image mai

    const clientX = e.clientX // jaha par click kiya wo horizontally window se kitne dur hai, for example 100
    const rectX = rect.left // wo div screen se kitne duri par hai left side se, for example 10

    const x = clientX - rectX // es se hum pta kar lenge ki wo kitna dur hai , for example 100 - 10 = 90 pixel dur click kiya hai div par

    // pixel ko percentage mai badlana hoga, 90 / 200 = 0.45 * 100 = 45
    const percentage = (x / rect.width) * 100;

    // for sefti ki liye
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
    <div className='w-[80%] mx-auto flex flex-wrap my-8'>
      <div className='flex flex-col flex-1 px-2 shrink-0'>
        <h1 className='show-Section-Heading'>{headingTags}</h1>
        <p className='commonText'>{paragraphTags}</p>

        <div className='flex overflow-x-scroll gap-4 mt-6 pb-2 w-full copyingSectionScrollbar mx-auto'>
          {Array.from({ length: 1 }).map((_, index) => (
            <CopyBox key={index} copyRef={copyingRefELement} copying={copying} width={80} copyToClipboard={copyToClipboard} index={index} text={copyTags} />
          ))}
        </div>
      </div>


      {/* // hum containerRef aur mouseEvent dono es par hi lga rhai hai kyuki ref se es ki width aur heigh calculte kar sakte hai aur image ki bhi, onMouseMove ye bta ta hai ki aap ne div par click kis jagah par kiya hai */}
      <div ref={containerRef}
        onMouseDown={handleEvent}
        onMouseMove={(el) => el.buttons === 0 && handleEvent(el)} className='w-[600px] h-full my-auto border-2 border-gray-300 rounded-lg cursor-col-resize relative overflow-hidden shrink-0'>

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

        <div style={{ zIndex: 99, left: `${position}%`, transform: `translateX(-50%)` }} className='h-full w-[2px] bg-amber-600 absolute top-0 left-0'>
          {/* Drag handle circle */}
          <div className="absolute top-1/2 -translate-y-1/2 -left-2 w-4 h-4 bg-orange-500 rounded-full shadow-md"></div>

        </div>


      </div>
    </div>
  )
}

export default BeforeAfterComponents