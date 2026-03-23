import { getAnimeInfo } from "animeflv-scraper";
// Nota: Aquí deberías importar otros scrapers si decides usar fuentes diferentes para Latino
// import { getAnimeInfoLatino } from "./tus-otros-scrapers"; 

export default defineCachedEventHandler(async (event) => {
  // 🔥 CORS FIX
  setHeader(event, "Access-Control-Allow-Origin", "*");
  setHeader(event, "Access-Control-Allow-Methods", "GET, OPTIONS");
  setHeader(event, "Access-Control-Allow-Headers", "Content-Type, x-api-key");

  if (event.method === "OPTIONS") return "";

  // 🔑 API KEY CHECK
  const apiKey = getHeader(event, "x-api-key");
  const envKey = process.env.API_KEY || event.context.cloudflare?.env?.API_KEY;

  if (!envKey || apiKey !== envKey) {
    throw createError({ statusCode: 401, statusMessage: "No autorizado" });
  }

  // 📂 OBTENER PARÁMETROS
  const { slug } = getRouterParams(event);
  const query = getQuery(event);
  const lang = query.lang || 'sub'; // Por defecto es subtitulado (AnimeFLV)

  let data = null;

  try {
    // 🔍 LÓGICA DE SELECCIÓN POR IDIOMA
    if (lang === 'spanish') {
      // Aquí podrías cambiar la lógica si tienes una fuente de doblaje
      // Por ahora, intentamos buscar con el slug asumiendo que la fuente lo soporta
      data = await getAnimeInfo(slug).catch(() => null); 
    } 
    else if (lang === 'japanese') {
      // Lógica para versión original (puedes filtrar por tags si el scraper lo permite)
      data = await getAnimeInfo(slug).catch(() => null);
    } 
    else {
      // Por defecto: Subtitulado (AnimeFLV)
      data = await getAnimeInfo(slug).catch(() => null);
    }

    if (!data) {
      throw createError({ statusCode: 404, statusMessage: "Anime no encontrado" });
    }

    return {
      success: true,
      language: lang,
      data
    };

  } catch (error) {
    throw createError({ statusCode: 500, statusMessage: "Error al obtener info" });
  }
}, {
  // Configuración de caché opcional (para que no sature la fuente)
  maxAge: 60 * 60 // 1 hora
});
    data
  };
});
//nuevo
