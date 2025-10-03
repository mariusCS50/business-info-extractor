import { Logger } from "./logger.js";

const logger = new Logger("Extractors");

export async function getEmails(page) {
    const emails = new Set();

    // extract emails from current page
    async function extractEmails() {
        const html = await page.content();

        // regex search in the raw HTML
        const matches =
            html.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
        matches.forEach((e) => emails.add(e.toLowerCase()));

        // look for mailto: links
        const mailtos = await page.$$eval("a[href^='mailto:']", (links) =>
            links
                .map((a) => a.getAttribute("href"))
                .filter(Boolean)
                .map((href) => href.replace(/^mailto:/i, ""))
        );
        mailtos.forEach((e) => emails.add(e.toLowerCase()));
    }

    await extractEmails();

    // try to find a "contact" or "despre noi" link
    const links = await page.$$eval("a", (anchors) =>
        anchors.map((a) => ({
            href: a.href,
            text: a.innerText.trim().toLowerCase(),
        }))
    );

    const contactLinks = links.filter((l) =>
        /(contact|despre\s*noi)/i.test(l.text)
    );

    for (const link of contactLinks) {
        try {
            await page.goto(link.href, { waitUntil: "domcontentloaded", timeout: 30000 });
            await extractEmails();
        } catch (err) {
            logger.warn(`Could not load contact page: ${link.href}`);
        }
    }

    const cleaned = Array.from(emails).filter(
        (email) => !/\.(png|jpe?g|gif|webp|svg)$/i.test(email)
    );

    return cleaned;
}

export async function getPhones(page) {
    // TODO: extract phone numbers (+40, 07, 03 patterns)
    return [];
}

export async function getCompanyName(page) {
    // TODO: detect SRL, SC patterns, maybe from title or footer
    return [];
}

export async function getCUI(page) {
    // TODO: detect RO + 6-10 digits
    return [];
}
