import { SlidingAnimationImage } from '@/constant'
import Image from 'next/image'
import React from 'react'



function InfiniteDesign({className,...props}:React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div {...props} className={`w-[300px] text-white text-2xl flex flex-col gap-4 p-2 h-auto ${className}`}>
        {SlidingAnimationImage.map((image,i)=>(
            <Image width={1000} height={1000} alt='' src={image} key={i} className='outline-1 outline-black rounded-md h-auto w-full shrink-0 text-black'/>
        ))}
    </div>
  )
}

export default InfiniteDesign