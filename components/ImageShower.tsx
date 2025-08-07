import { artworks } from '@/artworks'
import Image from 'next/image'
import React from 'react'

function ImageShower() {
  return (
    <div className='columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-2 col-auto'>
        {artworks.map((v,i)=>(
            <div className='mt-2' key={i}>
                <Image className='rounded-md' loading='lazy' src={v.src} width={1000} height={1000} alt={`image_${i}`}/>
            </div>
        ))}
    </div>
  )
}

export default ImageShower