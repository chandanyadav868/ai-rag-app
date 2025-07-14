"use client"

import { geminaAiImage, geminaAiText, ImageGenerateWithAi, PdfAnswerWithAi } from '@/Gemina_Api/genAi'
import React, { useEffect, useRef, useState } from 'react'
import Input from './components/Input';
import Button from './components/Button';

export interface chatHistoryReportProps {
  user: {
    message:string
  };
  computer:{
    message:string
  }
}

function Home() {
  const chatInputRef = useRef<HTMLInputElement>(null);
  const [chatInputText,setChatInputText] = useState("");
  const [chatHistoryReport,setChatHistoryResport] = useState<chatHistoryReportProps[]>([
    {
      user:{
        message:""
      },
      computer:{
        message:""
      }
    }
  ]);


  const aiResponse = async () => {
    try {
      if (chatInputText.trim() === "") {
        
      }
      const response = await PdfAnswerWithAi({ text: chatInputText });
    } catch (error) {
      console.log("error in generating Image:- ", error);
    }
  };

  const fileUploader = async (e:EventTarget & HTMLInputElement)=>{
    if (e===null) return
    console.log(e.files?.[0]);

   const file = e.files?.[0]; // Now TypeScript knows 'file' is definitely a File object
   if (!file) {
    return
   }

    const formdata = new FormData();
    formdata.append("file_pdf", file, file?.name); // Pass the file and its name

    const response = await fetch("/api/file",{
      method:"POST",
      body:formdata
    })


    console.log(await response.json());
    
  }


  return (
    <>
      <h1 className="text-3xl font-bold underline text-center">
        PDF Question Answer
      </h1>

      <div className='flex gap-4 justify-between p-2'>
        <div className='flex-1'>
          <Input onChange={fileUploader} type='file' accept='application/pdf' name='pdfFile' placeholder='pdf file uploader' className='cursor-pointer block mx-auto' />
        </div>

        <div className='flex-1 flex flex-col gap-2'>
          {/* conversion history */}
          <div className='h-[85vh] overflow-y-auto p-2 rounded-md'>

          </div>

          <form className='flex gap-4' onSubmit={() => aiResponse()}>
            <Input value={chatInputText} ref={chatInputRef} name='chatInput' placeholder='Enter Your Text' className='w-full' onChange={(e)=>setChatInputText(e.value)}></Input>
            <Button disabled={chatInputText.trim() === ""} type="submit" className='' name='Send' />
          </form>

        </div>
      </div>

    </>
  )
}

export default Home
