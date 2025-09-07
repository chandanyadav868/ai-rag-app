import PriceCard from '@/app/DesignComponents/PriceCard'
import { PriceData } from '@/constant'
import React from 'react'

function PriceComponets() {
  return (
    <div className='w-[80%] mx-auto mt-4 flex flex-wrap justify-center items-center gap-2'>
        {PriceData.map((v,i)=>(
            <PriceCard key={i} data={v}/>
        ))}
    </div>
  )
}

export default PriceComponets