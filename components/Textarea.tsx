import React, { forwardRef, TextareaHTMLAttributes } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  name: string;
  placeholder: string;
  className?: string;
  value?: string;
  onValueChange?: (value: string) => void; // ✅ Custom handler
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ name, placeholder, className = '', onValueChange, onChange, ...props }, ref) => {
    return (
      <textarea
        {...props}
        name={name}
        placeholder={placeholder}
        onChange={(e) => {
          onChange?.(e); // 🧠 Keep native onChange behavior
          onValueChange?.(e.target.value); // 🧠 Also call your string handler
        }}
        className={`p-4 focus:ring-1 focus:ring-blue-800 shadow-md outline-none resize-none placeholder:font-bold ${className}`}
        ref={ref}
      />
    );
  }
);

export default Textarea;
