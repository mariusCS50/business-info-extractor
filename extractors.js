import { Logger } from "./logger.js";

const logger = new Logger("Extractors");

export async function crawlPages(page, url) {
	const emails = new Set();
	const phones = new Set();
	const companies = new Set();
	const cuis = new Set();

	await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });
	const text = await page.evaluate(() => document.body.innerText);

	await getEmails(emails, text);
	await getPhones(phones, text);
	await getCompanyName(companies, text);
	await getCUI(cuis, text);

	const links = await page.$$eval("a", (anchors) =>
		anchors.map((a) => ({
			href: a.href,
			text: (a.innerText || "").trim().toLowerCase(),
		}))
	);

	const contactLinks = links.filter((l) => /(contact|despre)/i.test(l.text));

	for (const link of contactLinks) {
		try {
			await page.goto(link.href, { waitUntil: "networkidle2", timeout: 30000 });
			const text = await page.evaluate(() => document.body.innerText);

			await getEmails(emails, text);
			await getPhones(phones, text);
			await getCompanyName(companies, text);
			await getCUI(cuis, text);
		} catch (err) {
			logger.warn(`Could not load contact/despre page: ${link.href}`);
		}
	}

	const legalLinks = links.filter((l) => /(termeni|condi[tț]ii)/i.test(l.text));

	for (const link of legalLinks) {
		try {
			await page.goto(link.href, { waitUntil: "networkidle2", timeout: 30000 });
			const text = await page.evaluate(() => document.body.innerText);

			await getCompanyName(companies, text);
			await getCUI(cuis, text);
		} catch (err) {
			logger.warn(`Could not load legal page: ${link.href}`);
		}
	}

	return {
		url,
		emails: Array.from(emails),
		phones: Array.from(phones),
		companies: Array.from(companies),
		cuis: Array.from(cuis),
	};
}

async function getEmails(emails, text) {
	const matches =
		text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];

	matches.forEach((raw) => {
		let normalized = raw.trim().toLowerCase();
		normalized = normalized.replace(/[.,;:]+$/, "");

		if (
			!/\.(png|jpe?g|gif|webp|svg)$/i.test(normalized) &&
			!/^data:/.test(normalized)
		) {
			emails.add(normalized);
		}
	});
}

async function getPhones(phones, text) {
	const matches = text.match(/(\+40|0)[\s.\-]?[237](?:[\s.\-]?\d){8}/g) || [];

	matches.forEach((raw) => {
		let normalized = raw.replace(/[^\d+]/g, "");

		if (normalized.startsWith("0") && normalized.length === 10) {
			normalized = "+4" + normalized;
		}

		if (normalized.startsWith("+40") && normalized.length === 12) {
			phones.add(normalized);
		}
	});
}

async function getCompanyName(companies, text) {
	const matches =
		text.match(
			/\b(?:[A-ZĂÂÎȘȚ][A-Za-zĂÂÎȘȚăâîșț0-9&.,\-]{1,40}\s+){0,5}(?:SRL|SA)\b/g
		) || [];

	matches.forEach((raw) => {
		let normalized = raw.trim().replace(/\s{2,}/g, " ");
		companies.add(normalized);
	});
}

async function getCUI(cuis, text) {
	const matches =
		text.match(
			/\b(?:RO\s*[-–—.:/\\]?\s*\d{6,10}|(?:cod\s+unic\s+de\s+[iî]nregistrare|c[\s.\-]*u[\s.\-]*i)\s*[:\-]?\s*\d{6,10})\b/gi
		) || [];

	matches.forEach((raw) => {
		const digits = raw.replace(/[^0-9]/g, "");
		cuis.add(`RO${digits}`);
	});
}