import type { NextRequest } from "next/server";
import fs from "fs"
import { buffer } from "stream/consumers";
import { PdfUpload } from "@/Gemina_Api/genAi";
import { fileUpdate, ObjectProps } from "@/app/utils/util";

export async function POST(req: NextRequest) {
    try {
        // const body = req.body;
        const formData = await req.formData()
        
        // 2️⃣  Grab the field that holds the file.
        const fileField = formData.get("file_pdf");
        
        // 3️⃣  Validate.
        if (!fileField || !(fileField instanceof File)) {
            return Response.json({ message: "No file found" }, { status: 400 });
        }
        

        // 4️⃣  Read the file into an ArrayBuffer, then into a Node Buffer.
        const arrayBuffer = await fileField.arrayBuffer(); // browser‑style API
        const buffer = Buffer.from(arrayBuffer);

        const date = new Date();        
        const fileLocation = `public/pdf/${date.getMilliseconds()+"_"+fileField.name}`

        fs.writeFileSync(fileLocation, Buffer.from(buffer))

        const cloudLinks = await PdfUpload(fileLocation,fileField.name) as ObjectProps;

        console.log("cloudLinks:- ",cloudLinks);

        fileUpdate(fileLocation,cloudLinks)

        return Response.json({ status: 200, message: "Successfully uploaded" })
    } catch (error) {
        console.log("Error in file uploadig:- ", error);

        return Response.json({ status: 500, message: error })
    }
}