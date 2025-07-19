"use client"

import { geminaAiImage, geminaAiText, ImageGenerateWithAi, PdfAnswerWithAi } from '@/Gemina_Api/genAi'
import React, { useEffect, useRef, useState } from 'react'
import Input from '@/components/Input';
import Button from '@/components/Button';
import { ObjectProps } from '@/utils/util';
import markdownit from 'markdown-it'
import hljs from 'highlight.js'
import PDFViewer from '@/components/PDFVIEWER';
import { History, Loader2 } from "lucide-react"

export interface chatHistoryReportProps {
  user: {
    message: string
  };
  computer: {
    message: string
  }
}

function Home() {
  const chatInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [chatInputText, setChatInputText] = useState("");
  const [pdfUploadedData, setPdfUploadedData] = useState<ObjectProps[]>([]);
  const [buttonState, setButtonState] = useState(false);
  const [fileUploading, setFileUploading] = useState(false);
  const [userSelectedPdf, setUserSelectedPdf] = useState<ObjectProps>({
    name: "",
    displayName: "",
    mimeType: "",
    sizeBytes: "",
    createTime: "",
    expirationTime: "",
    updateTime: "",
    sha256Hash: "",
    uri: "",
    state: "",
    source: "",
  });

  const [chatHistoryReport, setChatHistoryResport] = useState<chatHistoryReportProps[]>([
    {
      user: {
        message: ""
      },
      computer: {
        message: ""
      }
    }
  ]);

  // markdown-it
  // Actual default values
  const md = markdownit({
    highlight: function (str, lang) {
      if (lang && hljs.getLanguage("js")) {
        try {
          return '<div style="position: relative;"> <span class="copy">Copy</span> <pre><code class="hljs">' +
            `${hljs.highlight(str, { language: lang, ignoreIllegals: true }).value}` +
            '</code></pre></div>';;
        } catch (__) { }
      }

      return ''; // use external default escaping
    }
  });

  const responseData = async () => {
    const response = await fetch("api/previous_pdf", { method: "GET" });

    const responseJson = await response.json();
    console.log("responseData:- ", responseJson);
    if (responseJson.status === 200) {
      setPdfUploadedData(responseJson.data)
    }
  }

  const copy = (e: MouseEvent) => {
    const span = e.currentTarget as HTMLSpanElement;
    const data = span.nextElementSibling?.textContent ?? ""
    console.log(data);
    window.navigator.clipboard.writeText(data);
    span.textContent = "Copying"
    setTimeout(() => {
      span.textContent = "Copy"
    }, 500);
  }

  useEffect(() => {
    const root = containerRef.current;
    if (!root) {
      return
    }

    const elems = root.querySelectorAll("span.copy") as NodeListOf<HTMLSpanElement>;
    elems.forEach((el) => el.addEventListener("click", copy));

    return () => {
      elems.forEach((el) => el.removeEventListener("click", copy));
    }

  }, [chatHistoryReport])

  useEffect(() => {
    responseData()
  }, [])


  const aiResponse = async () => {
    try {
      if (chatInputText.trim() === "") {
        return
      }

      setButtonState(true)

      setChatHistoryResport((prev) => {
        const latestData = {
          computer: {
            message: ""
          },
          user: {
            message: ""
          }
        }
        const newUpdatedData = [...prev, { ...latestData, user: { message: chatInputText } }] as chatHistoryReportProps[];

        return newUpdatedData
      })

      const response = await PdfAnswerWithAi({ text: chatInputText, chatPdf: userSelectedPdf });

      console.log("response:- ", response);
      setChatHistoryResport((prev) => {
        const latestData = prev[prev.length - 1]
        console.log("latestData:- ", { ...latestData, computer: { text: response ?? "" } });
        console.log("prev:- ", prev);

        console.log("Data value:- ", ...prev.slice(0, prev.length));


        const newUpdatedData = [...prev.slice(0, (prev.length - 1)), { ...latestData, computer: { message: response } }] as chatHistoryReportProps[];

        console.log("newUpdatedData:-", newUpdatedData);

        return newUpdatedData
      }
      )

    } catch (error) {
      console.log("error in generating Image:- ", error);
    } finally {
      setButtonState(false)
    }
  };

  const fileUploader = async (e: EventTarget & HTMLInputElement) => {
    try {
      if (e === null) return
      console.log(e.files?.[0]);

      const file = e.files?.[0]; // Now TypeScript knows 'file' is definitely a File object
      if (!file) {
        return
      }

      setFileUploading(true);

      const formdata = new FormData();
      formdata.append("file_pdf", file, file?.name); // Pass the file and its name

      const response = await fetch("/api/file", {
        method: "POST",
        body: formdata
      })

      const responseJson = await response.json()
      console.log(responseJson);

      await responseData();
    } catch (error) {
      console.log("Error in file Uploading", error);
    } finally {
      setFileUploading(false)
    }

  }


  const setUserSelectedPdfFn = (uri: string) => {
    const selectedObject = pdfUploadedData.find((v, i) => v.uri === uri) as ObjectProps;
    console.log("selectedObject:- ", selectedObject);

    setUserSelectedPdf(selectedObject)
  }



  return (
    <div className='w-full max-h-screen overflow-x-auto overflow-y-hidden'>
      <h1 className="text-3xl font-bold underline text-center">
        PDF Question Answer
      </h1>



      <div className='flex gap-4 justify-between p-2 h-full'>
        <div className='flex-1 h-[93vh]'>
          <span className='flex gap-2 items-center justify-center'>
            <span className='w-[400px]'>
              <Input onChange={fileUploader} type='file' accept='application/pdf' name='pdfFile' placeholder='pdf file uploader' className='cursor-pointer block mx-auto w-fit' />
            </span>
            {fileUploading && <Loader2 color='black' className='animate-spin' />}

          </span>

          <div className='flex gap-4 mt-4 overflow-x-auto px-4'>
            {pdfUploadedData.map((v, i) => (
              <div key={i} className='flex gap-2 rounded-md shadow-md p-2 bg-white mb-2'>
                <input onChange={(e) => setUserSelectedPdfFn(e.target.value)} type="checkbox" name="pdf" id="pdf" value={v.uri} />
                <span className='text-nowrap'>{v.displayName}</span>
              </div>
            ))}
          </div>

          <PDFViewer fileData={userSelectedPdf} />
        </div>

        <div className='flex-1 flex flex-col gap-2 bg-gray-50 p-2 rounded-md justify-center h-full shrink-0 max-lg:min-w-full px-2'>
          {/* conversion history */}
          <div>
            <button onClick={() => setChatHistoryResport([])}>
              <History className='cursor-pointer' />
            </button>
          </div>
          <div className='h-[75vh] overflow-y-auto p-2 rounded-md'>
            {chatHistoryReport.map((v, i) => (
              <div key={i}>
                <div className='bg-gray-600 text-white rounded-md p-2 mb-2'>
                  <span></span>
                  <span>{v.user.message}</span>
                </div>
                <div ref={containerRef}>
                  <p className='prose' dangerouslySetInnerHTML={{ __html: md.render(v.computer.message) }}></p>
                </div>
              </div>
            ))}
          </div>

          <form className='flex gap-4' onSubmit={(e) => {
            e.preventDefault();
            aiResponse()
          }
          }>
            <Input value={chatInputText} ref={chatInputRef} name='chatInput' placeholder='Enter Your Text' className='w-full' onChange={(e) => setChatInputText(e.value)}></Input>
            <Button loader={buttonState} disabled={chatInputText.trim() === ""} type="submit" className='' name='Send' />
          </form>

        </div>
      </div>

    </div>
  )
}

export default Home
