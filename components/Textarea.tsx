import React, { forwardRef } from 'react'

interface TextareaProps {
    name: string;
    placeholder: string;
    className?: string;
    value?: string;
    onChange?: (e: string) => void
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({ name, placeholder, className, onChange = () => { }, ...props }, ref) => {
    return (
        <textarea {...props} name={name} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className={`p-4 rounded-md focus:ring-1 focus:ring-blue-800 shadow-md outline-none bg-gray-300 placeholder:font-bold ${className}`} ref={ref}>

        </textarea>
    )
})

export default Textarea