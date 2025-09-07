import React, { useEffect, useCallback, useState } from 'react';
import {
    ImageKitAbortError,
    ImageKitInvalidRequestError,
    ImageKitServerError,
    ImageKitUploadNetworkError,
    upload,
} from "@imagekit/next";

interface ResponseProps {
    expire: number,
    publicKey: string,
    signature: string,
    token: string
}

function ImageKitUploader() {
    const [onProgress, setOnProgress] = useState<number>(0);
    const [file, setFile] = useState<File | null | undefined>();

    console.log("onProgress:- ",onProgress);
    
    const response = useCallback(async () => {
        const response = await fetch("/api/image-kit/upload-auth", {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            }
        });

        if (response.ok) {
            const jsonConvert = await response.json();
            console.log("jsonConvert:- ", jsonConvert);
            return jsonConvert as ResponseProps
        }
    }, []);

    const abortSignal = new AbortController()

    useEffect(() => {
        const generateSignature = async () => {
            if (!file) return;
            const fileName = file.name;
            const data = await response();
            if (!data) return;
            const { expire, publicKey, signature, token } = data;

            const imageKitUpload = await upload({
                expire,
                file,
                fileName,
                publicKey,
                signature,
                token,
                folder:"/users/images/",
                abortSignal: abortSignal.signal,
                onProgress: (event) => {
                    setOnProgress((event.loaded / event.total) * 100);
                }
            });

            console.log("imageKitUpload:- ",imageKitUpload);
            
        }
        generateSignature();
    }, [file]);

    return (
        <div>
            <label htmlFor=""></label>
            <input type='file' onChange={(e) => setFile(e.target.files?.[0])} />
        </div>
    )
}

export default ImageKitUploader