"use client"
import Button from '@/components/Button';
import Textarea from '@/components/Textarea'
import { ImageGenerateWithAi } from '@/Gemina_Api/genAi';
import Image from 'next/image';
import React, { useEffect, useRef, useState } from 'react'

function page() {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [textareaString, setTextareaString] = useState<string | null>(null);
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [imageGenerate, setImageGenerate] = useState(false);

    useEffect(() => {

    }, [])

    const imageGenerationFn = async () => {
        if (!textareaString) {
            return
        }

        try {
            setImageGenerate(true)
            console.log("textareaString:- ", textareaString);
            const reponse = await ImageGenerateWithAi({ text: textareaString });

            console.log("reponse:- ", reponse);
            if (!reponse) {
                return
            }

            const imageBLob = new Blob([reponse], { type: "image/png" });
            console.log("imageBLob:- ", imageBLob);
            const imageUrl = URL.createObjectURL(imageBLob)
            setImageSrc(imageUrl)

        } catch (error) {
            console.log("Error in the Image Generate", error);

        } finally {
            setImageGenerate(false)
        }

    }

    return (
        <div id="imageEditor">
            <form onSubmit={(e) => {
                e.preventDefault();
                imageGenerationFn()
            }}>
                <div className='flex items-center gap-4 w-[800px] mx-auto p-2'>
                    <Textarea name='imageText' placeholder='Enter Your text..' className='resize-none w-full min-h-[96px]' onChange={(text) => setTextareaString(text)} ref={textareaRef} />
                    <Button loader={imageGenerate} type='submit' name='Submit' className='py-2 hover:bg-gray-500' />
                </div>
            </form>
            <div className='w-[900px] mx-auto p-2'>
                { imageSrc && <Image src={imageSrc ?? "https://rasterweb.net/raster/wp-content/uploads/2020/02/atom-text-editor.jpg"} alt='image' width={1000} height={1000} className='w-full h-full rounded-md' />}
            </div>
        </div>
    )
}

export default page