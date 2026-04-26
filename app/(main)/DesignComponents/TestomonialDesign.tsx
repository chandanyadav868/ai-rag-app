import { StarHalf, Star, CircleUser } from 'lucide-react';
import Image from 'next/image'
import React from 'react'

interface TestomonialDesignProps {
  src: string | undefined;
  name: string;
  paragraph: string;
  rating: number;
}

function TestomonialDesign({ name, paragraph, rating, src }: TestomonialDesignProps) {
  
  return (
    <div className='relative mt-8 h-full w-full max-md:w-full'>
        {/* Avatar positioned perfectly on the top edge */}
        <div className='absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-1/2'>
          {src ? (
            <div className='overflow-hidden rounded-full border-4 border-[#121212] bg-[#121212] shadow-xl'>
              <Image width={80} height={80} className='h-[72px] w-[72px] object-cover' alt={name} src={src} />
            </div>
          ) : (
            <div className='flex h-[80px] w-[80px] items-center justify-center rounded-full border-4 border-[#121212] bg-gray-800 shadow-xl'>
              <CircleUser size={50} className='text-gray-400' />
            </div>
          )}
        </div>
            
        <div className='flex h-full flex-col rounded-3xl border border-white/5 bg-[#121212]/80 px-6 pb-8 pt-14 shadow-2xl backdrop-blur-md transition-colors hover:border-white/10 hover:bg-[#161618]/90'>
            <h1 className='text-center text-xl font-bold text-white'>{name}</h1>
            
            <div className='my-3 flex items-center justify-center gap-1 text-sm font-semibold text-white/80'>
                <span className='mr-1'>{rating}</span>
                <Star fill='orange' size={16} className='text-orange-500' />
                <Star fill='orange' size={16} className='text-orange-500' />
                <Star fill='orange' size={16} className='text-orange-500' />
                <Star fill='orange' size={16} className='text-orange-500' />
                {rating === 5 ? <Star fill='orange' size={16} className='text-orange-500' /> : <StarHalf fill='orange' size={16} className='text-orange-500' />}
            </div>
            
            <p className='text-center text-sm leading-relaxed text-gray-300 italic'>"{paragraph}"</p>
        </div>
    </div>
  )
}

export default TestomonialDesign