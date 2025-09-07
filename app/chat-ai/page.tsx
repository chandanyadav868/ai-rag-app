"use client"
import Input from '@/components/Input';
import Textarea from '@/components/Textarea';
import { Ellipsis, Loader2, PenLine, Send, SquarePen, Trash2 } from 'lucide-react';
import { GoogleGenAI, createPartFromUri, createUserContent } from "@google/genai"

import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom';
import Markdown from '@/components/Markdown';
import ImageUpload from '@/components/ImageUpload';
import { FileUploadResponseProps } from '../image-ai/page';
import SelectSpecial from '@/components/SelectSpecial';
import { Models } from '@/constant';


interface DeletePositionProps {
  clientX: number;
  clientY: number;
  classNumber: number;
  view: boolean;
  top?: number;
}

interface ChatHistoryProps {
  user: {
    message: string,
    loading: boolean
  },
  computer: {
    message: string,
    loading: boolean
  }
}

interface HistoryProps {
  title: string;
  chat1History: ChatHistoryProps[];
  summarychat1: string;
}

export const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GOOGLE_GEMINA_API });


function Page() {
  const containerRef = useRef<HTMLDivElement>(null);
  const deleteBoxRef = useRef<HTMLDivElement>(null);
  const mainBoxRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<number>(0); // Example active tab state
  const [submitLoading, setSubmitLoading] = useState(false);

  // fileUpload data
  const [uploadedImageData, setUploadedImageData] = useState<FileUploadResponseProps>({
    name: "",
    displayName: "",
    mimeType: "",
    sizeBytes: "",
    createTime: "",
    uri: "",
    downloadUri: "", 
  });

  const [history, setHistory] = useState<string[]>(Array.from({ length: 50 }, (v, i) => `Text ${i}`));
  const [selectedModel, setSelectedModel] = useState<string>("Gemini 2.5 Flash");
  const [rename, setRename] = useState<{ view: boolean; classNumber: number, text: string }>({ view: false, classNumber: 0, text: "" });

  const [userData, setUserData] = useState<HistoryProps[]>(
    [
      {
        title: "Chat 1",
        chat1History: [
          {
            user: {
              message: "Hello",
              loading: false
            },
            computer: {
              message: "Hi, How can I help you?",
              loading: false
            }
          }
        ],
        summarychat1: "this is the history of chat 1"
      },
      {
        title: "Chat 2",
        chat1History: [
          {
            user: {
              message: "Hello 2",
              loading: false
            },
            computer: {
              message: "Hi, How can I help you? in chat 2",
              loading: false
            }
          }
        ],
        summarychat1: "this is the history of chat 2"
      }
    ]
  );

  function onlyTitle(array: HistoryProps[]) {
    const titleArray = array.reduce((acc, curValue) => {
      acc.push(curValue.title)
      return acc
    }, [] as string[]);

    return titleArray
  }

  useEffect(() => {
    const data = onlyTitle(userData);
    setHistory(data);
  },[userData])


  const [deletePosition, setDeletePosition] = useState<DeletePositionProps>({ clientX: 0, clientY: 0, classNumber: 0, view: false, top: 0 });

  const clickOnScreen = (e: React.MouseEvent, index: number) => {
    const container = containerRef.current;
    const mainBox = mainBoxRef.current;
    console.log("container:- ", container, container?.getBoundingClientRect());

    if (!(container && mainBox)) return;

    const containerRect = container.getBoundingClientRect();
    const mainBoxRec = mainBox?.getBoundingClientRect();
    console.log("mainBoxRec:- ", mainBoxRec);

    let top = 0;
    if (mainBoxRec?.height < (e.clientY + 72)) {
      top = -72;
    }
    // e.clientX give where you clicked in the element, if that element is scrolled then it will not give the correct position because it will give where you clicked in the element not on the screen

    console.log(e.pageX, containerRect.left, container.scrollLeft);
    console.log(e.pageY, containerRect.top, container.scrollTop, e.pageY + containerRect.top + container.scrollTop);


    setDeletePosition({
      clientX: e.pageX - containerRect.left + container.scrollLeft,
      clientY: e.pageY - containerRect.top,
      classNumber: index,
      view: true,
      top
    });

  };

  const shutDown = (e: MouseEvent) => {
    if (deleteBoxRef.current && deleteBoxRef.current.contains(e.target as Node)) {
      console.log("Yes");
    } else {
      setDeletePosition(() => {
        return { clientX: 0, clientY: 0, classNumber: 0, view: false }
      })

    }
  }

  useEffect(() => {
    // console.log(deleteBoxRef);

    document.addEventListener("mousedown", shutDown)

    return () => {
      document.removeEventListener("mousedown", shutDown)
    }

  }, [deletePosition])

  const deleteHistory = () => {
    console.log("deletePosition:- ", deletePosition.classNumber);

    const filteredHistory = history.filter((_, i) => i !== deletePosition.classNumber);
    const modifiedDatat = userData.filter((_, i) => i !== deletePosition.classNumber);

    console.log("filteredHistory:- ", filteredHistory);
    setHistory(filteredHistory);
    setUserData(modifiedDatat);
    setDeletePosition(() => {
      return { clientX: 0, clientY: 0, classNumber: 0, view: false }
    })
  }

  const renameHistoryTitle = () => {
    const findtheText = history[deletePosition.classNumber];
    console.log("findtheText:- ", findtheText);

    setRename((prev) => {
      return { ...prev, view: true, classNumber: deletePosition.classNumber, text: findtheText }
    })
  }

  const handleRenameBlur = () => {
    setHistory((prev) => {
      const newHistory = [...prev];
      newHistory[rename.classNumber] = rename.text;
      return newHistory;
    })

    setRename((prev) => {
      return { ...prev, view: false, classNumber: 0, text: "" }
    })

  }

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const textareaTextFn = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = 'auto'; // Reset
    textarea.style.height = `${textarea.scrollHeight}px`; // Set new height

  }

  const responseGetting = async () => {

    const text = textareaRef.current?.value;
    console.log("Response getting...", textareaRef.current?.value, text);

    if (!textareaRef.current || textareaRef.current.value.trim() === "") {
      console.log("Textarea is empty, cannot send message.");
      return;

    }

    try {

      setSubmitLoading(true);
      setUserData((prev) => {
        const chats = [...prev];
        const newMessage = {
          user: {
            message: textareaRef.current?.value || "",
            loading: false
          },
          computer: {
            message: "This is a response from the AI.",
            loading: true
          }
        }
        const currentChat = chats[activeTab];

        const modifiedChat = {
          ...currentChat,
          chat1History: [newMessage, ...currentChat.chat1History]
        }

        console.log("modifiedChat:- ", modifiedChat);
        // console.log();
        chats[activeTab] = modifiedChat;

        console.log("chats:- ", chats);


        return chats;
      });

      let content = createUserContent([text ?? ""]);
      console.log("content:- ", content);

      if (uploadedImageData.uri && uploadedImageData.mimeType) {
        content = createUserContent([
          createPartFromUri(uploadedImageData.uri, uploadedImageData.mimeType),
          text ?? "",
        ])

      }

      const textGenerationModel = Models.find((v)=> v.name === selectedModel)
      if(!textGenerationModel) throw new Error("Your selected Model Not present");

      const response = await ai.models.generateContentStream({
        model: textGenerationModel.value,
        contents: content,
      });

      for await (const chunk of response) {
        if (chunk.candidates && chunk.candidates.length > 0 && chunk.candidates[0].content?.parts?.length && chunk.candidates[0].content?.parts[0].text) {
          console.log(chunk.candidates[0].content.parts);

          const textStreamResponse = chunk.candidates[0].content.parts[0].text;
          console.log("Response chunk:", textStreamResponse);

          setUserData((prev) => {
            const chats = [...prev];
            const currentChat = chats[activeTab];
            const modifiedChat = {
              ...currentChat,
              chat1History: currentChat.chat1History.map((v, i) => {
                if (i === 0) {
                  return {
                    ...v,
                    computer: {
                      ...v.computer,
                      message: v.computer.message + textStreamResponse,
                      loading: false
                    }
                  }
                }
                return v;
              })
            }

            chats[activeTab] = modifiedChat;
            return chats;
          });

        }


      }
    } catch (error) {
      console.log("Eror in responseGetting:", error);
    } finally {
      setSubmitLoading(false);
    }


  }

  const newConversation = () => {
    console.log("New conversation started");

    const newChat: HistoryProps = {
      title: `Chat ${userData.length + 1}`,
      chat1History: [],
      summarychat1: ""
    }

    // 1. Calculate the new userData array
    const updatedUserData = [newChat, ...userData,];

    const data: string[] = onlyTitle(updatedUserData);

    setUserData((prev) => {
      return [newChat, ...prev]

    });

    setHistory(data);
  }

  return (
    <main>
      <div ref={mainBoxRef} className='flex' style={{ height: 'calc(100vh - 60px)' }}>

        <div onScroll={() => setDeletePosition(() => { return { clientX: 0, clientY: 0, classNumber: 0, view: false } })} className='basis-[350px] bg-gray-700 p-2 px-4 overflow-y-auto flex flex-col gap-2 historyScrollbar' ref={containerRef}>
          <div className='bg-white rounded-md p-2 select-none'>
            <span onClick={newConversation} className='flex gap-2'><SquarePen size={24} /> Create</span>
          </div>
          {history.map((v, i) => (
            <span onClick={() => setActiveTab(i)} key={i} className={`w-full   cursor-pointer p-2 text-white rounded-md flex justify-between relative group/item history${i} ${activeTab === i ? "bg-black" : "bg-gray-400/10"}`}>
              {rename.view && rename.classNumber === i ?
                <>
                  <Input onBlur={handleRenameBlur} className='bg-black text-white w-full ' name='text' placeholder='' value={rename.text} onChangeValue={(e) => setRename((prev) => { return { ...prev, text: e?.value } })} />
                </>
                :
                <>
                  <span className={`line-clamp-1`} onClick={() => setActiveTab(i)}>{`${v}`}</span>
                </>}

              <Ellipsis color='white' className='invisible group-hover/item:visible cursor-pointer' onClick={(e) => clickOnScreen(e, i)} />
            </span>
          ))}

          {deletePosition.view && containerRef.current && createPortal(
            <div
              ref={deleteBoxRef}
              className='absolute w-fit p-2 rounded-md bg-white top-0 left-0 flex flex-col gap-2' style={{ zIndex: "999", transform: `translate(${deletePosition.clientX}px, ${deletePosition.clientY + 72}px)`, top: `${deletePosition.top}px` }}>
              <span onClick={renameHistoryTitle} className='flex gap-2 cursor-pointer'><PenLine /> Rename</span>
              <span onClick={deleteHistory} className='flex gap-2 text-red-400 cursor-pointer'><Trash2 /> Delete</span>
            </div>,
            containerRef.current)}

        </div>

        <div className='flex-1 bg-gradient-to-r flex flex-col'>

          <div className='flex-1 p-4 overflow-y-auto historyScrollbar'>
            <div className=' p-2'>
              {userData.length > 0 && userData[activeTab].chat1History.map((v, i) => (
                <div key={i} className='flex flex-col gap-2 mb-4'>
                  {/* user message */}
                  <div className='flex justify-end'>
                    <p className='text-left rounded-md p-2 text-white w-full bg-gray-700 max-w-1/2 whitespace-pre-wrap'>{v.user.message}</p>
                  </div>
                  {/* response message */}
                  <div>
                    {v.computer.loading ? <p className='text-white bg-gray-700 rounded-md p-2'>Loading...</p> :
                      //  <p className='text-white bg-gray-800 rounded-md p-2 whitespace-pre-wrap'>
                      //    {v.computer.message} 
                      //    </p>
                      <Markdown text={v.computer.message} runCopy={submitLoading} />
                    }
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className=''>
            <div className='w-[650px] mx-auto flex justify-center p-2 flex-col'>
              <Textarea ref={textareaRef} onChange={textareaTextFn} name='chat_generate' placeholder='Ask your query' className='bg-black text-white w-full textarea_overflow_styling max-h-[160px]' style={{ borderRadius: "10px 10px 0px 0px" }} />

              <div className='flex justify-between p-2 bg-black' style={{ borderRadius: "0px 0px 10px 10px" }}>
                <div className='flex gap-4 items-center'>
                  {/* <FilePlus color='white' className='bouncing_Effect' /> */}
                  <SelectSpecial CustomeArray={Models} selectedText={selectedModel} className='bottom-[100%]  bg-gray-600 text-black' setAspectRation={(e: string)=>{
                    setSelectedModel(()=>{
                    return e
                  })}}/>
                </div>
                  <ImageUpload setUploadedImageData={setUploadedImageData} />
                <div>
                  {submitLoading ? <Loader2 className='animate-spin text-white' />
                    :
                    <Send onClick={responseGetting} color='white' className='bouncing_Effect' />
                  }
                </div>
              </div>

            </div>
          </div>
        </div>
        <div className='bg-amber-500'>3</div>
      </div>
    </main>
  )
}

export default Page

















{/* <div>
      <Button name='Setting' className='text-white relative z-50' onClick={()=>setSettingView((prev)=> !prev)}/>

      <div className={`w-[200px] h-[200px] bg-amber-700 rounded-md  ${settingView?"setting":"settingfalse"}`}>
        
      </div>
    </div> */}