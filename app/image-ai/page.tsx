"use client"
import Button from '@/components/Button';
import CustomeSelect from '@/components/CustomeSelect';

import Input from '@/components/Input';
import Textarea from '@/components/Textarea'
import { aspectRatioImage } from '@/constant';
import { GeminaAiFunProps } from '@/Gemina_Api/genAi';
import { GoogleGenAI, Modality, createUserContent, createPartFromUri } from '@google/genai';
import { Bot, Loader2, UploadCloudIcon } from 'lucide-react';
import Image from 'next/image';
import React, { ChangeEvent, useEffect, useRef, useState } from 'react'

export const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GOOGLE_GEMINA_API });

export interface FileUploadResponseProps {
    name?: string;
    displayName?: string;
    mimeType?: string;
    sizeBytes?: string;
    createTime?: string;
    uri?: string;
    downloadUri?: string;
    isChecked?: boolean;
    previewUrl?: string;
    blob?: Blob;
}

function Page() {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const textareaBackgroundRef = useRef<HTMLTextAreaElement>(null);
    const [textareaString, setTextareaString] = useState<string>("");
    const [textareaBackground, setTextareaBackground] = useState<string>("");
    // artist
    const [selectedArtist, setSelectedArtist] = useState<string>("");

    // colorPallete
    const [selectedColorPallete, setSelectedColorPallete] = useState<string>("")

    // AtmosphericEffects
    const [selectedAtmosphericEffects, setSelectedAtmosphericEffects] = useState<string>("");

    // LightingEffects
    const [selectedLightingEffects, setSelectedLightingEffects] = useState<string>("");

    // Composition
    const [selectedComposition, setSelectedComposition] = useState<string>("");

    const [imageSrc, setImageSrc] = useState<string[]>([]);
    const [imageGenerate, setImageGenerate] = useState(false);

    const [referenceImage, setRefrenceImage] = useState<string[]>([]);

    const [uploadedImageData, setUploadedImageData] = useState<FileUploadResponseProps[]>([]);

    // ai generate buffer
    const [aiGeneratedImageBuffer, setAiGeneratedImageBuffer] = useState<Buffer<ArrayBuffer>[]>([])

    const convertingImages = async (data: FileList) => {
        // console.log(await data[0].arrayBuffer())
        const binaryData = await data[0].arrayBuffer();
        const notAllowed = ["image/avif"]
        if (notAllowed.includes(data[0].type)) {
            console.log("Not allowed Image");
            return
        }
        const contentShowingBlob = new Blob([binaryData], { type: data[0].type });
        console.log(contentShowingBlob);

        const urlCreatingBlob = URL.createObjectURL(contentShowingBlob);

        const myfile = await ai.files.upload({
            file: contentShowingBlob,
            config: {
                mimeType: data[0].type
            }
        });

        console.log(myfile);
        setUploadedImageData((prev) => [...prev, { ...myfile, isChecked: false, previewUrl: urlCreatingBlob, blob: contentShowingBlob }]);

        setRefrenceImage((prev) => [...prev, urlCreatingBlob]);

    }


    async function geminaAiImage({ text }: GeminaAiFunProps) {
        let content = createUserContent([text]);
        console.log("uploadedImageData:- ", uploadedImageData);

        if (uploadedImageData.length > 0) {
            const fileDataUploaded = uploadedImageData
                .filter((v): v is typeof v & { uri: string; mimeType: string } => !!v && !!v.uri && !!v.mimeType && !!v.isChecked)
                .map((v) => createPartFromUri(v.uri, v.mimeType));

            console.log("fileDataUploaded:- ", { ...fileDataUploaded });


            content = createUserContent([
                ...fileDataUploaded,
                text,
            ])

        }

        console.log("content:- ", content);

        const imageGeneration = await ai.models.generateContent({
            model: "gemini-2.0-flash-preview-image-generation",
            contents: content,
            config: {
                responseModalities: [Modality.TEXT, Modality.IMAGE]
            }
        });

        if (!imageGeneration?.candidates?.[0].content?.parts) {
            console.log("Response Data undefined");

            return
        }

        console.log("imageGeneration:- ", imageGeneration);


        for (const part of imageGeneration?.candidates[0]?.content?.parts) {
            if (part.text) {
                console.log(part.text);

            } else if (part.inlineData) {
                const imageData = part.inlineData.data;

                if (!imageData) {
                    throw new Error("Image data is Empty please try again")
                }

                const buffer = Buffer.from(imageData, "base64")
                console.log("Image saved as gemini-native-image.png");

                return buffer; // Return the image buffer
            }
        }

    }

    const imageGenerationFn = async () => {
        if (!textareaString) {
            return
        }
        let textareaStringModified = textareaString.trim();

        textareaStringModified = `
        ${textareaString}  ${selectedArtist} ${textareaBackground} ${selectedAtmosphericEffects} ${selectedLightingEffects} ${selectedComposition} ${selectedColorPallete} ${width}/${height}
        `;
        console.log("textareaString:- ", textareaStringModified);

        try {
            setImageGenerate(true)
            const reponse = await Promise.all([geminaAiImage({ text: textareaStringModified })])
                .then((res) => {
                    console.log("Response:- ", res);
                    return res as Buffer<ArrayBuffer>[]
                }).catch((err) => {
                    console.log("Error in Promise All", err);
                    return []
                });

            console.log("imageAll:- ", reponse);


            // const reponse = await geminaAiImage({ text: textareaStringModified });

            console.log("reponse:- ", reponse);
            if (reponse.length === 0) {
                return
            }

            setAiGeneratedImageBuffer(reponse)

            const arrayResponse = reponse
                .map((v) => {
                    console.log("ArrayBufferData:- ", v);
                    if (!v) {
                        return
                    }
                    const imageBLob = new Blob([v], { type: "image/png" });
                    const imageUrl = URL.createObjectURL(imageBLob)
                    console.log("imageBLob:- ", imageBLob);
                    return imageUrl
                }).filter((v,_) => v !== undefined)


            setImageSrc(arrayResponse);

        } catch (error) {
            console.log("Error in the Image Generate", error);

        } finally {
            setImageGenerate(false)
        }

    }

    const setTextareaText = (e: ChangeEvent<HTMLTextAreaElement>) => {
        // console.log(e.currentTarget.clientHeight, e.currentTarget.scrollHeight);
        textareaRef.current!.style.height = 'auto'; // Reset height to auto to get the scrollHeight
        textareaRef.current!.style.height = `${e.currentTarget.scrollHeight}px`;
        // console.log(e.target.value);
        setTextareaString(e.target.value)

    }

    const [height, setHeight] = useState<number>(0);
    const [width, setWidth] = useState<number>(0);

    const setAspectRation = (e: React.MouseEvent<HTMLLIElement>) => {
        const aspect = e.currentTarget.textContent
        console.log(aspect);
        const { width, height } = aspectRatioImage.find((v) => v.orientation === aspect) as { width: number, height: number, orientation: string };
        console.log(width, height);
        setWidth(width);
        setHeight(height);
        console.log(String(height));

    }


    const referenceImageFn = async (e: ChangeEvent<HTMLInputElement>) => {
        console.log(e.target.files);
        const data = e.target.files;
        if (!data) {
            return
        }

        convertingImages(data)
    }

    const inputOverDragging = (e: React.DragEvent<HTMLInputElement>) => {
        e.preventDefault()
        // console.log(e);
    }

    const inputDrop = (e: React.DragEvent<HTMLInputElement>) => {
        e.preventDefault()
        // console.log(Array.from(e.dataTransfer.files));
        convertingImages(e.dataTransfer.files)
        console.log(e.dataTransfer.files);

    }

    const onInputCheckBox = (e: React.ChangeEvent<HTMLInputElement>) => {
        console.log(e.target.value, e.target.checked);
        console.log(uploadedImageData);
        setUploadedImageData((prev) => {
            const newValu = prev.map((v, _) => {
                if (v.previewUrl === e.target.value) {
                    v.isChecked = e.target.checked
                }
                return v
            });

            console.log("newValu:- ", newValu);
            return newValu
        })

    }

    const [uploadAiImage, setUploadAiImage] = useState<boolean>(false);
    const [uploadAiImageIndex, setUploadAiImageIndex] = useState<number | null>(null);

    const uploadOnCloud = async (index: number) => {
        try {

            if (!aiGeneratedImageBuffer) {
                return
            }
            setUploadAiImageIndex(index)
            const selectedImage = aiGeneratedImageBuffer.find((v, i) => i === index);

            if (!selectedImage) {
                return
            }

            const fileData = new File([selectedImage], "ai_image_generated", { type: "image/png" });

            // this is converting your data into the File Object
            const dataTranfer = new DataTransfer();
            dataTranfer.items.add(fileData);

            console.log("fileData:- ", dataTranfer.files);
            setUploadAiImage(true);

            await convertingImages(dataTranfer.files)
        } catch (error) {
            console.log("Error in file uploading to ai generated Image:- ", error);
        } finally {
            setUploadAiImage(false)
        }
    }

    const [refinedStart, setRefinedStart] = useState<boolean>(false);

    const refinePrompt = async () => {
        try {
            let content = createUserContent([textareaString]);
            console.log("uploadedImageData:- ", uploadedImageData);

            if (uploadedImageData.length > 0) {
                const fileDataUploaded = uploadedImageData
                    .filter((v): v is typeof v & { uri: string; mimeType: string } => !!v && !!v.uri && !!v.mimeType && !!v.isChecked)
                    .map((v, _) => createPartFromUri(v.uri, v.mimeType));

                console.log("fileDataUploaded:- ", { ...fileDataUploaded });

                content = createUserContent([
                    ...fileDataUploaded,
                    textareaString,
                ])
            }

            console.log("content:- ", content);
            setRefinedStart(true)

            const aiPromptRefine = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: content,
                config: {
                    systemInstruction: {
                        role: "system",
                        text: `
                        you have to give only best prompt from user text understanding with full thumnail like instruction which you thing will be best for output
                        
                        -putting words like this
                            [Main Subject], [Action/Context], [Detailed Description of Subject/Environment], [Artistic Style], [Mood/Atmosphere], [Lighting], [Composition], [Color Palette], [Quality Enhancers] --no [Negative Prompts]
                        `
                    }
                }
            });

            if (aiPromptRefine.candidates && aiPromptRefine.candidates.length > 0 && aiPromptRefine.candidates[0].content?.parts?.length && aiPromptRefine.candidates[0].content?.parts[0].text) {
                const aiGeneratedDataRefinedPrompt = aiPromptRefine?.candidates?.[0].content?.parts[0].text;
                console.log(aiGeneratedDataRefinedPrompt);
                setTextareaString(aiGeneratedDataRefinedPrompt)

            }
        } catch (error) {
            console.log("Error in refine Prompt", error);
        } finally {
            setRefinedStart(false)
        }

    }

    useEffect(() => {
        const dragEvent = (e: DragEvent) => {
            e.preventDefault();
            console.log("Draging started", e);

        };

        window.addEventListener("dragenter", dragEvent)

        return () => {
            window.removeEventListener("dragenter", dragEvent)
        }
    }, [])

    return (
        <div id="imageEditor" className='flex' style={{ height: 'calc(100vh - 60px)' }}>
            <div className='bg-amber-300/10 historyScrollbar text-white overflow-y-auto overflow-x-hidden p-2 max-w-[500px]'>

                <form onSubmit={(e) => {
                    e.preventDefault();
                    imageGenerationFn();
                }}>
                    <div className='flex items-center gap-4 mx-auto p-2 flex-wrap'>
                        <div className='flex justify-between w-full items-center'>
                            <label htmlFor="imageText" id='imageText' className='font-bold text-xl'>Prompt</label>
                            <span className='font-bold text-xl rounded-md'>
                                {refinedStart ?
                                    <Loader2 className='animate-spin text-white' size={22} />
                                    :
                                    <Bot onClick={refinePrompt} className='text-white' size={22} />
                                }
                            </span>
                        </div>
                        <Textarea name='imageText' placeholder='Enter Your text..' className='resize-none w-full min-h-[96px] text-white bg-black rounded-md textarea_overflow_styling max-h-[260px]' value={textareaString} onChange={setTextareaText} ref={textareaRef} />
                        <Button disabled={textareaString.trim()?.length > 0 ? false : true} loader={imageGenerate} type='submit' text='Submit' className='py-2 text-black bg-white font-black disabled:cursor-not-allowed' />
                    </div>
                </form>

                {/* reference images */}
                <div className='my-2 flex flex-col gap-4'>
                    <span>
                        <input name='reference-image' type='file' onChange={referenceImageFn} onDrop={inputDrop} onDragOver={inputOverDragging} />
                    </span>
                    <div className='flex flex-wrap items-center gap-2'>
                        {referenceImage.length > 0 &&
                            <>{referenceImage.map((v, i) => (
                                <div key={i} className='relative'>
                                    <input type="checkbox" className='absolute mt-1 top-0 right-2' value={v} onChange={onInputCheckBox} />
                                    <Image key={i} src={v} alt='refrence Image' width={1000} height={1000} className='w-[100px] object-cover h-[100px] rounded-md m-0' />
                                </div>
                            ))}</>

                        }
                    </div>
                </div>

                <div className='w-full mb-2'>
                    <CustomeSelect setAspectRation={setAspectRation} />
                    <div className='flex items-center gap-2 '>
                        <Input value={String(width)} className='bg-black h-[50px] text-white' name='width' placeholder='Enter Width' />
                        <Input value={String(height)} className='bg-black h-[50px] text-white' name='height' placeholder='Enter Height' />
                    </div>
                </div>

                {/* artist */}
                {/* <div className='w-full mb-2'>
                    <label className='font-bold text-xl block mb-2' htmlFor="artistList">Artist List</label>
                    <SelectSpecial CustomeArray={artistList} setAspectRation={(e) => setSelectedArtist(e.currentTarget.textContent ?? "")} selectedText={selectedArtist} />
                </div> */}

                {/* colorPalette */}
                {/* <div className='w-full mb-2'>
                    <label className='font-bold text-xl block mb-2' htmlFor="artistList">ColorPalette List</label>
                    <SelectSpecial CustomeArray={colorPalette} setAspectRation={(e) => setSelectedColorPallete(e.currentTarget.textContent ?? "")} selectedText={selectedColorPallete} />
                </div> */}

                {/* AtmosphericEffects */}
                {/* <div className='w-full mb-2'>
                    <label className='font-bold text-xl block mb-2' htmlFor="artistList">AtmosphericEffects List</label>
                    <SelectSpecial CustomeArray={AtmosphericEffects} setAspectRation={(e) => setSelectedAtmosphericEffects(e.currentTarget.textContent ?? "")} selectedText={selectedAtmosphericEffects} />
                </div> */}

                {/* LightingEffects */}
                {/* <div className='w-full mb-2'>
                    <label className='font-bold text-xl block mb-2' htmlFor="artistList">LightingEffects List</label>
                    <SelectSpecial CustomeArray={LightingEffects} setAspectRation={(e) => setSelectedLightingEffects(e.currentTarget.textContent ?? "")} selectedText={selectedLightingEffects} />
                </div> */}

                {/* Composition */}
                {/* <div className='w-full mb-2'>
                    <label className='font-bold text-xl block mb-2' htmlFor="artistList">Composition List</label>
                    <SelectSpecial CustomeArray={Composition} setAspectRation={(e) => setSelectedComposition(e.currentTarget.textContent ?? "")} selectedText={selectedComposition} />
                </div> */}

                <div>
                    <label htmlFor="imageText" id='imageText' className='font-bold text-xl'>Background description</label>
                    <Textarea name='background' placeholder='Enter your description about the background...' className='resize-none w-full min-h-[196px] text-white bg-black rounded-md textarea_overflow_styling max-h-[260px] mt-2' onChange={(e) => setTextareaBackground(e.target.value)} ref={textareaBackgroundRef} />
                </div>
            </div>

            <div className='flex-1 justify-center bg-amber-200/10 overflow-y-auto gap-2 flex flex-wrap p-2'>
                {imageSrc.length > 0 ?
                    <div className='m-auto flex gap-2 flex-wrap overflow-y-auto'>
                        {imageSrc.map((v, i) => (
                            <div key={i} className='flex flex-wrap relative'>
                                {uploadAiImage ?
                                    <>
                                        {uploadAiImageIndex === i &&
                                            <>
                                                <span className='absolute top-2 right-2 gap-2 text-white cursor-pointer flex'>
                                                    <Loader2 className='text-white animate-spin' size={22} /> Loading...
                                                </span>
                                            </>
                                        }
                                    </>
                                    :
                                    <>
                                        <span className='mb-2 gap-2 text-white cursor-pointer absolute top-2 right-2'>
                                            <UploadCloudIcon className='text-white' size={22} onClick={() => uploadOnCloud(i)} />
                                        </span>
                                    </>}

                                <Image src={v} width={1000} height={1000} alt='ai generated image' className='rounded-md object-scale-down w-[700px]  m-auto' />

                            </div>

                        ))}
                    </div>
                    :
                    Array.from({ length: 100 }).map((_, index) => index).map((item, index) => (
                        <div key={index} className='bg-gray-400/10 rounded-md h-[500px] w-[250px] justify-start' style={{ aspectRatio: "9/16" }}>{item}</div>
                    ))
                }
            </div>
        </div>
    )
}

export default Page