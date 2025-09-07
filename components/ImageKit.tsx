import React from 'react'
import { Image } from "@imagekit/next"

interface ImageKitProp {
    url:string
}

function ImageKit({url}:ImageKitProp) {
    return (
        <Image
            urlEndpoint="https://ik.imagekit.io/o66qwandt"
            src={url}
            width={500}
            height={500}
            alt="Picture of the author"
        />
    )
}

export default ImageKit