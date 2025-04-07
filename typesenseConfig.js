import Typesense from "typesense";
import fs from "fs";
import { checkValidity } from "./utils.js";
import dotenv from "dotenv";
dotenv.config();

const client = new Typesense.Client({
    nodes: [
        {
            host: "localhost",
            port: 8108,
            protocol: "http",
        },
    ],
    apiKey: process.env.TYPESENSE_KEY,
    connectionTimeoutSeconds: 2,
});

client
    .collections()
    .retrieve()
    .then((collections) => console.log("Connected, collections:", collections))
    .catch((error) => console.error("Error connecting to Typesense:", error));

async function resetCollection(client) {
    try {
        await client.collections("mcq_collection").delete();
        console.log("Collection deleted successfully.");
    } catch (error) {
        console.log(
            "No existing collection to delete or error deleting:",
            error.message
        );
    }
    await createCollection(client);
}

resetCollection(client);

async function createCollection(client) {
    const schema = {
        name: "mcq_collection",
        fields: [
            { name: "id", type: "string", facet: true },
            { name: "question", type: "string" },
            {
                name: "embedding",
                type: "float[]",
                embed: {
                    from: ["question"],
                    model_config: {
                        model_name: "ts/all-MiniLM-L12-v2",
                    },
                },
            },
            { name: "A", type: "string" },
            { name: "B", type: "string" },
            { name: "C", type: "string" },
            { name: "D", type: "string" },
            { name: "answer", type: "string" },
            // { name: "type", type: "string", facet: true },
            { name: "solution", type: "string" },
        ],
        // default_sorting_field: "question",
    };

    try {
        await client.collections().create(schema);
        console.log("Collection created successfully.");
    } catch (error) {
        if (error.message.includes("already exists")) {
            console.log("Collection already exists.");
        } else {
            console.error("Error creating collection:", error);
        }
    }
}

createCollection(client);

async function importDocuments(client) {
    const data = JSON.parse(fs.readFileSync("questions.json", "utf8")).map(
        (doc, i) => {
            doc.id = i.toString();
            // if (doc.type === null) {
            //     doc.type = "";
            // }

            // Sanitize HTML tags from relevant fields
            doc.question = checkValidity(doc.question);
            doc.solution = checkValidity(doc.solution);
            doc.A = checkValidity(doc.A);
            doc.B = checkValidity(doc.B);
            doc.C = checkValidity(doc.C);
            doc.D = checkValidity(doc.D);

            return doc;
        }
    );
    console.log(data);
    for (const doc of data) {
        try {
            await client.collections("mcq_collection").documents().create(doc);
            console.log(
                `Document indexed: ${doc.question.substring(0, 30)}...`
            );
        } catch (error) {
            console.error("Error indexing document:", error);
        }
    }
}

importDocuments(client);

export { client };
