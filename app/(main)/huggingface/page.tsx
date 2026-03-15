"use client";

import React, { useEffect } from 'react';
import { AutoModel, AutoProcessor, pipeline, RawImage } from '@huggingface/transformers';
import Image from 'next/image';

// ✅ REQUIRED CONFIG
// env.allowRemoteModels = true;
// env.useBrowserCache = true;

export default function Page() {
  const img_url = 'https://huggingface.co/ybelkada/segment-anything/resolve/main/assets/car.png';


  useEffect(() => {
    const modelLoader = async () => {
      try {
        const image = await RawImage.read(img_url);
        console.log({ image });

        // Allocate pipeline
        const pipe = await pipeline('image-segmentation', 'BritishWerewolf/U-2-Net');

        const data  = await pipe(image);
        console.log({data});
        

      } catch (error) {
        console.error("Model error:", error);
      }
    };

    modelLoader();
  }, []);

  return <>
    <img width={400} height={200} className='aspect-video' src={img_url} alt="imgage" />
  </>;
}