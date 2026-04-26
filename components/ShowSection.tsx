import ShowDesign from '@/app/(main)/DesignComponents/ShowDesign'
import { slidingImage, slidingText } from '@/constant'
import React, { useRef, useState } from 'react'
import CopyBox from './CopyBox';
import AnimatedSection from './AnimatedSection';

function ShowSection() {
  const copyRef = useRef<(HTMLParagraphElement | null)[]>([]);
  const [copying, setCopying] = useState<{id:number,active:boolean} | undefined>();

  const copyToClipboard = (index:number) => {
    // console.log(copyRef);
    const text = copyRef.current[index]?.innerText || "";
    // console.log(text);

    setCopying({id:index,active:true});
    // console.log("Copying...", text);
    navigator.clipboard.writeText(text);

    setTimeout(() => {
      setCopying(undefined);
    }, 2000);
  }

  return (
    <>
      <AnimatedSection className='mx-auto w-full max-w-7xl rounded-3xl border border-white/5 bg-[#121212]/80 backdrop-blur-sm px-4 py-8 sm:px-8 lg:px-12 shadow-2xl overflow-hidden hover:border-white/10 transition-colors'>
        <div className='flex flex-col gap-10 lg:flex-row lg:items-center lg:justify-center'>

          <div className='flex min-w-0 flex-1 flex-col px-1 sm:px-2 z-10'>
            <h1 className='show-Section-Heading tracking-tight mb-4'>Transform Images Into Different Aspects</h1>
            <p className='commonText text-gray-400'>Edit and enhance your images while keeping their original details intact.</p>

            <div className='copyingSectionScrollbar mx-auto mt-8 flex w-full gap-4 overflow-x-auto pb-4 max-sm:flex-col'>
            {slidingText.map((v, index) => (
              <CopyBox key={index} copyRef={copyRef} copying={copying} copyToClipboard={copyToClipboard} className='max-sm:w-full w-[40%] bg-white/[0.03] border-white/10 hover:bg-white/[0.06] transition-colors rounded-2xl p-4' index={index} text={v.text??''} />
            ))}
            </div>
          </div>

          <AnimatedSection delay={300} className='w-full max-w-2xl shrink-0'>
            {slidingImage.map((image, index) => (
              <ShowDesign key={index} landscapeThumnail={image.LandscapeImage} potraitThumnail={image.portraitImage} squareThumnail={image.SquareImage} />
            ))}
          </AnimatedSection>
        </div>
      </AnimatedSection>
    </>
  )
}

export default ShowSection
