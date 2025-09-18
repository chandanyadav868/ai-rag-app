'use client';

import Button from '@/components/Button';
import { FeedBackUseStateProps, useContextStore } from '@/components/CreateContext';
import Textarea from '@/components/Textarea'
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form';
import { ApiEndpoint } from '../classApi/apiClasses';
import ErrorComponents from '@/components/ErrorComponents';
import { createPortal } from 'react-dom';
import FeedbackComponets from '@/components/FeedbackComponets';

interface FeedBackProps {
  feedback: string;
}

function FeedBack() {
  const { register, handleSubmit } = useForm<FeedBackProps>();
  const { loginUserData, setError, error, setFeedback } = useContextStore();
  const [loading, setLoading] = useState<boolean>(false)
  const router = useRouter();

  const formSubmission = async (data: FeedBackProps) => {
    // console.log('formSubmission:- ', data);
    setLoading(true);

    if (!loginUserData?.id) {
      router.push('/login/signin')
    };

    let sedingData = { ...data, id: loginUserData?.id }

    try {
      const response = await ApiEndpoint.Post('/feedback', {}, sedingData);
      // console.log('response:- ', response);

      if (response.status === 200) {
        setError({ message: response.message, type: 'success' })
        const responseData = response.data as FeedBackUseStateProps

        setFeedback((prev) => {
          if (responseData) {
            return [responseData, ...prev ?? []]
          }
          return prev
        })
      }

    } catch (error) {
      // console.log('Error in Feedbac page.ts ', error);
      const errorData = error as { message: string }

      const errorJson = JSON.parse(errorData.message) as { error: { message: string, stack: string } }

      // console.log('Errorin Feedback:- ', errorJson.error.message);

      setError({ type: 'error', message: errorJson.error.message })
    } finally {
      setLoading(false)
    }

  };

  useEffect(() => {
    const responseData = async () => {
      try {
        const response = await ApiEndpoint.Get('/feedback');
        // console.log('Response Data:- ', response);
        const data = response.data as FeedBackUseStateProps[]
        setFeedback(data);
      } catch (error) {
        // console.log('Error in Feedbac page.ts ', error);
        const errorData = error as { message: string }
        const errorJson = JSON.parse(errorData.message) as { error: { message: string, stack: string } }
        // console.log('Errorin Feedback:- ', errorJson.error.message);
        setError({ type: 'error', message: errorJson.error.message })

      }
    }
    responseData()
  }, [])

  return (
    <div className='p-2'>
      <div className='w-lg mx-auto max-md:w-[95%]'>
        <h1 className='font-bold text-2xl text-center'>Give Your Valuable Feedback</h1>
        <form onSubmit={handleSubmit(formSubmission)} className='flex flex-col p-2 gap-2 rounded-md shadow-md'>
          <Textarea {...register('feedback', { required: true })} placeholder='Sending feedback...' className='w-full rounded-md h-[150px]' />
          <Button loader={loading} text='Send' type='submit' className='text-black text-xl bg-white' />
        </form>
      </div>

      {/* feedBack card showing */}
      <FeedbackComponets />

      {/* error showing */}
      {error && createPortal(<ErrorComponents />, document.body)}
    </div>
  )
}

export default FeedBack