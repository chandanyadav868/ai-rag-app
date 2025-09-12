import mongodbConnection from "@/mongodb/connection"
import UserSchema from "@/mongodb/schema/User.Schema"
import fs from "fs/promises"
import path from "path"

export interface ObjectProps {
    name: string
    displayName: string
    mimeType: string
    sizeBytes: string
    createTime: string
    expirationTime: string
    updateTime: string
    sha256Hash: string
    uri: string
    state: string
    source: string
}

const folderPath = path.join(process.cwd(), "public", "uploaded_pdf.json")


export async function fileReading() {
    let datas: ObjectProps[] = [];

    const data = await fs.readFile(folderPath, { encoding: "utf-8" });

    datas = JSON.parse(data)

    return datas
}


export async function fileUpdate(fileRemove: string, insertingData: ObjectProps) {

    let fileReadingData = await fileReading();

    console.log("fileReadingData:- ", fileReadingData);

    fileReadingData = [...fileReadingData, insertingData]

    fs.writeFile(folderPath, JSON.stringify(fileReadingData, null, 2))

    console.log("Successfully wrote file");

}


export async function getUserFromDb(credentials:Partial<Record<"password" | "email", unknown>>) {
    const userData = await mongodbConnection();
    const responseData = await UserSchema.findOne({ email: credentials.email }).lean() as UserSchemaProp | null;

    return responseData
}