import Form from '@/components/Form'
import Input from '@/components/Input'
import Image from 'next/image'
import React from 'react'

const loginServices = [
    {
        name: "Google",
    }
]

import { signIn } from "@/auth"

function page() {
    
    return (
        <div className='w-full h-screen'>
            <div className='w-[444px] max-sm:w-full  bg-black h-full flex flex-col justify-center items-center px-2 text-white'>
                <div className='flex flex-col gap-2 w-full p-2'>
                    <h1 className='text-center font-black text-3xl'>Photo Editing</h1>
                    {loginServices.map((v, i) => (
                        <div key={i} className='px-6 py-4 rounded-md bg-gray-600 flex gap-2 zoomingOutIn'>
                            <span onClick={async () => {
                                "use server"
                                console.log("Request goind google");
                                // agar aap karte hai:- await signIn("google",{redirect:true, redirectTo:"/"})
                                 await signIn("google")
                            }} className='font-bold text-white text-center w-full cursor-pointer'>{v.name}</span>
                        </div>
                    ))}

                    <div className='w-[95%] mx-auto border-t-1 mt-8 border-gray-300 relative'>
                        <span style={{ transform: `translate(48%, -50%)` }} className='absolute right-1/2 outline-1 outline-amber-100 rounded-full z-20 bg-black p-1'>OR</span>
                    </div>

                    <Form />

                    
                </div>

            </div>
            <div className='w-[80%] max-md:hidden'></div>
        </div>
    )
}

export default page