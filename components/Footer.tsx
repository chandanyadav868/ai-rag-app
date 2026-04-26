import Image from 'next/image'
import Link from 'next/link'
import React from 'react'

const servicesLinks = [
  { name: "Image AI", link: "/image-ai" },
  { name: "Gif Maker", link: "/gif-maker" },
];

const companyLinks = [
  { name: "Home", link: "/" },
  { name: "About", link: "/about" },
  { name: "Feedback", link: "/feedback" },
  { name: "Disclaimer", link: "/desclaimer" },
];

function Footer() {
  return (
    <footer className='mt-10 border-t border-white/5 bg-gray-900/50 px-4 py-10 sm:px-6 lg:px-8'>

      <div className='mx-auto flex w-full max-w-7xl flex-col gap-10 sm:flex-row sm:items-start sm:justify-between'>

        <div className='flex items-center justify-center sm:justify-start'>
          <Image src={'/favicorn/android-chrome-192x192.png'} alt='AI App logo' width={1000} height={1000} className='my-auto w-[96px] rounded-full sm:w-[120px]'/>
        </div>

        <div className='flex flex-col gap-10 sm:flex-row sm:gap-20 text-center sm:text-left'>
          <div className='flex flex-col gap-4'>
            <div className='font-bold text-xl text-white'>Services</div>
            <div className='flex flex-col gap-2'>
              {servicesLinks.map(({link,name})=>(
                  <Link key={link} className='font-medium text-gray-400 transition-colors hover:text-white' href={link}>{name}</Link>
              ))}
            </div>
          </div>
          
          <div className='flex flex-col gap-4'>
            <div className='font-bold text-xl text-white'>Company</div>
            <div className='flex flex-col gap-2'>
              {companyLinks.map(({link,name})=>(
                  <Link key={link} className='font-medium text-gray-400 transition-colors hover:text-white' href={link}>{name}</Link>
              ))}
            </div>
          </div>
        </div>

      </div>

    </footer>
  )
}

export default Footer
