import React,{forwardRef} from 'react'

interface InputProps {
    name:string;
    placeholder:string;
    className?:string;
    value?:string;
    onChange?:(e:EventTarget & HTMLInputElement)=>void
    type?:React.HTMLInputTypeAttribute;
    accept?:'application/pdf'
}

const Input = forwardRef<HTMLInputElement,InputProps>(({name,placeholder,className,type="text",accept,onChange=()=>{},...props},ref)=>{
  return (
    <input {...props} name={name} accept={accept} type={type} placeholder={placeholder} onChange={(e)=>onChange(e.target)} className={`p-4 rounded-md focus:ring-1 focus:ring-blue-800 shadow-md outline-none bg-gray-300 placeholder:font-bold ${className}`} ref={ref}>
        
    </input>
  )
})

export default Input