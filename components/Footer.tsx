import { HeaderList } from '@/constant'
import Link from 'next/link'
import React from 'react'

function Footer() {
  return (
    <div className='bg-black h-[400px] mt-4 flex justify-center items-center'>
        {/* header links */}
        <div className='flex flex-col gap-2'>
            {HeaderList.map(({link,name},i)=>(
                <Link key={link} className='font-bold text-white hover:text-gray-300 hover:underline underline-offset-2' href={link}>{name}</Link>
            ))}
        </div>
    </div>
  )
}

export default Footer