import { ChromaClient } from "chromadb"

const client = new ChromaClient({
    port:8000
});

const collection = await client.createCollection({
    name: "my_collection_one"
});



await collection.add(
    {
        ids: ["id1", "id2"],
        documents: [
            "This is a document about pineapple",
            "This is a document about oranges",
        ]
    }
)

export {collection}