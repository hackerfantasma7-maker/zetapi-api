import { getEpisode } from "animeflv-scraper";

export default defineEventHandler(async (event) => {
  // 1. CORS REFORZADO (Esto es lo que quita el error de 'preflight')
  setResponseHeaders(event, {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
  });

  // Manejo de la petición OPTIONS (Preflight)
  if (getMethod(event) === 'OPTIONS') {
    event.node.res.statusCode = 204;
    return 'ok';
  }

  // 2. CAPTURA DEL SLUG "PEGADO" (Ej: sousou-no-frieren-2nd-season-9)
  const { slug: fullSlug } = getRouterParams(event) as { slug: string };

  try {
    // 3. LÓGICA DE SEPARACIÓN INTELIGENTE
    // Buscamos el último guion seguido de números (ej: -9)
    const match = fullSlug.match(/(.+)-(\d+)$/);
    
    if (!match) {
      throw createError({ 
        statusCode: 400, 
        message: "El formato del slug no es válido. Se esperaba 'nombre-anime-numero'" 
      });
    }

    const animeSlug = match[1]; // "sousou-no-frieren-2nd-season"
    const episodeNumber = Number(match[2]); // 9

    // 4. CONSULTA AL SCRAPER
    const episodeData = await getEpisode(animeSlug, episodeNumber);

    if (!episodeData) {
      throw createError({ statusCode: 404, message: "Episodio no encontrado en AnimeFLV" });
    }

    return {
      success: true,
      data: episodeData
    };

  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || "Error interno al procesar el episodio",
    });
  }
});
