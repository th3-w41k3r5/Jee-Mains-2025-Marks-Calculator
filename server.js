const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");

const app = express();
const PORT = 3000;

app.use(cors());

app.get("/fetch-html", async (req, res) => {
    const url = req.query.url;
    if (!url) {
        return res.status(400).send("URL is required");
    }
    try {
        const response = await fetch(url);
        const html = await response.text();
        res.send(html);
    } catch (error) {
        res.status(500).send("Error fetching HTML: " + error.message);
    }
});

app.listen(PORT, () => {
    console.log(`Proxy server running on http://localhost:${PORT}`);
});
