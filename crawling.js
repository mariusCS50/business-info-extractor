import { getCluster } from "./clusterManager.js";
import { getEmails, getPhones, getCompanyName, getCUI } from "./extractors.js";
import { Logger } from "./logger.js";

const logger = new Logger("Crawler");

export async function crawlWebsites(urls) {
    const cluster = await getCluster();

    await cluster.task(async ({ page, data: url }) => {
        logger.info(`Starting crawl: ${url}`);
        try {
            await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });

            const emails = await getEmails(page);
            const phones = await getPhones(page);
            const company = await getCompanyName(page);
            const cui = await getCUI(page);

            logger.info(`Finished crawl: ${url}`);
            return { url, emails, phones, company, cui };
        } catch (err) {
            return { url, error: err.message };
        }
    });

    const results = [];

    for (const url of urls) {
        results.push(cluster.execute(url));
    }

    return Promise.all(results);
}