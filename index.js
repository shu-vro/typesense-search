import express from "express";
import bodyParser from "body-parser";
import Typesense from "typesense";
import { checkValidity } from "./utils.js";
import morgan from "morgan";

const app = express();
app.use(bodyParser.json());
app.use(morgan("common"));

const client = new Typesense.Client({
    nodes: [
        {
            host: "localhost",
            port: 8108,
            protocol: "http",
        },
    ],
    apiKey: "xyz",
    connectionTimeoutSeconds: 2,
});

app.get("/health", async (req, res) => {
    const th = await client.health.retrieve();
    console.log(th);
    res.json({
        server: "ok",
        typesense: th.ok ? "ok" : "error",
        collections: (await client.collections().retrieve()).map((e) => e.name),
    });
});

app.get("/search", async (req, res) => {
    const { q, symantic } = req.query;

    const searchParameters = {
        q: q || "*",
        query_by: symantic === "true" ? "question,embedding" : "question",
        per_page: 10,
        num_typos: 2,
    };

    // if (tag) {
    //     searchParameters.filter_by = `tags:=[${tag}]`;
    // }

    try {
        const searchResult = await client
            .collections("mcq_collection")
            .documents()
            .search(searchParameters);
        res.json(searchResult.hits);
    } catch (error) {
        console.error("Search error:", error);
        res.status(500).send(error);
    }
});

app.post("/add", async (req, res) => {
    try {
        const doc = req.body;

        doc.id = Date.now().toString();

        doc.question = checkValidity(doc.question);
        doc.A = checkValidity(doc.A);
        doc.B = checkValidity(doc.B);
        doc.C = checkValidity(doc.C);
        doc.D = checkValidity(doc.D);

        doc.solution = checkValidity(doc.solution);
        doc.type = checkValidity(doc.type);

        const result = await client
            .collections("mcq_collection")
            .documents()
            .create(doc);
        res.status(201).json({
            statusCode: 201,
            message: "Document inserted successfully",
            result,
        });
    } catch (error) {
        console.error("Error inserting document:", error);
        res.status(500).send(error);
    }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));
