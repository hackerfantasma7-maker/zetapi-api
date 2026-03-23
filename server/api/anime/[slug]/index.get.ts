// 1. Asegúrate de tener instalados o creados los otros scrapers
import { getAnimeInfo } from "animeflv-scraper"; 
// import { getAnimeInfoLatino } from "./tu-fuente-latino"; 

export default defineCachedEventHandler(async (event) => {
  // 🔥 CORS FIX
  setHeader(event, "Access-Control-Allow-Origin", "*");
  setHeader(event, "Access-Control-Allow-Methods", "GET, OPTIONS");
  setHeader(event, "Access-Control-Allow-Headers", "Content-Type, x-api-key");

  if (event.method === "OPTIONS") {
    setResponseStatus(event, 200);
    return "";
  }

  // 🔑 API KEY
  const apiKey = getHeader(event, "x-api-key");
  const envKey = process.env.API_KEY || event.context.cloudflare?.env?.API_KEY;

  if (!envKey || apiKey !== envKey) {
    throw createError({ statusCode: 401 });
  }

  const { slug } = getRouterParams(event) as { slug: string };
  
  // 📥 Capturamos el idioma desde el query (?lang=spanish)
  const { lang } = getQuery(event);

  // 🚀 BUSQUEDA EN PARALELO
  // Aquí es donde agregas las llamadas a las otras fuentes según el idioma
  const sources = await Promise.allSettled([
    getAnimeInfo(slug).catch(() => null),
    // getAnimeInfoLatino(slug).catch(() => null), <-- Agrega aquí tu scraper de audio latino
    // getAnimeInfoJP(slug).catch(() => null),     <-- Agrega aquí tu scraper de audio japonés
  ]);

  const valid = sources
    .filter((r: any) => r.status === "fulfilled" && r.value)
    .map((r: any) => r.value);

  if (!valid.length) {
    throw createError({
      statusCode: 404,
      message: "No se encontró información para este anime o idioma"
    });
  }

  // 🧠 LÓGICA DE FILTRADO POR IDIOMA (Opcional)
  // Si quieres que la API devuelva SOLO el idioma pedido:
  let finalData = valid[0]; 
  
  if (lang) {
    // Filtramos los resultados que coincidan con el idioma (si tu scraper devuelve el campo 'lang')
    const filtered = valid.find((v: any) => v.type === lang || v.language === lang);
    if (filtered) finalData = filtered;
  }

  // 🔄 MERGE DE EPISODIOS (Mantiene tu lógica actual de ordenar por número)
  const mergedEpisodes = Array.from(
    new Map(
      valid
        .flatMap((s: any) => s.episodes || [])
        .map((ep: any) => [ep.number, ep])
    ).values()
  ).sort((a: any, b: any) => a.number - b.number);

  return {
    success: true,
    filter_applied: lang || "all",
    totalEpisodes: mergedEpisodes.length,
    data: {
      ...finalData,
      episodes: mergedEpisodes
    }
  };
}, {
  maxAge: 3600 // Cache por 1 hora para no saturar las webs
});
