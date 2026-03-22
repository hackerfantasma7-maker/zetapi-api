import { searchAnime } from "animeflv-scraper";

export default defineEventHandler(async (event) => {

  // 1. CONFIGURACIÓN DE AUTORIDAD TOTAL (CORS)
  setResponseHeaders(event, {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "*",
    "Access-Control-Max-Age": "86400",
  });

  // 2. MANEJO DE PRE-CONSULTA (OPTIONS)
  if (getMethod(event) === 'OPTIONS') {
    event.node.res.statusCode = 204;
    return 'ok';
  }

  // 3. LÓGICA DE BÚSQUEDA
  const { query, page } = getQuery(event) as { query: string, page: string };
  
  try {
    const search = await searchAnime(query, Number(page) || 1);
    
    if (!search || !search?.media?.length) {
      throw createError({
        statusCode: 404,
        message: "No se han encontrado resultados en la búsqueda",
        data: { success: false, error: "No se han encontrado resultados en la búsqueda" }
      });
    }

    return {
      success: true,
      data: search
    };

  } catch (error) {
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || "Error en el servidor de búsqueda",
    });
  }
});
