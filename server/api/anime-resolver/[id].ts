import { searchAnime, getAnimeInfo } from "animeflv-scraper";

export default defineEventHandler(async (event) => {
  // 🔥 CORS FIX
  setHeader(event, "Access-Control-Allow-Origin", "*");
  setHeader(event, "Access-Control-Allow-Methods", "GET,OPTIONS");
  setHeader(event, "Access-Control-Allow-Headers", "Content-Type, x-api-key");

  if (event.method === "OPTIONS") return "";

  const apiKey = getHeader(event, "x-api-key");
  const envKey = process.env.API_KEY || event.context.cloudflare?.env?.API_KEY;

  if (!envKey || apiKey !== envKey) {
    throw createError({ statusCode: 401 });
  }

  const { id } = getRouterParams(event) as { id: string };

  const anilist = await $fetch<any>("https://graphql.anilist.co", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: {
      query: `
        query ($id: Int) {
          Media(id: $id, type: ANIME) {
            title { romaji english native }
            synonyms
          }
        }
      `,
      variables: { id: Number(id) }
    }
  }).catch(() => null);

  if (!anilist?.data?.Media) {
    throw createError({ statusCode: 404 });
  }

  const media = anilist.data.Media;

  const normalize = (t: string) =>
    t.toLowerCase()
      .replace(/[:]/g, "")
      .replace(/\(.*?\)/g, "")
      .replace(/\s+/g, "-")
      .replace(/[^\w-]/g, "");

  const names = [
    media.title?.romaji,
    media.title?.english,
    media.title?.native,
    ...(media.synonyms || [])
  ].filter(Boolean);

  let best: any = null;

  for (const name of names) {
    try {
      const search = await searchAnime(normalize(name), 1);
      if (search?.media?.length) {
        best = search.media[0];
        break;
      }
    } catch {}
  }

  if (!best) throw createError({ statusCode: 404 });

  const info = await getAnimeInfo(best.slug).catch(() => null);

  return {
    success: true,
    data: {
      slug: best.slug,
      title: info?.title,
      synopsis: info?.synopsis,
      cover: info?.cover,
      episodes: info?.episodes || []
    }
  };
});
//fix
