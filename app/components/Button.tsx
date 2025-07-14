import React from 'react'

interface ButtonProps {
    name:string;
    className?:string;
    type:"submit" | "reset" | "button";
    disabled:boolean
}

const Button = React.forwardRef<HTMLButtonElement,ButtonProps>(({className,name,type,disabled,...props},ref)=>{
  return (
    <button {...props} disabled={disabled} className={`bg-black text-white py-4 px-6 rounded-md shadow-md disabled:bg-gray-400 ${className}`} type='submit' >{name}</button>
  )
})

export default Button