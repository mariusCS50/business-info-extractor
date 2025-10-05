import { Cluster } from "puppeteer-cluster";
import { Logger } from "./logger.js";

let clusterPromise = null;
let clusterInstance = null;

const logger = new Logger("Cluster");

export async function getCluster() {
    if (!clusterPromise) {
        clusterPromise = Cluster.launch({
            concurrency: Cluster.CONCURRENCY_PAGE,
            maxConcurrency: 3,
            puppeteerOptions: {
                headless: true,
               args: [
				"--no-sandbox",
				"--disable-setuid-sandbox",
				"--disable-dev-shm-usage",
				"--disable-gpu",
				"--single-process"
				],
            },
            timeout: 60 * 1000,
            // retryLimit: 2,
            // retryDelay: 1000,
        });

        clusterInstance = await clusterPromise;

        clusterInstance.on("taskerror", (err, data) => {
            logger.error(`Failed crawling ${data}: ${err.message}`);
        });

		process.on("SIGINT", async () => {
			logger.warn("SIGINT received, closing cluster...");
			if (clusterInstance) await clusterInstance.close();
			process.exit(0);
		});

		process.on("SIGTERM", async () => {
			logger.warn("SIGTERM received, closing cluster...");
			if (clusterInstance) await clusterInstance.close();
			process.exit(0);
		});

    }

    return clusterPromise;
}
