import ShowDesign from '@/app/DesignComponents/ShowDesign'
import { slidingImage, slidingText } from '@/constant'
import React, { useRef, useState } from 'react'
import CopyBox from './CopyBox';

function ShowSection() {
  const copyRef = useRef<(HTMLParagraphElement | null)[]>([]);
  const [copying, setCopying] = useState<{id:number,active:boolean} | undefined>();

  const copyToClipboard = (index:number) => {
    // console.log(copyRef);
    const text = copyRef.current[index]?.innerText || "";
    // console.log(text);

    setCopying({id:index,active:true});
    // console.log("Copying...", text);
    navigator.clipboard.writeText(text);

    setTimeout(() => {
      setCopying(undefined);
    }, 2000);
  }

  return (
    <>
      {/* <h1 className='hero-Section-Heading mb-4'>Transformation</h1> */}
    <div className='w-[80%] mx-auto outline-1 bg-[#1a1919] outline-black p-2 flex gap-2 justify-center px-1 rounded-md flex-wrap'>

      <div className='flex flex-col flex-1 px-2'>
        <h1 className='show-Section-Heading'>Transform Images Into Different Aspects</h1>
        <p className='commonText'>Edit and enhance your images while keeping their original details intact.</p>

        <div className='flex overflow-x-scroll gap-4 mt-6 pb-2 w-[800px] copyingSectionScrollbar mx-auto'>
        {slidingText.map((v, index) => (
          <CopyBox key={index} copyRef={copyRef} copying={copying} copyToClipboard={copyToClipboard} width={40} index={index} text={v.text??''} />
        ))}
        </div>
      </div>

      {/* ShowDesign */}
      {slidingImage.map((image, index) => (
        <ShowDesign key={index} landscapeThumnail={image.LandscapeImage} potraitThumnail={image.portraitImage} squareThumnail={image.SquareImage} />
      ))}
    </div>
    </>
  )
}

export default ShowSection