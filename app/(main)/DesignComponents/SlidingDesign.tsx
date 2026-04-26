import { ArrowLeft, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import React, { useEffect, useState } from 'react'

const slidingImage = [
    { videoId: 'https://ik.imagekit.io/o66qwandt/images/canvas-export%20(17)%20(1).png?updatedAt=1759063440208', id: 1 },
    { videoId: 'https://ik.imagekit.io/o66qwandt/images/canvas-export%20(16)%20(1).png?updatedAt=1759063439939', id: 2 },
    { videoId: 'https://ik.imagekit.io/o66qwandt/images/canvas-export%20(11)%20(1).png?updatedAt=1759063442909', id: 3 }
]

function SlidingDesign() {
    const [currentIndex, setCurrentIndex] = useState<number>(0);

    const previousSlide = () => {
        setCurrentIndex((prev) => {
            if (prev === 0) {
                return slidingImage.length - 1;
            }
            return prev - 1;
        });
    };

    const nextSlide = () => {
        setCurrentIndex((prev) => {
            if (prev === slidingImage.length - 1) {
                return 0;
            }
            return prev + 1;
        });
    };

    useEffect(() => {
        const interval = window.setInterval(() => {
            setCurrentIndex((prev) => {
                if (prev === slidingImage.length - 1) {
                    return 0;
                }
                return prev + 1;
            });
        }, 4000);

        return () => window.clearInterval(interval);
    }, []);

    return (    
        <div className='relative flex h-full min-h-[620px] w-full flex-col overflow-hidden rounded-[24px] bg-[#050505]'>
            <div className='relative flex-1 overflow-hidden rounded-[24px]'>
                {slidingImage.map((image, index) => {
                    const isActive = currentIndex === index;

                    return (
                        <div
                            key={image.id}
                            className={`absolute inset-0 transition-all duration-700 ease-in-out ${isActive ? 'opacity-100 scale-100 z-10' : 'opacity-0 scale-[1.02] z-0 pointer-events-none'}`}
                        >
                            <div className='relative h-full w-full'>
                                <Image
                                    fill
                                    priority={index === 0}
                                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 1200px"
                                    src={image.videoId}
                                    alt={`sliding-image-${image.id}`}
                                    className='object-contain object-center'
                                />
                            </div>
                        </div>
                    );
                })}

                <div className='pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/40 to-transparent sm:h-28'></div>
                <div className='pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 to-transparent sm:h-32'></div>
            </div>

            <div className='absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-3 rounded-full border border-white/10 bg-black/55 px-3 py-2 backdrop-blur-md'>
                <button
                    type='button'
                    onClick={previousSlide}
                    className='flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20'
                    aria-label='Previous slide'
                >
                    <ArrowLeft size={18} />
                </button>

                <div className='flex items-center gap-2'>
                    {slidingImage.map((_, index) => (
                        <button
                            key={index}
                            type='button'
                            onClick={() => setCurrentIndex(index)}
                            aria-label={`Go to slide ${index + 1}`}
                            className={`h-2.5 rounded-full transition-all duration-300 ${currentIndex === index ? 'w-8 bg-white' : 'w-2.5 bg-white/35 hover:bg-white/60'}`}
                        />
                    ))}
                </div>

                <button
                    type='button'
                    onClick={nextSlide}
                    className='flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20'
                    aria-label='Next slide'
                >
                    <ArrowRight size={18} />
                </button>
            </div>
        </div>
    )
}

export default SlidingDesign
