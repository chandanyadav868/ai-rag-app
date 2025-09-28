import { HeaderList } from '@/constant'
import Image from 'next/image'
import Link from 'next/link'
import React from 'react'

function Footer() {
  return (
    <div className='bg-gray-800/30 mt-4 p-4'>

      <div className='w-[80%] h-full mx-auto flex gap-4'>

        <div className='h-full flex justify-center items-center'>
          <Image src={'/favicorn/android-chrome-192x192.png'} alt='' width={1000} height={1000} className='w-[150px] rounded-full my-auto'/>
        </div>

        {/* header links */}
        <div className='flex flex-col gap-2'>
          <div className='flex flex-col gap-2'>
            <div className='font-bold text-2xl'>Headers Links</div>
            {HeaderList.map(({link,name},i)=>(
                <Link key={link} className='font-bold text-gray-400 hover:text-gray-300 hover:underline underline-offset-2' href={link}>{name}</Link>
            ))}
          </div>
        </div>

      </div>

    </div>
  )
}

export default Footer