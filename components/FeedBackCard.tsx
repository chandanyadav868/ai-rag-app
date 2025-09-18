import React from 'react'
import { FeedBackUseStateProps } from './CreateContext'


function FeedBackCard({cardDetails}:{cardDetails:FeedBackUseStateProps}) {
  return (
    <div className='w-[300px] bg-gray-300 rounded-md outline-1 outline-amber-200 h-auto p-2'>
        <div>
            <p className='text-center font-semibold'>{cardDetails.feedback}</p>
        </div>
    </div>
  )
}

export default FeedBackCard