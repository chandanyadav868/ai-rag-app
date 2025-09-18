"use client"

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
    <main>

      {/* HeroSection */}
      <HeroSection />
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