import { searchAnime } from "animeflv-scraper";

export default defineEventHandler(async (event) => {

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

  const { query, page } = getQuery(event) as { query: string, page: string };

  try {
    const results = await searchAnime(query, Number(page) || 1);

    if (!results || !results?.media?.length) {
      throw createError({
        statusCode: 404,
        message: "No se encontraron resultados",
        data: { success: false }
      });
    }

    return {
      success: true,
      data: results
    };

  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || "Error en el servidor de búsqueda",
    });
  }
});
