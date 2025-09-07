import InfiniteDesign from '@/app/DesignComponents/InfiniteDesign'
import React from 'react'

function InfiniteLoopSection() {
  return (
    <div className='mx-auto w-[80%] h-[700px] rounded-md mt-4 relative overflow-hidden flex'>
        <div className='absolute top-0 h-[120px] w-full bg-gradient-to-b from-black to-transparent z-20'></div>
            <InfiniteDesign className='absolute carousel-track-up top-0'/>
            <InfiniteDesign className='absolute carousel-track-down'/>
            <InfiniteDesign className='absolute top-0 carousel-track-up-second'/>
            <InfiniteDesign className='absolute carousel-track-down-second'/>
            <InfiniteDesign className='absolute top-0 carousel-track-up-third'/>
        <div className='absolute bottom-0 h-[120px] w-full bg-gradient-to-t from-black to-transparent z-20'></div>
    </div>
  )
}

export default InfiniteLoopSection