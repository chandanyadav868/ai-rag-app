import { StarHalf,Star, CircleUser } from 'lucide-react';
import Image from 'next/image'
import React from 'react'

interface TestomonialDesignProps {
  src:string | undefined;
  name:string;
  paragraph:string;
  rating:number;
}

function TestomonialDesign({name,paragraph,rating,src}:TestomonialDesignProps) {
  
  return (
    <div className='w-[350px] max-md:w-full h-auto rounded-2xl mt-4 px-[10px] pt-[60px] outline-1 hover:outline-gray-700 outline-gray-600'>
        <div className='flex relative'>
          {src?
          <Image width={1000} height={1000} className='w-[80px] h-auto outline-2 outline-cyan-50 rounded-full absolute left-1/2 transform -translate-x-1/2 -translate-y-1/2' alt='' 
          src={src}
          />
          :
          <CircleUser size={80} fill='black' className='rounded-full absolute left-1/2 transform -translate-x-1/2 -translate-y-1/2' />
          
        }
            
            <div className='px-[10px] py-[50px] rounded-2xl bg-black text-white testomonialShadow w-full mt-2 border-t-2'>
                <h1 className='text-center font-bold text-2xl'>{name}</h1>
                <div className='flex justify-center text-sm'>
                    <span>{rating}</span>
                    <Star fill='orange' size={18} className='outline-0'/>
                    <Star fill='orange' size={18} className='outline-0'/>
                    <Star fill='orange' size={18} className='outline-0'/>
                    <Star fill='orange' size={18} className='outline-0'/>
                    <StarHalf fill='orange' size={18} className='outline-0'/>
                </div>
                <p className='commonText'>{paragraph}</p>
            
            </div>
            
        </div>
    </div>
  )
}

export default TestomonialDesign