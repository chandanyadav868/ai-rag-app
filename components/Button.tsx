import React, { HTMLAttributes } from 'react'

interface ButtonProps extends HTMLAttributes<HTMLButtonElement> {
    text:string;
    loader?:boolean;
    disabled?:boolean;
    type:"submit" | "reset" | "button" | undefined
}

const Button = React.forwardRef<HTMLButtonElement,ButtonProps>(({className,loader,onClick,disabled,text,type,...props},ref)=>{
  return (
    <>
    {loader?
    <span className={`py-4 px-6 rounded-md shadow-md disabled:bg-gray-400 w-full text-center ${className}`}>
      Loading...
    </span>
    :
    <>
    <button {...props}  disabled={disabled} className={`bg-black py-4 px-6 rounded-md shadow-md disabled:bg-gray-400 cursor-pointer ${className}`} onClick={onClick} type={type} >{text} </button>
    </>    
  }
    </>
  )
})

export default Button