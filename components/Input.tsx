import React,{forwardRef} from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    name:string;
    placeholder?:string;
    value?:string;
    onChangeValue?:(e:EventTarget & HTMLInputElement)=>void
    type?:React.HTMLInputTypeAttribute;
    accept?:'application/pdf'
}

const Input = forwardRef<HTMLInputElement,InputProps>(({name,placeholder,className,type="text",accept,onChangeValue=()=>{},...props},ref)=>{
  return (
    <input {...props} name={name} accept={accept} type={type} placeholder={placeholder} onChange={(e)=>onChangeValue(e.target)} className={`p-4 rounded-md shadow-md outline-none  placeholder:font-bold ${className}`} ref={ref}>
        
    </input>
  )
})

export default Input