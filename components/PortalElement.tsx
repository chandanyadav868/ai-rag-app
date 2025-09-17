import React from 'react'
import { createPortal } from 'react-dom'
import { useContextStore } from './CreateContext'


function PortalElement() {
    const { getBoundingBox, portalElement } = useContextStore()
    // console.log(portalElement);
    

    return (
        <>
            {portalElement && createPortal(
                <h1 style={{ top: `${portalElement.top}px`, left: `${portalElement.right}px`, transform: `${portalElement.translate}`, zIndex:99}} className={`p-2 rounded-md bg-black text-white fixed`}>{portalElement.text}</h1>,
                document.body)}
        </>
    )
}

export default PortalElement