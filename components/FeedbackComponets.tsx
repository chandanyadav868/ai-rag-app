import React from 'react'
import { useContextStore } from './CreateContext';
import FeedBackCard from './FeedBackCard';

function FeedbackComponets() {
    const { feedback } = useContextStore();

    return (
        <>
            <h1 className='font-bold text-2xl text-center mt-2'>User Feedback</h1>
            {feedback && feedback.length > 0 ?
                <div className='flex gap-2 flex-wrap justify-center mt-2'>
                    {feedback.map((feedback, i) => (
                        <FeedBackCard key={i} cardDetails={feedback} />
                    ))}
                </div>
                :
                <></>
            }
        </>
    )
}

export default FeedbackComponets