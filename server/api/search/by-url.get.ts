import { searchAnimesByURL } from "animeflv-scraper";

export default defineEventHandler(async (event) => {
  // 1. CONFIGURACIÓN DE CABECERAS (CORS Total)
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

  if (!url) {
    throw createError({
      statusCode: 400,
      message: "Se requiere una URL para procesar la búsqueda",
    });
  }

  try {
    // 2. LÓGICA ORIGINAL (AnimeFLV exclusivamente)
    const search = await searchAnimesByURL(url);
    
    if (!search || !search?.media?.length) {
      throw createError({
        statusCode: 404,
        message: "No se han encontrado resultados en AnimeFLV",
      });
    }

    return {
      success: true,
      data: search
    };

  } catch (error: any) {
    // 3. CAPTURA DE ERRORES
    throw createError({
      statusCode: error.statusCode || 500,
      message: "Error al procesar la URL",
      data: { success: false, error: error.message }
    });
  }
});

// --- DOCUMENTACIÓN OPENAPI ---
defineRouteMeta({
  openAPI: {
    tags: ["Search"],
    summary: "Busca con URL de búsqueda",
    description: "Soporta URLs originales de AnimeFLV.",
    parameters: [
      {
        name: "url",
        in: "query",
        required: true,
        schema: { type: "string", format: "uri" }
      }
    ]
  }
});
