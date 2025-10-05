import dotenv from "dotenv";
import express from "express";
import { crawlWebsites } from "./crawling.js";
import { getGoogleSearchResults } from "./decodo.js";
import { Logger } from "./logger.js";

dotenv.config();

const logger = new Logger("Server");

const app = express();
const PORT = process.env.PORT;

const blacklist = [
    "onrc.ro", "gov.ro", "anaf.ro", "facebook.com", "instagram.com", "linkedin.com",
    "douglas.ro", "marionnaud.ro", "yves-rocher.ro", "sabon.ro", "sephora.ro",
    "pupamilano.ro", "maccosmetics.ro", "xpertbeauty.ro", "notino.ro", "makeup.ro",
    "elefant.ro", "emag.ro", "aboutyou.ro", "avon.ro", "farmec.ro", "gerovital.ro"
];

function isBlacklisted(url) {
    return blacklist.some(domain => url.toLowerCase().includes(domain));
}

app.get("/", (req, res) => {
    res.send("Hello World");
});

app.get("/health", (req, res) => res.status(200).send("OK\n"));

app.get("/search", async (req, res) => {
    const q = req.query.q;

    if (!q) {
        return res.status(400).json({
            error: "Missing required query parameter: q",
            usage: "/search?q=your+keywords",
        });
    }

    try {
        const results = await getGoogleSearchResults(q);

        const organic = results?.results?.[0]?.content?.results?.results?.organic || [];

        const urls = organic.map((item) => item.url);

		const filteredUrls = urls.filter((url) => {
            if (isBlacklisted(url)) {
                logger.info(`Skipping blacklisted: ${url}`);
                return false;
            }
            return true;
        });

        if (filteredUrls.length === 0) {
            return res.status(204).json({
                success: true,
                query: q,
                results: [],
            });
        }

        const extractedData = await crawlWebsites(filteredUrls);

        return res.json({
            success: true,
            query: q,
            results: extractedData,
        });
    } catch (err) {
        logger.error("Error in /search:", err.message);
        return res.status(500).json({
            error: "Failed in scraping pipeline",
            details: err.message,
        });
    }
});

// start server and listen on all interfaces (0.0.0.0)
app.listen(PORT, "0.0.0.0", () => {
    logger.info(`Server listening at http://0.0.0.0:${PORT}\n`);
});
