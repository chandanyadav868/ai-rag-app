"use client"

import { FileUploadResponseProps } from '@/app/image-ai/page';
import { GoogleGenAI } from '@google/genai';
import Image from 'next/image';
import React, { useState } from 'react'

interface ImageUploadProps {
    setUploadedImageData:(e:FileUploadResponseProps)=>void
}

export const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GOOGLE_GEMINA_API });

function ImageUpload({ setUploadedImageData }:ImageUploadProps) {
    const [image, setImage] = useState<string>();

    const refrenceView = async (data: FileList) => {
        const bufferMaking = await data[0].arrayBuffer()
        const blob = new Blob([bufferMaking], { type: data[0].type });
        const imageURL = URL.createObjectURL(blob);
        console.log("imageURL:- ", imageURL);

        setImage(imageURL);

        const myfile = await ai.files.upload({
            file: blob,
            config: {
                mimeType: data[0].type
            }
        });

        console.log(myfile);
        setUploadedImageData(myfile);
    };

    const onDraggingOver = (e: React.DragEvent<HTMLInputElement>) => {
        e.preventDefault()
    }

    const onDrop = (e: React.DragEvent<HTMLInputElement>) => {
        e.preventDefault()
        const files = e.dataTransfer.files;
        console.log("files:- ", files);
        refrenceView(files)
    }

    const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        console.log("files:- ", files);
        if (!files) return;

        refrenceView(files);
    }

    return (
        <div className='flex items-center'>
            <input onChange={onChange} onDrop={onDrop} onDragOver={onDraggingOver} className='text-white' title='image_upload' type='file' />
            <div>
                {image &&
                    <Image src={image} alt='refrence Image' width={1000} height={1000} className='w-[100px] mx-auto rounded-md' />
                }
            </div>
        </div>
    )
}

export default ImageUpload