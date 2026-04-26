import PriceCard from '@/app/(main)/DesignComponents/PriceCard'
import { PriceData } from '@/constant'
import React from 'react'
import AnimatedSection from './AnimatedSection'

function PriceComponets() {
  return (
    <AnimatedSection className='mx-auto mt-20 flex w-full max-w-7xl flex-col items-center gap-10 px-4 sm:px-6 lg:px-8'>
      <div className="text-center">
        <h1 className='hero-Section-Heading tracking-tight'>Transparent Pricing</h1>
        <p className='commonText text-gray-400 mt-2'>Choose the plan that fits your creative needs</p>
      </div>

      <div className='grid w-full gap-6 md:grid-cols-2 lg:grid-cols-4'>
        {PriceData.map((v,i)=>(
            <AnimatedSection key={i} delay={i * 150} className='h-full'>
                <PriceCard data={v}/>
            </AnimatedSection>
        ))}
      </div>
    </AnimatedSection>
  )
}

export default PriceComponets
