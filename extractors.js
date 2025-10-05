import { Logger } from "./logger.js";

const logger = new Logger("Extractors");

export async function getEmails(page, url) {
    const emails = new Set();

    async function extractEmails() {
        // just grab visible text
        const text = await page.evaluate(() => document.body.innerText);

        // regex for emails
        const matches =
            text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];

        matches.forEach((raw) => {
            let normalized = raw.trim().toLowerCase();

            // strip trailing punctuation
            normalized = normalized.replace(/[.,;:]+$/, "");

            // skip images and data URIs
            if (
                !/\.(png|jpe?g|gif|webp|svg)$/i.test(normalized) &&
                !/^data:/.test(normalized)
            ) {
                emails.add(normalized);
            }
        });

        // also get mailto: links
        const mailtos = await page.$$eval("a[href^='mailto:']", (links) =>
            links
                .map((a) => a.getAttribute("href"))
                .filter(Boolean)
                .map((href) => href.replace(/^mailto:/i, ""))
        );

        mailtos.forEach((e) => emails.add(e.toLowerCase().trim()));
    }

    await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });
    await extractEmails();

    // follow contact/despre noi
    const links = await page.$$eval("a", (anchors) =>
        anchors.map((a) => ({
            href: a.href,
            text: (a.innerText || "").trim().toLowerCase(),
        }))
    );

    const contactLinks = links.filter((l) =>
        /(contact|despre)/i.test(l.text)
    );

    for (const link of contactLinks) {
        try {
            await page.goto(link.href, { waitUntil: "networkidle2", timeout: 30000 });
            await extractEmails();
        } catch (err) {
            logger.warn(`Could not load contact page: ${link.href}`);
        }
    }

    return Array.from(emails);
}

export async function getPhones(page, url) {
    const phones = new Set();

    async function extractPhones() {
        const text = await page.evaluate(() => document.body.innerText);

        // find phone-like patterns (Romanian)
        const matches = text.match(/(\+40|0)[\s.\-]?[237](?:[\s.\-]?\d){8}/g) || [];

        matches.forEach((raw) => {
            // Skip if IBAN nearby in the text
            if (/IBAN/i.test(text) && text.includes(raw)) {
                return;
            }

            let normalized = raw.replace(/[^\d+]/g, "");

            // Normalize to +40 format
            if (normalized.startsWith("0") && normalized.length === 10) {
                normalized = "+4" + normalized;
            }

            if (normalized.startsWith("+40") && normalized.length === 12) {
                phones.add(normalized);
            }
        });
    }

    await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });
    await extractPhones();

    // follow "contact" / "despre noi" links
    const links = await page.$$eval("a", (anchors) =>
        anchors.map((a) => ({
            href: a.href,
            text: (a.innerText || "").trim().toLowerCase(),
        }))
    );

    const contactLinks = links.filter((l) =>
        /(contact|despre)/i.test(l.text)
    );

    for (const link of contactLinks) {
        try {
            await page.goto(link.href, { waitUntil: "networkidle2", timeout: 30000 });
            await extractPhones();
        } catch (err) {
            logger.warn(`Could not load contact page: ${link.href}`);
        }
    }

    return Array.from(phones);
}

export async function getCompanyName(page, url) {
    const companies = new Set();

    async function extractCompany() {
        const text = await page.evaluate(() => document.body.innerText);

        // Catch company names ending with SRL or SA
        const matches = text.match(
            /\b(?:[A-ZĂÂÎȘȚ][A-Za-zĂÂÎȘȚăâîșț0-9&.,\-]{1,40}\s+){0,5}(?:SRL|SA)\b/g
        ) || [];

        matches.forEach((raw) => {
            let normalized = raw.trim();

            // Collapse multiple spaces
            normalized = normalized.replace(/\s{2,}/g, " ");

            companies.add(normalized);
        });
    }

    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
    await extractCompany();

    // follow "contact", "despre noi", "termeni si conditii"
    const links = await page.$$eval("a", (anchors) =>
        anchors.map((a) => ({
            href: a.href,
            text: (a.innerText || "").trim().toLowerCase(),
        }))
    );

    const companyLinks = links.filter((l) =>
        /(contact|despre|termeni|condi[tț]ii)/i.test(l.text)
    );

    for (const link of companyLinks) {
        try {
            await page.goto(link.href, { waitUntil: "domcontentloaded", timeout: 30000 });
            await extractCompany();
        } catch (err) {
            logger.warn(`Could not load company page: ${link.href}`);
        }
    }

    return Array.from(companies);
}

export async function getCUI(page, url) {
    const cuis = new Set();

    async function extractCUI() {
        const text = await page.evaluate(() => document.body.innerText);

        // Match "RO" followed by 6–10 digits with optional separators/spaces
        const matches =
			text.match(
				/\b(?:RO\s*[-–—.:/\\]?\s*\d{6,10}|(?:cod\s+unic\s+de\s+[iî]nregistrare|c[\s.\-]*u[\s.\-]*i)\s*[:\-]?\s*\d{6,10})\b/gi
			) || [];


        matches.forEach((raw) => {
            // Keep only digits after RO and normalize to "RO########"
            const digits = raw.replace(/[^0-9]/g, "");
            cuis.add(`RO${digits}`);
        });
    }

    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
    await extractCUI();

    // Follow pages likely to contain company identifiers
    const links = await page.$$eval("a", (anchors) =>
        anchors.map((a) => ({
            href: a.href,
            text: (a.innerText || "").trim().toLowerCase(),
        }))
    );

    const detailLinks = links.filter((l) =>
        /(contact|despre|termeni|condi[tț]ii)/i.test(l.text)
    );

    for (const link of detailLinks) {
        try {
            await page.goto(link.href, { waitUntil: "domcontentloaded", timeout: 30000 });
            await extractCUI();
        } catch (err) {
            logger.warn(`Could not load CUI page: ${link.href}`);
        }
    }

    return Array.from(cuis);
}