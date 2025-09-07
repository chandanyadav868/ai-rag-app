import TestomonialDesign from '@/app/DesignComponents/TestomonialDesign'
import { testomonialDetails } from '@/constant'
import React from 'react'

function Testomonial() {
  return (
    <div className='w-[80%] mx-auto flex gap-2 flex-wrap justify-center'>
        {testomonialDetails.map((t,i)=>(
          <TestomonialDesign name={t.name} paragraph={t.paragraph} rating={t.rating} src={t.src} key={i}/>
          ))}
    </div>
  )
}

export default Testomonial