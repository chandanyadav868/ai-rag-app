import React, { useRef, useState } from 'react'
import { useContextStore } from './CreateContext'
import CloseComponents from './CloseComponents'
import { settingMenu } from '@/constant'

import ScrollableList from './ScrollableList'
import SettingForm from './SettingForm'


function SettingComponents() {
  const [settingActiveTab, setSettingActiveTab] = useState<string>("System Instructions");

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { setSetting, systemInstruction, systemInstructionEdit, setting, systemInstructionDelete, systemInstructionAdding, setSystemInstruction, apiKey, setApiKey } = useContextStore();

  console.log("systemInstruction:- ", systemInstruction);

  return (
    <div
      style={{zIndex:999}}
      onClick={() => setSetting(false)}
      className='fixed top-0 left-0 w-screen h-screen flex justify-center items-center bg-gray-700/20 backdrop-blur-sm'
    >
      {/* Modal Box */}
      <div
        onClick={(e) => e.stopPropagation()}
        className='max-md:w-[96%] w-[80%] h-[80%] min-lg:w-4xl bg-gray-700 text-white rounded-xl relative flex flex-col'
      >
        {/* close button */}
        <CloseComponents onClick={() => setSetting(false)} />

        {/* Modal inner content */}
        <div className='w-full flex flex-1 min-h-0 p-2 py-7 gap-4 max-md:flex-col'>

          {/* setting Menu */}
          <div className='shrink-0 flex flex-col max-md:flex-row'>
            {settingMenu.map((v, i) => (
              <span key={i} onClick={() => {
                setSettingActiveTab(v.name)
              }
              } className={`font-semibold cursor-pointer p-2 ${settingActiveTab === v.name ? "bg-gray-800" : ""} hover:bg-gray-800 rounded-md`}>
                {v.name}
              </span>
            ))}
          </div>

          {/* seperate line
          <hr className='w-[2px] bg-white h-full my-auto' /> */}

          {/* menu data , important if you are making any childer overflow scrollable then give min-h-0, min-w-0,*/}
          <div className='w-full flex flex-col flex-1 min-h-0 min-w-0'>
            {/* form */}
            {settingActiveTab==="System Instructions" ?
              <>
                <SettingForm inputPlaceHolder='Add tags...' textareaPlaceHolder='Enter your system Instrcutions...' inputRef={inputRef} setSystemInstruction={setSystemInstruction} systemInstruction={systemInstruction} systemInstructionAdding={systemInstructionAdding} textareaRef={textareaRef} />

                {/* scrollable list */}
                <ScrollableList setSystemInstruction={setSystemInstruction} systemInstruction={systemInstruction} systemInstructionAdding={systemInstructionAdding} systemInstructionDelete={systemInstructionDelete} systemInstructionEdit={systemInstructionEdit} textareaRef={textareaRef} inputRef={inputRef} />
              </>
              :
              <>
                <SettingForm inputPlaceHolder='Add your api name...' textareaPlaceHolder='Enter your api keys here...' inputRef={inputRef} setSystemInstruction={setApiKey} systemInstruction={apiKey} systemInstructionAdding={systemInstructionAdding} textareaRef={textareaRef} />

                {/* scrollable list */}
                <ScrollableList setSystemInstruction={setApiKey} systemInstruction={apiKey} systemInstructionAdding={systemInstructionAdding} systemInstructionDelete={systemInstructionDelete} systemInstructionEdit={systemInstructionEdit} textareaRef={textareaRef} inputRef={inputRef} />
              </>
            }

          </div>
        </div>
      </div>
    </div>

  )
}

export default SettingComponents