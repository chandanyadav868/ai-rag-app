import { Edit, Save, Trash2 } from 'lucide-react';
import React from 'react'
import { StoreProps } from './CreateContext';

type ScrollableListProps = Pick<StoreProps, 'systemInstruction' | 'setSystemInstruction' | 'systemInstructionDelete' | 'systemInstructionEdit' | 'systemInstructionAdding'>

export interface Props extends ScrollableListProps {
    inputRef: React.RefObject<HTMLInputElement>;
    textareaRef: React.RefObject<HTMLTextAreaElement>
}

function ScrollableList({ setSystemInstruction, systemInstruction, systemInstructionAdding, systemInstructionDelete, systemInstructionEdit, inputRef, textareaRef }: Props) {
    return (
        <div className='flex-1 flex flex-col overflow-auto p-2 gap-2'>
            {systemInstruction.map((v, i) => (
                <div onClick={
                    () => {
                        console.log("Selected instruction");
                        setSystemInstruction((prev) => {
                            return prev.map((instruction, i) => instruction.id === v.id ? ({ ...instruction, systemInstructionActive: !instruction.systemInstructionActive }) : { ...instruction, systemInstructionActive: false })
                        })
                    }
                }
                    key={v.id} className={`flex flex-col gap-1 bg-gray-800 p-2 rounded-2xl ${v.systemInstructionActive ? "outline-1 outline-blue-400" : ""}`}>
                    <p
                        className='font-semibold mt-2 w-full line-clamp-2 p-1 rounded-md shrink-0'
                    >
                        {v.text}
                    </p>
                    <div className='flex gap-2 self-end items-center'>
                        <span className='bg-gray-500 rounded-md p-1 text-sm'>{v.tag}</span>
                        <span className='bg-gray-500 rounded-md p-1 text-sm'>{v.date.toLocaleDateString()}</span>
                        <Trash2 size={22} className='cursor-pointer text-red-400 hover:text-red-500  whitespace-break-spaces inline' onClick={() => systemInstructionDelete(v.id,systemInstruction,setSystemInstruction)} />
                        {!v.editable && <Edit size={22} className='cursor-pointer text-red-400 hover:text-red-500  whitespace-break-spaces inline'
                            onClick={() => {
                                if (!textareaRef.current || !inputRef.current) return
                                textareaRef.current.value = v.text
                                inputRef.current.value = v.tag
                                systemInstructionEdit(v?.id,systemInstruction,setSystemInstruction);
                            }}
                        />}
                        {/* saving */}
                        {!!v.editable && <Save size={22} className='cursor-pointer text-red-400 hover:text-red-500  whitespace-break-spaces inline'
                            onClick={() => {
                                systemInstructionAdding(textareaRef, inputRef,systemInstruction,setSystemInstruction)
                            }}
                        />}
                    </div>
                </div>
            ))}
        </div>
    )
}

export default ScrollableList