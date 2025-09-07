import { ArrowLeft, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import React, { useState } from 'react'

const slidingImage = [{ videoId: "AbkEmIgJMcU", id: 1 }, { videoId: "vFAqBlDpEm0", id: 2 }, { videoId: "7iy8iB8tu5c", id: 3 }, { videoId: "Qg9LxRHLbAk", id: 4 }, { videoId: "k3ijQJjUbTs", id: 5 }]

function SlidingDesign() {
    const [currentIndex, setCurrentIndex] = useState<number>(0);

    // ye useEffect jab component load ho ga tab chalega, ye sirf ek bar chalega kyuki humne dependency array ko empty choda hai
    // useEffect(()=>{
    //     // humne setInterval use kiya hai jo ki callback aur time ms leta hai, es ke under ke callback mai likha gya code har baar 2 second ki bad chalega
    //     const interval = setInterval(() => {
    //         // humne currentIndex ko update karne ke liye setCurrentIndex function use kiya hai
    //         setCurrentIndex((prev) => {
    //             // mai chahata huki ydi user pura slide pura kar liya to back slide hoga prev mai se -1 kar denge
    //             // maine ref ke under value es liye rakhi hai kyuki useState ki value setInterValue ke callback mai update nhi hoti hai default hi rahi hai
    //             if (backward.current) {
    //                 if (prev === 0) {
    //                     backward.current = false
    //                     return prev + 1
    //                 }
    //                 return prev -1
    //             }else{
    //                 if (prev === slidingImage.length -1) {
    //                     backward.current = true
    //                     return prev -1
    //                 }
    //                 return prev + 1
    //             }
    //         })
    //     }, 4000);
    //     return () => clearInterval(interval);
    // },[])


    return (
        <>
        <div className='w-[100%] bg-amber-400 h-[100%] flex transition-transform duration-500 ease-in-out' style={{ transform: `translateX(calc(-${(currentIndex * 100)}% - ${currentIndex*10}px))` }}>
            {
                slidingImage.map((image, index) => (
                    <Image height={1000} key={index} width={1000} src={`https://img.youtube.com/vi/${image.videoId}/maxresdefault.jpg`} alt={`sliding-image-${image.id}`} 
                    className={`w-full h-full object-cover rounded-md bg-white`}
                     style={{ transform: `translateX(${(index * 100)}%)`, marginLeft:`${index*10}px`,position:"absolute"}} 
                     />
                ))
            }

        </div>
        <div className='w-full h-4 flex justify-center items-center gap-2 absolute bottom-4'>

            <span><ArrowLeft className='zoomingOutIn' size={22} color='white' onClick={() => setCurrentIndex((prev) => {
                if (prev !== 0) {
                    return prev - 1
                }
                return prev
            })} /></span>
            {[...Array(slidingImage.length)].map((_, index) => (

                <span key={index} className={`w-4 h-4 bottom-0 outline-1 outline-white ${currentIndex === index ? "bg-white" : "bg-white/20"} rounded-full`}></span>

            ))}
            <span><ArrowRight className='zoomingOutIn' onClick={() => setCurrentIndex((prev) => {
                if (prev !== slidingImage.length - 1) {
                    return prev + 1
                }
                return prev
            })} size={22} color='white' /></span>
        </div>
        </>
    )
}

export default SlidingDesign