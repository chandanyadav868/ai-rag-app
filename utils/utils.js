import fs from "fs/promises"
import path from "path"

const folderPath = path.join(process.cwd(), "aiapp", "public", "uploaded_pdf.json")


export async function fileReading() {
    let datas = [];

    const data = await fs.readFile(folderPath, { encoding: "utf-8" });

    datas = JSON.parse(data);

    console.log(datas);


    return datas
}



// fileReading()




const array = [
    {
        title: "Chat 1",
        chat1History: [
            {
                user: {
                    message: "Hello",
                    loading: false
                },
                computer: {
                    message: "Hi, How can I help you?",
                    loading: false
                }
            }
        ],
        summarychat1: "this is the history of chat 1"
    },
    {
        title: "Chat 2",
        chat1History: [
            {
                user: {
                    message: "Hello",
                    loading: false
                },
                computer: {
                    message: "Hi, How can I help you?",
                    loading: false
                }
            }
        ],
        summarychat1: "this is the history of chat 1"
    }
]


export function onlyTitle(array) {
    const titleArray = array.reduce((acc, curValue, currentIndex) => {
        acc.push(curValue.title)
        return acc
    }, []);

    return titleArray
}


// console.log(onlyTitle());

