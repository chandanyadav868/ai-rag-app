import { X } from 'lucide-react'
import React, { HTMLAttributes } from 'react'



const CloseComponents: React.FC<HTMLAttributes<HTMLSpanElement>> = ({ ...props }) => {
  return (
    <span {...props} className='absolute -right-1 -top-2 rounded-full p-1 hover:bg-amber-500/60 cursor-pointer bg-amber-500 zoomingOutIn'>
      <X />
    </span>
  )
}

export default CloseComponents