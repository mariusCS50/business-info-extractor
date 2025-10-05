import { getCluster } from "./clusterManager.js";
import { crawlPages } from "./extractors.js";
import { Logger } from "./logger.js";

const logger = new Logger("Crawler");

export async function crawlWebsites(urls) {
    const cluster = await getCluster();

    await cluster.task(async ({ page, data: url }) => {

		await page.setUserAgent(
			"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.181 Safari/537.36"
		);

        logger.info(`Starting crawl: ${url}`);

        try {
            const result = await crawlPages(page, url);

            logger.info(`Finished crawl: ${url}`);
            return result;
        } catch (err) {
            logger.error(`Error crawling ${url}: ${err.message}`);
            return { url, error: err.message };
        }
    });

    const results = [];

    for (const url of urls) {
        results.push(cluster.execute(url));
    }

    return Promise.all(results);
}