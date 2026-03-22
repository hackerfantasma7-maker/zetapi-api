import { getAnimeInfo } from "animeflv-scraper";

export default defineCachedEventHandler(async (event) => {
  const apiKey = getHeader(event, "x-api-key");

  const envKey =
    process.env.API_KEY ||
    event.context.cloudflare?.env?.API_KEY;

  if (!envKey || apiKey !== envKey) {
    throw createError({ statusCode: 401 });
  }

  setHeader(event, "Access-Control-Allow-Origin", "*");
  setHeader(event, "Access-Control-Allow-Methods", "GET,OPTIONS");
  setHeader(event, "Access-Control-Allow-Headers", "*");

  if (event.method === "OPTIONS") return;

  const { slug } = getRouterParams(event) as { slug: string };

  const sources = await Promise.allSettled([
    getAnimeInfo(slug).catch(() => null)
  ]);

  const valid = sources
    .filter((r: any) => r.status === "fulfilled" && r.value)
    .map((r: any) => r.value);

  if (!valid.length) {
    throw createError({
      statusCode: 404,
      message: "No se encontró el anime"
    });
  }

  const base = valid[0];

  const mergedEpisodes = Array.from(
    new Map(
      valid
        .flatMap((s: any) => s.episodes || [])
        .map((ep: any) => [ep.number, ep])
    ).values()
  ).sort((a: any, b: any) => a.number - b.number);

  return {
    success: true,
    totalEpisodes: mergedEpisodes.length,
    data: {
      ...base,
      episodes: mergedEpisodes
    }
  };
});
