import ButtonDesign from '@/app/DesignComponents/ButtonDesign'
import SlidingDesign from '@/app/DesignComponents/SlidingDesign'
import React from 'react'

function HeroSection() {
  return (
    <div className='w-full gap-4 flex relative justify-center items-center' style={{ height: "calc(-60px + 100vh )" }}>
      <div className='w-[80%] h-[95%] outline-1 rounded-md absolute flex mx-auto overflow-hidden p-2'>
        <SlidingDesign />
      </div>
      <div className='bg-white rounded-md p-2 shadow-md w-[561px] max-md:w-full h-[100px]' style={{ position: "absolute", zIndex: 9 }}>

      </div>
      {/* <ButtonDesign text='Ai Image Editor' link='image-editing'/> */}
      <ButtonDesign text='Ai Image Editor' link='image-editing' />
    </div>
  )
}

export default HeroSection


