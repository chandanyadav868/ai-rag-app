
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

// const folderPath = path.join(process.cwd(), "public", "uploaded_pdf.json")


// export async function fileReading() {
//     let datas: ObjectProps[] = [];

//     const data = await fs.readFile(folderPath, { encoding: "utf-8" });

//     datas = JSON.parse(data)

//     return datas
// }


// export async function fileUpdate(fileRemove: string, insertingData: ObjectProps) {

//     let fileReadingData = await fileReading();

//     console.log("fileReadingData:- ", fileReadingData);

//     fileReadingData = [...fileReadingData, insertingData]

//     fs.writeFile(folderPath, JSON.stringify(fileReadingData, null, 2))

//     console.log("Successfully wrote file");

// }


export async function getUserFromDb(credentials:Partial<Record<"password" | "email", unknown>>) {
    try {
        console.log(`${process.env.NEXTAUTH_URL}/api/mongoose`);
        
        console.log("api in api mongoose:---   ------");
        
        const response = await fetch(`${process.env.NEXTAUTH_URL}/api/mongoose`, {
          method: "POST",
          body: JSON.stringify(credentials),
          headers: {
            "Content-Type": "application/json"
          }
        });
        console.log("Original Data:---", response);
        
        const responseJson = await response.json();
        console.log("responseJson:- ",responseJson);
        

        if (response.status === 200) {
            return responseJson
        }

        return responseJson
    } catch (error) {
        console.log("Error in data",error);
        return null
    }
}