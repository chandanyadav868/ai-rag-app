import InfiniteDesign from '@/app/(main)/DesignComponents/InfiniteDesign'
import React from 'react'

function InfiniteLoopSection() {
  return (
    <section className='mx-auto mt-6 w-full max-w-7xl px-4 sm:px-6 lg:px-8'>
      <div className='relative flex h-[420px] overflow-hidden rounded-3xl border border-white/8 sm:h-[560px] lg:h-[700px]'>
        <div className='absolute top-0 z-20 h-[100px] w-full bg-gradient-to-b from-black to-transparent sm:h-[120px]'></div>
            <InfiniteDesign className='absolute carousel-track-up top-0'/>
            <InfiniteDesign className='absolute carousel-track-down'/>
            <InfiniteDesign className='absolute top-0 carousel-track-up-second'/>
            <InfiniteDesign className='absolute carousel-track-down-second'/>
            <InfiniteDesign className='absolute top-0 carousel-track-up-third'/>
        <div className='absolute bottom-0 z-20 h-[100px] w-full bg-gradient-to-t from-black to-transparent sm:h-[120px]'></div>
      </div>
    </section>
  )
}

export default InfiniteLoopSection
