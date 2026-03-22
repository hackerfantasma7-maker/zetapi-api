import { searchAnime, getAnimeInfo } from "animeflv-scraper";

export default defineEventHandler(async (event) => {
  // 🌐 CORS
  setHeader(event, "Access-Control-Allow-Origin", "*");
  setHeader(event, "Access-Control-Allow-Methods", "GET,OPTIONS");
  setHeader(event, "Access-Control-Allow-Headers", "Content-Type, x-api-key");

  // 🔥 PREFLIGHT
  if (event.method === "OPTIONS") {
    return { status: 200 };
  }

  // 🔐 API KEY
  const apiKey = getHeader(event, "x-api-key");

  const envKey =
    process.env.API_KEY ||
    event.context.cloudflare?.env?.API_KEY;

  if (!envKey || apiKey !== envKey) {
    throw createError({ statusCode: 401 });
  }

  const { id } = getRouterParams(event) as { id: string };

  // 🔥 ANILIST
  const anilist = await $fetch<any>("https://graphql.anilist.co", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: {
      query: `
        query ($id: Int) {
          Media(id: $id, type: ANIME) {
            id
            title {
              romaji
              english
              native
            }
            synonyms
          }
        }
      `,
      variables: { id: Number(id) }
    }
  }).catch(() => null);

  if (!anilist?.data?.Media) {
    throw createError({
      statusCode: 404,
      message: "No encontrado en AniList"
    });
  }

  const media = anilist.data.Media;

  // 🔥 NORMALIZADOR
  const normalize = (t: string) =>
    t
      .toLowerCase()
      .replace(/[:]/g, "")
      .replace(/\(.*?\)/g, "")
      .replace(/season \d+/g, "")
      .replace(/\s+/g, "-")
      .replace(/[^\w-]/g, "")
      .replace(/-+/g, "-")
      .trim();

  // 🔥 GENERADOR DE NOMBRES
  const rawNames = [
    media.title?.romaji,
    media.title?.english,
    media.title?.native,
    ...(media.synonyms || [])
  ].filter(Boolean);

  const expanded = rawNames.flatMap((name: string) => [
    name,
    name.replace(/:/g, ""),
    name.replace(/-/g, " "),
    name.replace(/\(.*?\)/g, ""),
  ]);

  const candidates = Array.from(
    new Set(expanded.map(normalize))
  ).filter(Boolean);

  // 🔥 SCORE INTELIGENTE
  const score = (a: string, b: string) => {
    a = normalize(a);
    b = normalize(b);

    if (a === b) return 100;

    if (a.includes(b) || b.includes(a)) return 80;

    const wordsA = a.split("-");
    const wordsB = b.split("-");

    let matches = 0;
    wordsA.forEach(w => {
      if (wordsB.includes(w)) matches++;
    });

    return (matches / Math.max(wordsA.length, wordsB.length)) * 100;
  };

  // 🔥 BUSQUEDA INTELIGENTE
  let best: any = null;
  let bestScore = 0;

  for (const name of candidates) {
    try {
      const search = await searchAnime(name, 1);

      if (!search?.media?.length) continue;

      for (const result of search.media) {
        const s = score(name, result.title);

        if (s > bestScore) {
          bestScore = s;
          best = result;
        }
      }
    } catch {}
  }

  if (!best || bestScore < 40) {
    throw createError({
      statusCode: 404,
      message: "No se pudo resolver el anime"
    });
  }

  // 🔥 VALIDAR INFO REAL
  const info = await getAnimeInfo(best.slug).catch(() => null);

  if (!info) {
    throw createError({
      statusCode: 404,
      message: "No se pudo obtener info del anime"
    });
  }

  return {
    success: true,
    matchScore: bestScore,
    data: {
      anilistId: id,
      resolvedSlug: best.slug,
      title: info.title,
      cover: info.cover,
      episodes: info.episodes || [],
      totalEpisodes: info.episodes?.length || 0
    }
  };
});
