import TestomonialDesign from '@/app/(main)/DesignComponents/TestomonialDesign'
import React from 'react'
import { useContextStore } from './CreateContext'
import AnimatedSection from './AnimatedSection'

const dummyReviews = [
  {
    createdBy: { username: "Sarah Jenkins", avatar: "" },
    feedback: "The Image AI features are mind-blowing. It completely transformed my creative workflow. The generated details are so crisp and professional!",
    rating: 5
  },
  {
    createdBy: { username: "Alex Chen", avatar: "" },
    feedback: "I absolutely love the new GIF Maker! The layer management and timeline animation make it so easy to build complex, studio-quality GIFs in my browser.",
    rating: 4.5
  },
  {
    createdBy: { username: "Marcus West", avatar: "" },
    feedback: "A must-have tool for digital marketers. The background removal and object cleanup alone save me hours of Photoshop work every week.",
    rating: 5
  }
];

function Testomonial() {
  const {feedback} = useContextStore()
  
  const displayFeedback = feedback && feedback.length > 0 ? feedback : dummyReviews;

  return (
    <AnimatedSection className='mx-auto mt-20 flex w-full max-w-7xl flex-col gap-10 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-transparent to-white/[0.01] pt-10 rounded-[3rem]'>
        <div className="text-center">
          <h1 className='hero-Section-Heading tracking-tight'>Creators Reviews</h1>
          <p className="commonText text-gray-400 mt-2">See what professionals are saying about our editing tools</p>
        </div>
        <div className='grid gap-6 md:grid-cols-2 xl:grid-cols-3 mb-10'>
        {displayFeedback.map((t,i)=>(
          <AnimatedSection key={i} delay={i * 100} className='flex'>
            <TestomonialDesign name={t.createdBy.username??''} paragraph={t.feedback} rating={t?.rating??4.5} src={t.createdBy?.avatar??undefined} />
          </AnimatedSection>
          ))}
        </div>
    </AnimatedSection>
  )
}

export default Testomonial
