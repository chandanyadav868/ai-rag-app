import TestomonialDesign from '@/app/DesignComponents/TestomonialDesign'
import { testomonialDetails } from '@/constant'
import React, { useContext } from 'react'
import { useContextStore } from './CreateContext'

function Testomonial() {
  const {feedback} = useContextStore()
  return (
    <div className='w-[80%] mx-auto flex flex-col gap-2 mt-4 justify-center'>
        <h1 className='hero-Section-Heading'>Creators Reviews</h1>
        <div className='flex flex-wrap gap-2 justify-center'>
        {feedback && feedback.map((t,i)=>(
          <TestomonialDesign name={t.createdBy.username??''} paragraph={t.feedback} rating={t?.rating??4.5} src={t.createdBy?.avatar??undefined} key={i}/>
          ))}
        </div>
    </div>
  )
}

export default Testomonial