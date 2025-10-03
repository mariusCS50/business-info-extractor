import axios from "axios";

const DECODO_ENDPOINT = "https://scraper-api.decodo.com/v2/scrape";

export async function getGoogleSearchResults(query) {
  if (!query) throw new Error("Missing query");

  const payload = {
    target: "google_search",
    query,
    headless: "html",
    limit: "10", // change back to 100
    locale: "ro-ro",
    geo: "Romania",
    page_from: "1",
    google_results_language: "ro",
    parse: true,
  };

  const response = await axios.post(DECODO_ENDPOINT, payload, {
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Basic ${process.env.DECODO_API_KEY}`,
    },
  });

  return response.data;
}