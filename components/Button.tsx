import React from 'react'

interface ButtonProps {
    name:string;
    className?:string;
    type?:"submit" | "reset" | "button";
    disabled?:boolean;
    onClick?:()=>void;
    loader?:boolean;
}

const Button = React.forwardRef<HTMLButtonElement,ButtonProps>(({className,name,type="button",disabled,onClick,loader},ref)=>{
  return (
    <>
    {loader?
    <span className={`bg-black text-white py-4 px-6 rounded-md shadow-md disabled:bg-gray-400 ${className}`}>
      Loading...
    </span>
    :
    <>
    <button  disabled={disabled} className={`bg-black text-white py-4 px-6 rounded-md shadow-md disabled:bg-gray-400 ${className}`} onClick={onClick} type={type} >{name} </button>
    </>    
  }
    </>
  )
})

export default Button