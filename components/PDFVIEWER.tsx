import React, { useEffect, useState } from 'react'
import { degrees, PDFDocument, rgb, StandardFonts, grayscale, BlendMode, } from 'pdf-lib'
import { ObjectProps } from '../utils/util';

interface PDFViewerProps {
    fileData:ObjectProps
}


function PDFViewer({fileData}:PDFViewerProps) {
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    
    const createNewPdf = async () => {
        // 1️⃣  Fetch raw bytes

        const res = await fetch(`/api/file?file=${fileData.displayName}`,);
        const source = await PDFDocument.load(await res.arrayBuffer());

        // 2️⃣  Create a new doc and copy pages
        const target = await PDFDocument.create();

        const copied = await target.copyPages(source, source.getPageIndices());

        console.log(copied);

        

        copied.forEach(page => {
            const { height, width } = page.getSize();
            const blankPage = target.addPage([width, height]);
            blankPage.drawRectangle({
                x: 0,
                y: 0,
                width: width,
                height: height,
                // rotate: degrees(-15),
                borderWidth: 5,
                borderColor: grayscale(0.5),
                color: rgb(0, 0, 0),
                opacity: 0.1,
                borderOpacity: 0.75,
            })


            const blackPage1 = target.addPage(page);
            // blackPage1.drawRectangle({
            //     x: 0,
            //     y: 0,
            //     width: width,
            //     height: height,
            //     // rotate: degrees(-15),
            //     borderWidth: 5,
            //     borderColor: grayscale(0.5),
            //     color: rgb(0, 0, 0),
            //     opacity: 0.4,
            //     blendMode: BlendMode.Multiply,
            //     borderOpacity: 0.75,
            // })
        });

        console.log(copied);


        // (Optional) add your own page or watermark here
        const extra = target.addPage([550, 750]);
        extra.drawText("Generated with pdf+lib", { x: 30, y: 700 });


        // 3️⃣  Serialize & display
        const bytes = await target.save();
        const blob = new Blob([bytes], { type: "application/pdf" });
        setPdfUrl(URL.createObjectURL(blob));

    }

    useEffect(() => {

        createNewPdf()

    }, [fileData]);

    return (
        <>
            <div style={{ height: "90%", width: "100%" }}>
                {pdfUrl && (
                    <iframe
                        className='mt-4 flex-1'
                        src={pdfUrl}
                        width="100%"
                        height="90%"
                        title="PDF Preview"
                        style={{ border: "none" }}
                    />
                )}
            </div>
        </>
    )
}

export default PDFViewer