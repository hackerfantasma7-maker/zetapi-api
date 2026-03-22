import { getEpisode } from "animeflv-scraper";

export default defineCachedEventHandler(async (event) => {
  const apiKey = getHeader(event, "x-api-key");
  if (apiKey !== process.env.API_KEY) {
    throw createError({ statusCode: 401 });
  }

  setHeader(event, "Access-Control-Allow-Origin", "*");
  setHeader(event, "Access-Control-Allow-Methods", "GET,OPTIONS");
  setHeader(event, "Access-Control-Allow-Headers", "*");

  if (event.method === "OPTIONS") return;

  const { slug } = getRouterParams(event) as { slug: string };

  const episode = await getEpisode(slug).catch(() => null);

  if (!episode) {
    throw createError({ statusCode: 404 });
  }

  return {
    success: true,
    total: episode.servers?.length || 0,
    data: episode
  };
});
