import { getLatest } from "animeflv-scraper";

export default defineEventHandler(async (event) => {

  setResponseHeaders(event, {
    "Access-Control-Allow-Origin": "*",
  });

  const data = await getLatest();

  return {
    success: true,
    data
  };
});
