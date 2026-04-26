'use client';

import { FeedBackUseStateProps, useContextStore } from '@/components/CreateContext';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form';
import { ApiEndpoint } from '../classApi/apiClasses';
import ErrorComponents from '@/components/ErrorComponents';
import { createPortal } from 'react-dom';
import Testomonial from '@/components/Testomonial';
import AnimatedSection from '@/components/AnimatedSection';
import { MessageSquareHeart, Send, Star, Loader2 } from 'lucide-react';

interface FeedBackProps {
  feedback: string;
  rating: number;
}

const MAX_CHARS = 500;

function FeedBack() {
  const { register, handleSubmit, watch, setValue } = useForm<FeedBackProps>({
    defaultValues: { feedback: '', rating: 5 }
  });
  const { loginUserData, setError, error, setFeedback } = useContextStore();
  const [loading, setLoading] = useState<boolean>(false);
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);
  const [selectedRating, setSelectedRating] = useState<number>(5);
  const router = useRouter();

  const feedbackText = watch('feedback');
  const charCount = feedbackText?.length ?? 0;
  const isOverLimit = charCount > MAX_CHARS;

  const handleStarClick = (rating: number) => {
    setSelectedRating(rating);
    setValue('rating', rating);
  };

  const formSubmission = async (data: FeedBackProps) => {
    setLoading(true);

    if (!loginUserData?.id) {
      router.push('/login/signin');
      return;
    }

    let sendingData = { ...data, rating: selectedRating, id: loginUserData?.id };

    try {
      const response = await ApiEndpoint.Post('/feedback', {}, sendingData);

      if (response.status === 200) {
        setError({ message: response.message, type: 'success' });
        const responseData = response.data as FeedBackUseStateProps;
        setFeedback((prev) => {
          if (responseData) return [responseData, ...prev ?? []];
          return prev;
        });
      }

    } catch (error) {
      const errorData = error as { message: string };
      const errorJson = JSON.parse(errorData.message) as { error: { message: string } };
      setError({ type: 'error', message: errorJson.error.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        const response = await ApiEndpoint.Get('/feedback');
        const data = response.data as FeedBackUseStateProps[];
        setFeedback(data);
      } catch (error) {
        const errorData = error as { message: string };
        try {
          const errorJson = JSON.parse(errorData.message) as { error: { message: string } };
          setError({ type: 'error', message: errorJson.error.message });
        } catch {}
      }
    };
    fetchFeedback();
  }, []);

  return (
    <div className='commonSpacingLeaveForHeader'>

      {/* Page Header */}
      <AnimatedSection className='mx-auto flex max-w-7xl flex-col items-center justify-center px-4 pb-12 pt-8 text-center sm:px-6 lg:px-8'>
        <div className='mb-4 inline-flex items-center gap-2 rounded-full border border-yellow-500/30 bg-yellow-500/10 px-4 py-1.5 text-sm font-medium text-yellow-300'>
          <MessageSquareHeart size={15} />
          Share Your Thoughts
        </div>
        <h1 className='hero-Section-Heading mb-4 tracking-tight'>Your Feedback Matters</h1>
        <p className='commonText max-w-xl text-gray-400'>
          Help us improve by sharing your experience. Every review helps us build a better creative studio for everyone.
        </p>
      </AnimatedSection>

      {/* Form Card */}
      <AnimatedSection delay={100} className='mx-auto w-full max-w-2xl px-4 sm:px-6'>
        <div className='rounded-3xl border border-white/5 bg-[#121212]/80 p-6 shadow-2xl backdrop-blur-sm sm:p-10'>
          
          <form onSubmit={handleSubmit(formSubmission)} className='flex flex-col gap-6'>
            
            {/* Rating Stars */}
            <div className='flex flex-col gap-3'>
              <label className='text-xs font-bold uppercase tracking-widest text-white/50'>
                Rate Your Experience
              </label>
              <div className='flex items-center gap-2'>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type='button'
                    onClick={() => handleStarClick(star)}
                    onMouseEnter={() => setHoveredStar(star)}
                    onMouseLeave={() => setHoveredStar(null)}
                    className='transition-transform hover:scale-125 focus:outline-none'
                  >
                    <Star
                      size={32}
                      className={`transition-colors ${
                        star <= (hoveredStar ?? selectedRating)
                          ? 'text-yellow-400'
                          : 'text-white/10'
                      }`}
                      fill={star <= (hoveredStar ?? selectedRating) ? 'currentColor' : 'none'}
                    />
                  </button>
                ))}
                <span className='ml-2 text-sm font-semibold text-white/60'>
                  {selectedRating === 5 ? 'Excellent!' : selectedRating === 4 ? 'Very Good' : selectedRating === 3 ? 'Good' : selectedRating === 2 ? 'Fair' : 'Needs Work'}
                </span>
              </div>
            </div>

            {/* Textarea */}
            <div className='flex flex-col gap-2'>
              <label className='text-xs font-bold uppercase tracking-widest text-white/50'>
                Your Feedback
              </label>
              <div className={`relative rounded-2xl border bg-black/40 transition-colors focus-within:bg-black/60 ${isOverLimit ? 'border-red-500/60 focus-within:border-red-500' : 'border-white/10 focus-within:border-white/30'}`}>
                <textarea
                  {...register('feedback', { required: true })}
                  placeholder='Tell us about your experience with Image AI or the GIF Maker...'
                  rows={6}
                  className='w-full resize-none rounded-2xl bg-transparent p-5 text-sm text-white placeholder:text-white/20 focus:outline-none'
                />
                {/* Char Counter */}
                <div className={`absolute bottom-4 right-4 text-xs font-semibold ${isOverLimit ? 'text-red-400' : 'text-white/30'}`}>
                  {charCount} / {MAX_CHARS}
                </div>
              </div>
              {isOverLimit && (
                <p className='text-xs font-medium text-red-400'>
                  Please keep your feedback under {MAX_CHARS} characters.
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type='submit'
              disabled={loading || isOverLimit || charCount === 0}
              className='group flex w-full items-center justify-center gap-3 rounded-xl bg-white py-4 text-sm font-bold text-black shadow-[0_0_20px_rgba(255,255,255,0.2)] transition-all hover:bg-gray-100 hover:shadow-[0_0_30px_rgba(255,255,255,0.35)] disabled:cursor-not-allowed disabled:opacity-50'
            >
              {loading ? (
                <>
                  <Loader2 size={18} className='animate-spin' /> Sending...
                </>
              ) : (
                <>
                  <Send size={16} className='transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5' />
                  Submit Feedback
                </>
              )}
            </button>

          </form>
        </div>
      </AnimatedSection>

      {/* Reviews Section */}
      <Testomonial />

      {/* Error Toast */}
      {error && createPortal(<ErrorComponents />, document.body)}
    </div>
  );
}

export default FeedBack;