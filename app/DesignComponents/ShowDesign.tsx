import Image from 'next/image'
import React from 'react'



function ShowDesign({landscapeThumnail,potraitThumnail,squareThumnail}:ShowDesignProps) {
  return (
     <div className='shrink-0 grid grid-cols-7 grid-rows-5 gap-2 w-[550px] h-[450px] bg-gray-300/50 rounded-md p-1'>
        {/* portrait */}
            <div className='outline-2 outline-white rounded-md row-span-full col-span-3  overflow-hidden'>
                <Image width={1000} height={1000} className={`object-cover object-top w-full h-full`} src={`${potraitThumnail}`} alt="" />
            </div>
            {/* landscape */}
            <div className='outline-2 outline-white rounded-md row-span-2 col-span-4 overflow-hidden'>
                <Image width={1000} height={1000} style={{aspectRatio:"16 / 9"}} className={`object-cover  object-top w-fullh-full`}  src={`${landscapeThumnail}`} alt="" />
            </div>
            {/* square */}
            <div className='outline-2 outline-white rounded-md col-span-4 row-span-3 overflow-hidden'>
                <Image width={1000} height={1000} className={`object-cover object-top w-full h-full`}  src={`${squareThumnail}`} alt="" />
            </div>
        </div>
  )
}

export default ShowDesign