import React from 'react'
import { Props } from './ScrollableList';
import Input from './Input';
import Textarea from './Textarea';
import Button from './Button';

interface SettingForm {
  inputPlaceHolder:string;
  textareaPlaceHolder:string;
}

type SettingFormProps = Pick<Props,'inputRef' | 'textareaRef' | 'systemInstructionAdding' | 'setSystemInstruction' | 'systemInstruction'>

function SettingForm({inputRef,textareaRef,systemInstructionAdding,setSystemInstruction,systemInstruction,inputPlaceHolder,textareaPlaceHolder}:SettingFormProps & SettingForm) {
  return (
     <form className='w-full flex flex-col flex-1 min-h-0 min-w-0' onSubmit={(e) => {
              e.preventDefault();
              systemInstructionAdding(textareaRef, inputRef, systemInstruction, setSystemInstruction)
            }}>
              {/* fixed height textarea */}
              <Input required={true} ref={inputRef} name='tags' placeholder={inputPlaceHolder} className='w-full bg-gray-500 text-sm mb-2' />
              <Textarea
                required={true}
                ref={textareaRef}
                name='systeminstruction'
                placeholder={textareaPlaceHolder}
                className='w-full outline-1 outline-blue-600 rounded-md bg-gray-800 text-sm h-[150px]'
              />

              {/* button */}
              <Button
                text='Add'
                type='submit'
                className='bg-white text-black my-4 mx-auto font-semibold'
                style={{ padding: "6px 14px" }}
              />
            </form>
  )
}

export default SettingForm