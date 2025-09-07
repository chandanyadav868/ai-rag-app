import Image from 'next/image'
import React from 'react'

interface TestomonialDesignProps {
  src:string;
  name:string;
  paragraph:string;
  rating:string;
}

function TestomonialDesign({name,paragraph,rating,src}:TestomonialDesignProps) {
  return (
    <div className='w-[350px] max-md:w-full h-auto rounded-md mt-4 px-[10px] pt-[60px]'>
        <div className='flex relative'>
            <Image width={1000} height={1000} className='w-[100px] h-[100px] max-md:w-[75px] max-md:h-[75px] outline-2 outline-cyan-50 rounded-full absolute left-1/2 transform -translate-x-1/2 -translate-y-1/2' alt='' src={src}/>
            
            <div className='px-[10px] py-[50px] rounded-2xl bg-black text-white testomonialShadow mt-2'>
                <h1 className='text-center font-bold'>{name}</h1>
                <div className='flex justify-center'>
                    <span>{rating}</span>
                </div>
                <p>{paragraph}</p>
            
            </div>
            
        </div>
    </div>
  )
}

export default TestomonialDesign