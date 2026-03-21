import { searchAnime } from "animeflv-scraper";

export default defineEventHandler(async (event) => {
  // 1. CONFIGURACIÓN DE CORS (AUTORIDAD TOTAL)
  setResponseHeaders(event, {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "*",
    "Access-Control-Max-Age": "86400",
  });

  if (getMethod(event) === 'OPTIONS') {
    event.node.res.statusCode = 204;
    return 'ok';
  }

  // 2. EXTRACCIÓN SEGURA DE PARÁMETROS
  const { query, page, lang } = getQuery(event) as { query: string, page: string, lang?: string };
  
  // Si no hay búsqueda, devolvemos error 400 en lugar de intentar procesar
  if (!query) {
    throw createError({
      statusCode: 400,
      message: "Falta el parámetro de búsqueda (query)",
    });
  }

  try {
    let results = [];

    if (lang === 'latino') {
      // MOTOR LATINO CON TIMEOUT Y PROTECCIÓN
      try {
        const searchUrl = `https://www.animelatinohd.com/busqueda?q=${encodeURIComponent(query)}`;
        const html = await $fetch<string>(searchUrl, {
          headers: { "User-Agent": "Mozilla/5.0" },
          timeout: 8000 // Si tarda más de 8s, cancelamos para no bloquear tu API
        });

        const regex = /<div class="anime-card">[\s\S]*?href="\/anime\/(.*?)"[\s\S]*?src="(.*?)"[\s\S]*?<h3>(.*?)<\/h3>/g;
        let match;

        while ((match = regex.exec(html)) !== null) {
          results.push({
            title: match[3].trim(),
            slug: match[1],
            cover: match[2].startsWith('http') ? match[2] : `https://www.animelatinohd.com${match[2]}`,
            type: "Anime",
            url: `/anime/${match[1]}?lang=latino`
          });
        }
      } catch (latinoError) {
        console.error("Error en Scraper Latino:", latinoError);
        // No lanzamos error global, solo devolvemos lista vacía de esta fuente
      }
    } else {
      // MOTOR ANIMEFLV (SUB)
      const search = await searchAnime(query, Number(page) || 1);
      results = search || [];
    }

    return { 
      success: true, 
      data: results 
    };

  } catch (error: any) {
    // CAPTURA DE ERROR GLOBAL PARA EVITAR CRASH
    throw createError({ 
      statusCode: 500, 
      message: "Error interno en el servidor de búsqueda",
      data: { success: false, info: error.message }
    });
  }
});
