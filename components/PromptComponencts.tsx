"use client"
import Button from '@/components/Button';

import SelectSpecial from '@/components/SelectSpecial';
import Textarea from '@/components/Textarea'
import { aspectRatioImage, ImageModels } from '@/constant';
import { GeminaAiFunProps } from '@/Gemina_Api/genAi';
import { GoogleGenAI, Modality, createUserContent, createPartFromUri, Type, ApiError } from '@google/genai';
import { Bot, BrushCleaning, CheckCircleIcon, CloudUpload, Loader2, Settings, X } from 'lucide-react';
import React, { useCallback, useRef, useState } from 'react'
import { useContextStore } from './CreateContext';
import PortalElement from './PortalElement';
import SettingComponents from './SettingComponents';
import { createPortal } from 'react-dom';
import ErrorComponents from './ErrorComponents';

export const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GOOGLE_GEMINA_API });

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
    const { getBoundingBox, portalElement, setSetting, setting, setPortalElement, systemInstruction, error, setError } = useContextStore();

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

        const imageGeneration = await ai.models.generateContent({
            model: modelSelected?.value,
            contents: content,
            config: {
                responseModalities: [Modality.TEXT, Modality.IMAGE]
            }
        });

        // aap base64 or undefined payege, like iVBORw0KGgo....
        const textData = imageGeneration.text
        const imageData = imageGeneration.data;
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
                    // console.log("Error in Promise All", err);
                    throw new Error(err)
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
            console.log("err:--- ----", err);
            setError({
                type: "error",
                message: "Error occured please try again"
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
                <div className='bg-amber-300/10 historyScrollbar text-black overflow-y-auto overflow-x-hidden max-md:w-full max-w-[500px]'>

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
                                <span className='flex gap-2 cursor-pointer'>
                                    {uploadedWholeCanvasData.uploaded === true ?
                                        <>
                                            <Loader2 onMouseEnter={(e) => getBoundingBox(e, "Uploading", "top")} size={22} className='animate-spin' />
                                        </>
                                        :
                                        <>
                                            {uploadedWholeCanvasData.uri.trim().length > 0 ?
                                                <CheckCircleIcon size={22} color='green' /> :
                                                <CloudUpload size={22}
                                                    onMouseEnter={(e) => getBoundingBox(e, "Gemina Upload", "top")}
                                                    onClick={
                                                        async () => {
                                                            setUploadedWholeCanvasData((prev) => ({ ...prev, uploaded: true }))
                                                            await wholeCanvasReference()

                                                        }} className='' />
                                            }
                                        </>}
                                    <span>
                                        <X onMouseEnter={(e) => getBoundingBox(e, "Clear", "top")} size={22} color='red' className='cursor-pointer' onClick={() => setUploadedWholeCanvasData({ uploaded: false, uri: "", mimeType: "" })} />
                                    </span>
                                </span>
                            </div>
                            <div className='flex justify-between w-full items-center'>
                                <label htmlFor="imageText" id='imageText' className='font-bold text-xl'>Prompt</label>

                                <span className='font-bold text-xl rounded-md flex gap-4'>
                                    {refinedStart ?
                                        <Loader2 onMouseEnter={(e) => getBoundingBox(e, "Generating", "top")} className='animate-spin text-black' size={22} />
                                        :
                                        <Bot onMouseEnter={(e) => {
                                            setPortalElement(null);
                                            getBoundingBox(e, "Enhance Prompt", "top")
                                        }} onClick={refinePrompt} className='text-black cursor-pointer' size={22} />
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

                            {(Object.entries(promptStructure) as [keyof PromptStuctureProps, string][]).map(([key, value], i) => (
                                <div key={key} className='w-full'>
                                    <label className='font-bold' htmlFor={key}>{key.split("_").join(" ").toUpperCase()}</label>
                                    <Textarea id={key} name='imageText' placeholder='Enter Your text..' className='resize-none w-full min-h-[196px] text-white bg-black rounded-md textarea_overflow_styling max-h-[260px]' value={value} onChange={(e) => setPromptStructure((prev) => ({ ...prev, [key]: e.target.value }))} ref={textareaRef} />
                                </div>
                            ))}
                            
                            <Button disabled={Object.values(promptStructure).join(" ").trim()?.length > 0 ? false : true} loader={imageGenerate} type='submit' text='Generate' className='py-2 text-black bg-white font-black disabled:cursor-not-allowed' />
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
        </>
    )
}
)
