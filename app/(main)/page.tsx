"use client"

import BeforeAfterComponents from '@/components/BeforeAfterComponents'
import { useContextStore } from '@/components/CreateContext'
import ErrorComponents from '@/components/ErrorComponents'
import Footer from '@/components/Footer'
import HeroSection from '@/components/HeroSection'
import Testomonial from '@/components/Testomonial'
import GifMakerSection from '@/components/GifMakerSection'
import { useSession } from 'next-auth/react'
import React, { useEffect } from 'react'


function page() {


  return (
    <main className='commonSpacingLeaveForHeader'>
      {/* HeroSection */}
      <HeroSection />
      {/* After and Before Sliding (Image AI) */}
      <BeforeAfterComponents 
        afterPhoto='https://ik.imagekit.io/o66qwandt/images/canvas-export%20(15).png?updatedAt=1759047926139' 
        beforePhoto='https://img.youtube.com/vi/U-2AbSYhnFA/maxresdefault.jpg' 
        copyTags='Remove the girl, which is in the white t-shirt with purple color wearing clothes girl' 
        headingTags='Advanced Image AI Features' 
        paragraphTags='Effortlessly clean up unnecessary elements from your images while keeping their original details flawlessly intact.' 
      />

      {/* Gif Maker Section */}
      <GifMakerSection />

      {/* Testominals */}
      <Testomonial />
      {/* footer */}
      <Footer />

    </main>
  )
}

export default page