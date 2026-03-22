import { searchAnimesByURL } from "animeflv-scraper";

export default defineEventHandler(async (event) => {

  // --- LIBERACIÓN DE CORS (AUTORIDAD TOTAL) ---
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

  const { url } = getQuery(event) as { url: string };

  try {
    const search = await searchAnimesByURL(url);

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
      statusCode: 500,
      message: "Error al procesar la URL de búsqueda",
      data: { success: false, error: error.message }
    });
  }
});
