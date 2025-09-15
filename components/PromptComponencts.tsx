"use client"
import Button from '@/components/Button';

import SelectSpecial from '@/components/SelectSpecial';
import Textarea from '@/components/Textarea'
import { aspectRatioImage, ImageModels } from '@/constant';
import { GeminaAiFunProps } from '@/Gemina_Api/genAi';
import { Modality, createUserContent, createPartFromUri, Type } from '@google/genai';
import { Bot, BrushCleaning, CheckCircleIcon, CloudUpload, Info, Loader2, Settings, X } from 'lucide-react';
import React, { useCallback, useRef, useState } from 'react'
import { useContextStore } from './CreateContext';
import PortalElement from './PortalElement';
import SettingComponents from './SettingComponents';
import { createPortal } from 'react-dom';
import ErrorComponents from './ErrorComponents';
import InfoComponent from './InfoComponent';
import { useSession } from 'next-auth/react';

interface ErrorPropsGeminaProps {
    error: {
        code: number,
        message: string,
        status: string,
    }

}

export const PromptComponencts = React.memo(function ({ imageSetting, state, canvasOrientation, fabricJs }: ImageSettingProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [selectedModel, setSelectedModel] = useState<string>("Gemini 2.0 Flash");
    const [imageGenerate, setImageGenerate] = useState(false);
    const [canvasReference, setCanvasReference] = useState(false);
    const [refinedStart, setRefinedStart] = useState<boolean>(false);
    const [promptStructure, setPromptStructure] = useState<PromptStuctureProps>({
        main_subject: "",
        action_context: "",
        detailed_description: "",
        artistic_style: "",
        mood: "",
        lighting: "",
        composition: "",
        color_palette: "",
        quality_enhancers: "",
        negative_prompts: "",
    });

    // createContext 
    const { getBoundingBox, portalElement, setSetting, setting, setPortalElement, systemInstruction, error, setError, apiSetup, apiKey, info, setInfo, infoSelectionFn } = useContextStore();
    const {loginUserData,setLoginUserData} = useContextStore()
    


    const [uploadedWholeCanvasData, setUploadedWholeCanvasData] = useState<FileUploadResponseProps>({
        uploaded: false,
        uri: "",
        mimeType: ""
    });


    // fuction for getting refrence of canvas
    async function wholeCanvasReference() {
        if (!fabricJs.current) return;
        if (uploadedWholeCanvasData.uri.trim().length > 0) return

        const exportWidth = aspectRatioImage.find((v, i) => v.orientation === canvasOrientation);
        const data = await fabricJs.current.toBlob({ format: "png", quality: 1, multiplier: 1, enableRetinaScaling: true, height: exportWidth?.height, width: exportWidth?.width });


        console.log("data:- ", data);


        if (!data) return;

        // Convert blob to file
        const file = new File([data], "image.png", { type: data.type || "image/png" });
        console.log("file:- ", file);

        const ai = apiSetup()

        const myfile = await ai.files.upload({
            file: file,
            config: {
                mimeType: "image/png"
            }
        });

        console.log("myfile:- ", myfile);


        setUploadedWholeCanvasData((prev) => ({ ...prev, uploaded: false, ...myfile }))

    }


    // this generate image and return buffer or error 
    async function geminaAiImage({ text }: GeminaAiFunProps) {


        let content = createUserContent([text]);
        console.log("uploadedImageData:- ", state, "canvasReference:- ", canvasReference);

        if (canvasReference || state.length > 0) {
            content = await contentStrucure(state, text)
        }

        console.log("content:- ", content);
        const modelSelected = ImageModels.find((v) => v.name === selectedModel);
        if (!modelSelected) throw new Error("Selected Model Name does present");

        // if user given its own keys then make as many as it gives if he use my own keys then give limitation
        const usingApi = apiKey.find((v, i) => !!v.systemInstructionActive);
        let imageGeneration;

        if (!usingApi) {
            console.log("api calling going to the backend not present any apikey so.........");
            
            const response = await fetch("/api/ai-image-generate",{
                method:"POST",
                body:JSON.stringify({content,id:loginUserData?.id}),
                headers:{
                    "Content-Type":"application/json"
                }
            });

            if (response.ok) {
                const responseJson = await response.json();
                console.log(responseJson);
                if (responseJson.status === 200) {
                    imageGeneration = responseJson.data
                    setLoginUserData((prev)=> {
                        if (!prev) {
                            return prev
                        }
                        return {...prev,credit:prev.credit? prev.credit - 1:0}
                    })
                    
                }
            }


        } else {
            const ai = apiSetup();
            imageGeneration = await ai.models.generateContent({
                model: modelSelected?.value,
                contents: content,
                config: {
                    responseModalities: [Modality.TEXT, Modality.IMAGE]
                }
            });
        }


        // aap base64 or undefined payege, like iVBORw0KGgo....
        const textData = imageGeneration?.text
        const imageData = imageGeneration?.data;
        console.log("textData:- ", textData);

        if (!imageData) throw new Error("Image not generated")
        // aap base64 ko buffer mai convert karege jo ki array hoga which represent the number like Uint8Array(914221) [137, 80, 78]
        const buffer = Buffer.from(imageData, "base64")
        // console.log("buffer:- ",buffer);
        return buffer


    }

    // this is for the runing image Generation in promise.all and convert buffer into the blob
    const imageGenerationFn = async () => {

        // take a check on promptStructure user have put message or not if not then return
        if (!Object.values(promptStructure).some((v) => v.trim().length > 0)) {
            return
        }

        // convert your object Prompt into the stringify means a string as it is as 
        let textareaStringModified = JSON.stringify(Object.values(promptStructure).join(" "));
        console.log("textareaString:- ", textareaStringModified);

        try {
            // loading start
            setImageGenerate(true)
            // Promise.all send run all methods which are present in the array of it and wait till all funtion run and give response, if any one fail then promise will failed
            const reponse = await Promise.all([geminaAiImage({ text: textareaStringModified })])
                // res is holding the return which send by geminaAiImage which are buffer , that is return from here
                .then((res) => {
                    console.log("Response:- ", res);
                    return res as Buffer<ArrayBuffer>[]
                }) // if error come then it throw error
                .catch((err) => {
                    // jo error bheja hai wo err ke message ke pass hota hai n ki err ke pass, pura object
                    console.log("Error in Promise All", err.message);
                    throw new Error(err.message)
                });

            // response is holding buffer number inside the array, make new blob object for storeing temporary inside the browser, take buffer value and make a image from it 
            const blob = new Blob([reponse[0]], { type: "image/png" });
            // send this blob image to useState 
            imageSetting(blob);
            setError({
                type: "success",
                message: "Created Successfully"
            })

        } catch (err) {
            // jo wha se bheja hai wo message mai hota hai
            const catchError = err as { message: string, name: string }
            const { error: { message, code, status } } = JSON.parse(catchError.message) as ErrorPropsGeminaProps
            console.log("Parsed error:", error);

            setError({
                type: "error",
                message: message
            });

        } finally {
            setImageGenerate(false)
        }

    }


    // give put all data in structure ways
    const contentStrucure = useCallback(async function (state: StateProps[], convertIntoString: string) {
        // check user clicked to send whole canvas 
        if (canvasReference) {
            // run methods and upload whole canvas image to the gemini
            await wholeCanvasReference();
            // return structure response back
            let content = createUserContent([
                createPartFromUri(uploadedWholeCanvasData.uri, uploadedWholeCanvasData.mimeType),
                convertIntoString,
            ]);

            console.log("content:- ", content);
            return content

        } else {
            // fileDataUpload will hold all images data which user want to send for new image generation,
            // filtering only those whole have been checked by user and have uri and mimeType of gemina upload
            // map run only selected data of array and make new structure by pushing each data into the array
            const fileDataUploaded = state
                .filter((v): v is typeof v & { uri: string; mimeType: string } => !!v && !!v?.geminaUploadData?.uri && !!v?.geminaUploadData?.mimeType && !!v?.refrenceAiCheckBox)
                .map((v, i) => createPartFromUri(v?.geminaUploadData?.uri ?? "", v?.geminaUploadData?.mimeType ?? "")
                );

            console.log("fileDataUploaded:- ", fileDataUploaded);
            // fileDataUpload have array of Object so spread, make new data structure which want to send model
            return createUserContent([
                ...fileDataUploaded,
                convertIntoString,
            ])
        }
    }, []);

    // if user want a prompt enhance
    const refinePrompt = async () => {
        try {
            // it taking Object , convert values into Array, then join with space
            const convertIntoString = Object.values(promptStructure).join(" ");
            if (convertIntoString.trim().length <= 0) return
            // methods put above string into structure ways, let used for changing value
            let content = createUserContent([convertIntoString]);

            // if i have layer then check user want to send any layer as reference
            if (state.length > 0) {
                content = await contentStrucure(state, convertIntoString)
            }

            console.log("content:- ", content);
            setRefinedStart(true)

            // this methods collect the instruction which user selected from setting if not then a empty
            const systemPromptSelected = systemInstruction.find((v, i) => !!v.systemInstructionActive)?.text ?? "";
            console.log("systemPromptSelected:- ", systemPromptSelected);

            const ai = apiSetup()

            // make api call, comeback with response or error
            const aiPromptRefine = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: content,
                config: {
                    systemInstruction: {
                        role: "system",
                        text: systemPromptSelected
                    },
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                main_subject: { type: Type.STRING },
                                action_context: { type: Type.STRING },
                                detailed_description: { type: Type.STRING },
                                artistic_style: { type: Type.STRING },
                                mood: { type: Type.STRING },
                                lighting: { type: Type.STRING },
                                composition: { type: Type.STRING },
                                color_palette: { type: Type.STRING },
                                quality_enhancers: { type: Type.STRING },
                                negative_prompts: { type: Type.STRING }
                            },
                            propertyOrdering: [
                                "main_subject",
                                "action_context",
                                "detailed_description",
                                "artistic_style",
                                "mood",
                                "lighting",
                                "composition",
                                "color_palette",
                                "quality_enhancers",
                                "negative_prompts"
                            ]
                        }
                    }

                }
            });

            // retrieve test from it, hold it in text
            const text = aiPromptRefine.text

            // if not then throw error
            if (!text) {
                throw new Error("Ai not Responsed")
            }

            // do JSON parse the text into the array with object
            const refinedPromptStructureWays = JSON.parse(text);
            // pass the Object to the UseState
            setPromptStructure(refinedPromptStructureWays[0]);

        } catch (error) {
            console.log("Error in refine Prompt", error);
        } finally {
            setRefinedStart(false)
        }

    }

    console.log("Just for checking re-render this Functional Componet", ImageModels.map(v => v.name));



    return (
        <>
            <div id="imageEditor" className='flex'>
                <div className='bg-amber-300/10 historyScrollbar text-black overflow-y-auto overflow-x-hidden max-md:w-full w-[500px]'>

                    <div className='flex p-2 items-center text-lg'>
                        <span className='font-bold flex-1'>Credit</span>
                        <svg className='w-5 h-5 mr-2' xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path
                            fill='black'
                            d="M192 160L192 144C192 99.8 278 64 384 64C490 64 576 99.8 576 144L576 160C576 190.6 534.7 217.2 474 230.7C471.6 227.9 469.1 225.2 466.6 222.7C451.1 207.4 431.1 195.8 410.2 187.2C368.3 169.7 313.7 160.1 256 160.1C234.1 160.1 212.7 161.5 192.2 164.2C192 162.9 192 161.5 192 160.1zM496 417L496 370.8C511.1 366.9 525.3 362.3 538.2 356.9C551.4 351.4 564.3 344.7 576 336.6L576 352C576 378.8 544.5 402.5 496 417zM496 321L496 288C496 283.5 495.6 279.2 495 275C510.5 271.1 525 266.4 538.2 260.8C551.4 255.2 564.3 248.6 576 240.5L576 255.9C576 282.7 544.5 306.4 496 320.9zM64 304L64 288C64 243.8 150 208 256 208C362 208 448 243.8 448 288L448 304C448 348.2 362 384 256 384C150 384 64 348.2 64 304zM448 400C448 444.2 362 480 256 480C150 480 64 444.2 64 400L64 384.6C75.6 392.7 88.5 399.3 101.8 404.9C143.7 422.4 198.3 432 256 432C313.7 432 368.3 422.3 410.2 404.9C423.4 399.4 436.3 392.7 448 384.6L448 400zM448 480.6L448 496C448 540.2 362 576 256 576C150 576 64 540.2 64 496L64 480.6C75.6 488.7 88.5 495.3 101.8 500.9C143.7 518.4 198.3 528 256 528C313.7 528 368.3 518.3 410.2 500.9C423.4 495.4 436.3 488.7 448 480.6z" /></svg>
                        <span className='font-bold'>{loginUserData?.credit}</span>

                    </div>

                    <SelectSpecial CustomeArray={ImageModels} selectedText={selectedModel} className='bg-gray-600 text-black' setAspectRation={(e: string) => {
                        setSelectedModel(prev => {
                            e as string
                            return e

                        })
                    }} />

                    <form onSubmit={(e) => {
                        e.preventDefault();
                        imageGenerationFn();
                    }}>
                        <div className='flex items-center gap-4 mx-auto p-2 flex-wrap'>
                            <div className='flex justify-between w-full items-center'>
                                <span>
                                    <input onChange={(e) => setCanvasReference(e.target.checked)} type="checkBox" id='canvas' className='mr-2' />
                                    <label htmlFor="canvas" id='imageText' className='font-bold text-xl'>Whole Canvas Reference</label>
                                </span>
                                <span className='flex gap-2'>
                                    {uploadedWholeCanvasData.uploaded === true ?
                                        <>
                                            <Loader2 onMouseEnter={(e) => getBoundingBox(e, "Uploading", "top")} size={22} className='animate-spin' />
                                        </>
                                        :
                                        <>
                                            {uploadedWholeCanvasData.uri.trim().length > 0 ?
                                                <CheckCircleIcon size={22} color='green' /> :
                                                <span className='flex items-center justify-center gap-0.5'>
                                                    <Info size={15} className='self-end cursor-pointer' onClick={(e) => infoSelectionFn({ message: "This will upload whole your canvas as it is on the google which you can use for further editing , if you make changes then reupload it by canceling previous upload with close sign which are next to it", visible: true, e })} />
                                                    <CloudUpload size={22}
                                                        onMouseEnter={(e) => getBoundingBox(e, "Gemina Upload", "top")}
                                                        onClick={
                                                            async () => {
                                                                setUploadedWholeCanvasData((prev) => ({ ...prev, uploaded: true }))
                                                                await wholeCanvasReference()

                                                            }} className='cursor-pointer' />
                                                </span>
                                            }
                                        </>}
                                    <span>
                                        <X onMouseEnter={(e) => getBoundingBox(e, "Clear", "top")} size={22} color='red' className='cursor-pointer' onClick={() => setUploadedWholeCanvasData({ uploaded: false, uri: "", mimeType: "" })} />
                                    </span>
                                </span>
                            </div>
                            <div className='flex justify-between w-full items-center'>
                                <label htmlFor="imageText" id='imageText' className='font-bold text-xl'>Prompt Enhancer</label>

                                <span className='font-bold text-xl rounded-md flex gap-4 '>
                                    {refinedStart ?
                                        <Loader2 onMouseEnter={(e) => getBoundingBox(e, "Generating", "top")} className='animate-spin text-black' size={22} />
                                        :
                                        <span className='flex items-center justify-center gap-0.5'>
                                            {/* <Info size={15}  className='self-end'/> */}
                                            <Bot onMouseEnter={(e) => {
                                                setPortalElement(null);
                                                getBoundingBox(e, "Enhance Prompt", "top")
                                            }} onClick={refinePrompt} className='text-black cursor-pointer' size={22} />
                                        </span>
                                    }
                                    {/* setting */}
                                    <span className='font-bold text-xl rounded-md transform hover:rotate-15' >
                                        {<Settings onMouseEnter={(e) => getBoundingBox(e, "Setting", "top")} onClick={() => {
                                            setPortalElement(null);
                                            setSetting((prev) => !prev)
                                        }} className='text-black cursor-pointer' size={22} />}
                                    </span>

                                </span>

                            </div>
                            <div>

                            </div>
                            <div className='flex justify-between items-center w-full'>
                                <BrushCleaning
                                    onMouseEnter={(e) => getBoundingBox(e, "Clear Prompt", "left")}
                                    type='button'
                                    onClick={() => {
                                        setPromptStructure({
                                            main_subject: "",
                                            action_context: "",
                                            detailed_description: "",
                                            artistic_style: "",
                                            mood: "",
                                            lighting: "",
                                            composition: "",
                                            color_palette: "",
                                            quality_enhancers: "",
                                            negative_prompts: "",
                                        });
                                    }} className='text-red-600  font-black cursor-pointer' />

                                <Button disabled={Object.values(promptStructure).join(" ").trim()?.length > 0 ? false : true} loader={imageGenerate} type='submit' text='Generate' className='py-2 text-black bg-white font-black disabled:cursor-not-allowed' />
                            </div>

                            {(Object.entries(promptStructure) as [keyof PromptStuctureProps, string][]).map(([key, value], i) => (
                                <div key={key} className='w-full'>
                                    <label className='font-bold' htmlFor={key}>{key.split("_").join(" ").toUpperCase()}</label>
                                    <Textarea id={key} name='imageText' placeholder='Enter Your text..' className='resize-none w-full min-h-[196px] text-white bg-black rounded-md textarea_overflow_styling max-h-[260px]' value={value} onChange={(e) => setPromptStructure((prev) => ({ ...prev, [key]: e.target.value }))} ref={textareaRef} />
                                </div>
                            ))}


                        </div>
                    </form>
                </div>

            </div>

            {/* i will have to attach in this because it directly does not add that inside the element, we must present when intial setup is done */}
            <PortalElement />
            {/* setting components */}
            {setting && <SettingComponents />}

            {/* error showing */}
            {error && createPortal(<ErrorComponents />, document.body)}

            {/* info */}
            {info && info.visible && createPortal(<InfoComponent infoDomRect={info} />, document.body)}
        </>
    )
}
)
