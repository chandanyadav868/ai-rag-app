"use client"

import BeforeAfterComponents from '@/components/BeforeAfterComponents'
import { useContextStore } from '@/components/CreateContext'
import ErrorComponents from '@/components/ErrorComponents'
import Footer from '@/components/Footer'
import HeroSection from '@/components/HeroSection'
import InfiniteLoopSection from '@/components/InfiniteLoopSection'
import PriceComponets from '@/components/PriceComponets'
import ShowSection from '@/components/ShowSection'
import Testomonial from '@/components/Testomonial'
import { useSession } from 'next-auth/react'
import React, { useEffect } from 'react'


function page() {


  return (
    <main className='commonSpacingLeaveForHeader'>
      {/* HeroSection */}
      <HeroSection />
      {/* After and Before Sliding */}
      <BeforeAfterComponents afterPhoto='https://ik.imagekit.io/o66qwandt/images/canvas-export%20(15).png?updatedAt=1759047926139' beforePhoto='https://img.youtube.com/vi/U-2AbSYhnFA/maxresdefault.jpg' copyTags='Remove the girl, which is in the white t-shirt with purple color wearing clothes girl' headingTags='Clean Up Unneccessary Parts of Image' paragraphTags='Edit and Clean up your images Unneccessary things while keeping their original details intact.'/>
      
      {/* ShowSection */}
      <ShowSection />
      {/* InfiniteLoopSection */}
      <InfiniteLoopSection />
      {/* PriceSection */}
      <PriceComponets />
      {/* Testominals */}
      <Testomonial />
      {/* footer */}
      <Footer />

    </main>
  )
}

export default page