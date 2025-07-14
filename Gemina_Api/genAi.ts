"use server"

import { GoogleGenAI, createPartFromUri, createUserContent, Modality, ContentListUnion } from "@google/genai"
import * as fs from "node:fs"

type GeminaAiFunProps = {
  text: string
}

console.log("Gen ai:- ", process.env.GOOGLE_GEMINA_API);

// set up googlegenai with api for backend talk
const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GEMINA_API });


async function geminaAiText({ text }: GeminaAiFunProps) {

  const files = await ai.files.upload({
    file: "./app/public/images/image.png"
  });

  console.log("files:- ", files);

  // https://generativelanguage.googleapis.com/v1beta/files/i14fdtplsnwl

  const aiResponse = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      createUserContent([
        "Tell me about this instrument",
        createPartFromUri(files.uri ?? "", files.mimeType ?? "")
      ])
    ],
    config: {
      systemInstruction: "you are the expert in english speeking and tense strucutre"
    }
  });

  console.log(aiResponse.text)

}


async function geminaAiImage({ text }: GeminaAiFunProps) {
  const imageGeneration = await ai.models.generateContent({
    model: "gemini-2.0-flash-preview-image-generation",
    contents: ` ${text}`,
    config: {
      responseModalities: [Modality.TEXT, Modality.IMAGE],
    }
  });

  if (!imageGeneration?.candidates?.[0].content?.parts) {
    console.log("Response Data undefined");

    return
  }

  for (const part of imageGeneration?.candidates[0]?.content?.parts) {
    if (part.text) {
      console.log(part.text);

    } else if (part.inlineData) {
      const imageData = part.inlineData.data;

      if (!imageData) {
        throw new Error("Image data is Empty please try again")
      }

      const buffer = Buffer.from(imageData, "base64")
      fs.writeFileSync("gemini-native-image.png", buffer);
      console.log("Image saved as gemini-native-image.png");
    }
  }

}

function readingFile(imagePathL: string) {
  const imagePath = imagePathL;
  const imageData = fs.readFileSync(imagePath);
  const base64Image = imageData.toString("base64");
  return base64Image
}

async function ImageGenerateWithAi({ text }: GeminaAiFunProps) {

  // Load the image from the local file system
  const base64Image = readingFile("app/public/images/image1.png");
  // const base64Image1  = readingFile("app/public/images/image.png");
  // console.log("base64Image:- ",imageData);


  // Prepare the content parts
  const contents = [
    { text: 'remove the car' },
    {
      inlineData: {
        mimeType: "image/png",
        data: base64Image,
      },
    },
    // {
    //   inlineData: {
    //     mimeType: "image/png",
    //     data: base64Image1,
    //   },
    // },
  ];


  const image = await ai.models.generateContent({
    model: 'gemini-2.0-flash-preview-image-generation',
    contents: contents,
    config: {
      responseModalities: [Modality.TEXT, Modality.IMAGE],
    },
  });

  if (!image?.candidates?.[0]?.content?.parts) {
    return
  }

  for (const part of image?.candidates?.[0].content.parts) {
    // Based on the part type, either show the text or save the image
    if (part.text) {
      console.log(part.text);
    } else if (part.inlineData) {
      const imageData = part.inlineData.data;
      if (!imageData) {
        return
      }
      const buffer = Buffer.from(imageData, "base64");
      fs.writeFileSync("gemini-native-image.png", buffer);
      console.log("Image saved as gemini-native-image.png");
    }
  }

}


async function PdfUpload(path: string,fileName?:string) {
  const file = await ai.files.upload({
    file: path,
    config: {
      displayName: fileName??"text_book",
    },
  });


  let getFile = await ai.files.get({ name: file.name ?? "" });

  while (getFile.state === "PROCESSING") {
    getFile = await ai.files.get({ name: file.name ?? "" });
    console.log(`current file status: ${getFile.state}`);
    console.log('File is still processing, retrying in 5 seconds');

    await new Promise((resolve) => {
      setTimeout(resolve, 5000);
    });
  }

  if (file.state === 'FAILED') {
    throw new Error('File processing failed.');
  }

  return file
}

async function PdfAnswerWithAi({ text }: GeminaAiFunProps) {

  const userPreviousUploaded = {
    name: 'files/0kjywbkwjzwj',
    displayName: 'MCO05_Block_1.pdf',
    mimeType: 'application/pdf',
    sizeBytes: '1273242',
    createTime: '2025-07-13T08:03:53.489844Z',
    expirationTime: '2025-07-15T08:03:53.404517667Z',
    updateTime: '2025-07-13T08:03:53.489844Z',
    sha256Hash: 'MGY4ZDY2MmVlMjQ3ZDZkZTNkOTRhMjFlMzliOWUzNDQ0ZTQ5NmZmYzQ2NjY3ZTFjMzNmNzQ2MzQ4ZjY2MTUyNg==',
    uri: 'https://generativelanguage.googleapis.com/v1beta/files/0kjywbkwjzwj',
    state: 'ACTIVE',
    source: 'UPLOADED'
  }

  const fileObje = userPreviousUploaded ?? await PdfUpload('public/pdf/Block-1.pdf');
  console.log("fileObje:- ", fileObje);

  /*
    {
      name: 'files/hcmezfoun1te',
      displayName: 'MCO05_Block_1.pdf',
      mimeType: 'application/pdf',
      sizeBytes: '1273242',
      createTime: '2025-07-06T11:43:42.952976Z',
      expirationTime: '2025-07-08T11:43:42.822601820Z',
      updateTime: '2025-07-06T11:43:42.952976Z',
      sha256Hash:     'MGY4ZDY2MmVlMjQ3ZDZkZTNkOTRhMjFlMzliOWUzNDQ0ZTQ5NmZmYzQ2NjY3ZT Fj MzNmNzQ2MzQ4ZjY2MTUyNg==',
      uri: 'https://generativelanguage.googleapis.com/v1beta/files/hcmezfoun1te',
      state: 'ACTIVE',
      source: 'UPLOADED'
    }
*/

  // Add the file to the contents.
  const content: ContentListUnion = [
    text,
  ];

  if (fileObje.uri && fileObje.mimeType) {
    const fileContent = createPartFromUri(fileObje.uri, fileObje.mimeType);
    console.log("fileContent:- ", fileContent);

    /*  
    {
      fileData: {
        fileUri: 'https://generativelanguage.googleapis.cov1beta/files/   hcmezfoun1te',
        mimeType: 'application/pdf'
      }
    } 
    */
    content.push(fileContent);
  }

  const result = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: content
  });

  console.log(result.text);

}

export { geminaAiText, geminaAiImage, ImageGenerateWithAi, PdfAnswerWithAi,PdfUpload }


