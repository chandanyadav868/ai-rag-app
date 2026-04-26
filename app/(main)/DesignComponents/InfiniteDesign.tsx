import { SlidingAnimationImage } from '@/constant'
import Image from 'next/image'
import React from 'react'



function InfiniteDesign({className,...props}:React.HTMLAttributes<HTMLDivElement>) {
  // Quadruple the array to ensure smooth track scrolling without black flashes
  const infiniteImages = [...SlidingAnimationImage, ...SlidingAnimationImage, ...SlidingAnimationImage, ...SlidingAnimationImage];

  return (
    <div {...props} className={`w-[300px] text-white text-2xl flex flex-col gap-4 p-2 h-auto ${className}`}>
        {infiniteImages.map((image,i)=>(
            <Image width={1000} height={1000} alt='' src={image} key={i} className='outline-1 outline-gray-700 rounded-[1.2rem] h-auto w-full shrink-0 shadow-[0_4px_20px_rgba(0,0,0,0.5)]'/>
        ))}
    </div>
  )
}

export default InfiniteDesign