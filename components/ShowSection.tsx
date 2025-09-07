import ShowDesign from '@/app/DesignComponents/ShowDesign'
import { slidingImage } from '@/constant'
import React from 'react'

function ShowSection() {
  return (
    <div className='w-[80%] mx-auto outline-1 outline-black p-2 flex gap-2 showSectionScrollbar overflow-x-auto px-1 rounded-md'>
        {/* ShowDesign */}
        {slidingImage.map((image, index) => (
            <ShowDesign key={index} landscapeThumnail={image.landscapeThumnail} potraitThumnail={image.potraitThumnail} squareThumnail={image.squareThumnail}/>
        ))} 
    </div>
  )
}

export default ShowSection