import PriceCard from '@/app/DesignComponents/PriceCard'
import { PriceData } from '@/constant'
import React from 'react'

function PriceComponets() {
  return (
    <div className='w-[80%] mx-auto mt-4 flex flex-col flex-wrap justify-center items-center gap-6'>
      <div>
        <h1 className='hero-Section-Heading'>Transparent Pricing</h1>
        <p className='commonText'>Choose the right plan for you</p>
      </div>

      {/* pricing cards */}
      <div className='flex gap-4 justify-center items-center flex-wrap'>
        {PriceData.map((v,i)=>(
            <PriceCard key={i} data={v}/>
        ))}
      </div>
    </div>
  )
}

export default PriceComponets