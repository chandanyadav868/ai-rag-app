import Link from 'next/link'
import React from 'react'

export interface ButtonProps{
    text: string
    link: string
}

// Making text and link as required props and rest all as optional props
type minimalProps = Pick<ButtonProps, 'text' | 'link'> & Partial<HTMLButtonElement>

function ButtonDesign({ link, text, className }: minimalProps) {
    return (
        <Link href={link}>
            <button className={`px-4 py-2 rounded-md outline-1 hover:outline-blue-300 border-none cursor-pointer bg-white text-black text-3xl font-bold ${className}`}>
                {text}
            </button>
        </Link>
    )
}

export default ButtonDesign