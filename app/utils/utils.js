import fs from "fs/promises"
import path from "path"

const folderPath  = path.join(process.cwd(),"aiapp","public","uploaded_pdf.json")

export async function fileReading() {
    let datas = [];    

    const data = await fs.readFile(folderPath, { encoding: "utf-8" });

    datas = JSON.parse(data);

    console.log(datas);
    

    return datas
}



fileReading()