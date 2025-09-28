import ButtonDesign from '@/app/DesignComponents/ButtonDesign'
import SlidingDesign from '@/app/DesignComponents/SlidingDesign'
import React from 'react'

function HeroSection() {
  return (
    <>
      {/* text */}
      <div>
        <h1 className='hero-Section-Heading'>AI Powered Image Editing</h1>
        <h1 className='hero-Section-Heading'>Become Viral on
          <span className='text-red-500 font-extrabold'> Social Media</span>
        </h1>
        <p className='commonText'>Transform your ideas into captivating visuals with our AI-powered image generator.</p>
      </div>

      <div className='mx-auto rounded-md p-2 shadow-md w-[561px] max-md:w-full mt-6 flex gap-4 justify-center items-center'>
        <ButtonDesign text='Get Started' link='image-editing' />
        {/* <ButtonDesign text='Explore' link='image-editing' /> */}
      </div>

      <div className='w-full gap-4 flex relative justify-center items-center' style={{ height: "calc(-60px + 100vh )" }}>
        <div className='w-[80%] h-[95%] rounded-md absolute flex mx-auto overflow-hidden p-2'>
          <SlidingDesign />
        </div>

      </div>
    </>
  )
}

export default HeroSection


