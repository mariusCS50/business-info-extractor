export class Logger {
    constructor(context, { debug = false } = {}) {
        this.context = context;
        this.debugEnabled = debug;
    }

    #getFormattedDateUTCPlus3() {
        const now = new Date();
        const utcPlus3 = new Date(now.getTime() + 3 * 60 * 60 * 1000);
        const year = utcPlus3.getUTCFullYear();
        const month = String(utcPlus3.getUTCMonth() + 1).padStart(2, "0");
        const day = String(utcPlus3.getUTCDate()).padStart(2, "0");
        const hours = String(utcPlus3.getUTCHours()).padStart(2, "0");
        const minutes = String(utcPlus3.getUTCMinutes()).padStart(2, "0");
        const seconds = String(utcPlus3.getUTCSeconds()).padStart(2, "0");
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    }

    #formatMessage(level, message, color) {
        const timestamp = this.#getFormattedDateUTCPlus3();
        return `${color}[${timestamp}] [${this.context}] [${level}] ${message}\x1b[0m`;
    }

    info(message, ...args) {
        console.log(this.#formatMessage("INFO", message, "\x1b[36m"), ...args); // cyan
    }

    warn(message, ...args) {
        console.warn(this.#formatMessage("WARN", message, "\x1b[33m"), ...args); // yellow
    }

    error(message, ...args) {
        console.error(this.#formatMessage("ERROR", message, "\x1b[31m"), ...args); // red
    }

    success(message, ...args) {
        console.log(this.#formatMessage("SUCCESS", message, "\x1b[32m"), ...args); // green
    }

    debug(message, ...args) {
        if (this.debugEnabled) {
            console.log(this.#formatMessage("DEBUG", message, "\x1b[35m"), ...args); // magenta
        }
    }
}
