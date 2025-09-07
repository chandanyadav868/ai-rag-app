// import { ChromaClient } from "chromadb"

// const client = new ChromaClient({
//     port:8000
// });

// const collection = await client.createCollection({
//     name: "my_collection_one"
// });



// await collection.add(
//     {
//         ids: ["id1", "id2"],
//         documents: [
//             "This is a document about pineapple",
//             "This is a document about oranges",
//         ]
//     }
// )

// export {collection}

// this below methods will add the Object predefined methods in valueMap Object in browser, but not add in node.js environment 
let valueMap = Object.create({
    name:"Chandan",
    lastName:"Yadav"
})

// valueMap = Object.getPrototypeOf(new Object())
console.log(valueMap.__proto__);
valueMap.hasOwnProperty 

// valueMap = 
let key = "namei"
// hum hasOwnProperty methods ko call methods ki sahayta se run kar rhai hai , call valueMap ko as a this jo ki object hai leta hai, and key ko hasOwnProperty ke parameter ke rup mai pass karta hai, under the hood hasOwnProperty run on the valueMap object par aur check karta hai ki valueMap ke pass ye property exist karti hai ya nhi
console.log(Object.prototype.hasOwnProperty.call(valueMap, key))
console.log(valueMap.prototype.hasOwnProperty("name"))