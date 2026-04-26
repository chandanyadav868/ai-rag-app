import Image from 'next/image'
import React from 'react'



function ShowDesign({landscapeThumnail,potraitThumnail,squareThumnail}:ShowDesignProps) {
  return (
     <div className='m-auto grid w-full max-w-2xl shrink-0 grid-cols-7 grid-rows-5 gap-2 rounded-2xl p-1 sm:min-h-[420px] lg:min-h-[500px]'>
        {/* portrait */}
            <div className='col-span-3 row-span-full overflow-hidden rounded-xl outline-2 outline-gray-400'>
                <Image width={1000} height={1000} className={`object-cover object-top w-full h-full`} src={`${potraitThumnail}`} alt="" />
            </div>
            {/* landscape */}
            <div className='col-span-4 row-span-2 overflow-hidden rounded-xl outline-2 outline-gray-400'>
                <Image width={1000} height={1000} style={{aspectRatio:"16 / 9"}} className={`object-cover object-top h-full w-full`}  src={`${landscapeThumnail}`} alt="" />
            </div>
            {/* square */}
            <div className='col-span-4 row-span-3 overflow-hidden rounded-xl outline-2 outline-gray-400'>
                <Image width={1000} height={1000} className={`object-cover object-top w-full h-full`}  src={`${squareThumnail}`} alt="" />
            </div>
        </div>
  )
}

export default ShowDesign
