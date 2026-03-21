import { searchAnime } from "animeflv-scraper";

export default defineCachedEventHandler(async (event) => {
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
  const queryParams = getQuery(event);
  const query = String(queryParams.query || "");
  const page = Number(queryParams.page) || 1;
  
  try {
    if (!query) {
      throw createError({
        statusCode: 400,
        message: "Se requiere un término de búsqueda (query)",
      });
    }

    const search = await searchAnime(query, page);
    
    if (!search || !search.media || search.media.length === 0) {
      throw createError({
        statusCode: 404,
        message: "No se han encontrado resultados en la búsqueda",
        data: { success: false, error: "No se han encontrado resultados" }
      });
    }

    return {
      success: true,
      data: search
    };
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || "Error en el servidor de búsqueda",
    });
  }
}, {
  // Configuración de Caché (6 horas)
  swr: true,
  maxAge: 21600,
  name: "search-index",
  group: "anime",
  getKey: (event) => {
    const q = getQuery(event);
    return `index-${q.query}-${q.page || 1}`;
  }
});

// --- DOCUMENTACIÓN OPENAPI ---
defineRouteMeta({
  openAPI: {
    tags: ["Search"],
    summary: "Busca un anime con texto",
    description: "Ejecuta una búsqueda de animes utilizando una consulta de texto.",
    parameters: [
      {
        name: "query",
        in: "query",
        summary: "La consulta.",
        example: "isekai",
        required: true,
        schema: { type: "string" }
      },
      {
        name: "page",
        in: "query",
        summary: "El número de página.",
        example: 1,
        required: false,
        schema: { type: "number" }
      }
    ],
    responses: {
      200: {
        description: "Retorna un objeto con resultados de búsqueda",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: true },
                data: {
                  type: "object",
                  properties: {
                    currentPage: { type: "number" },
                    hasNextPage: { type: "boolean" },
                    foundPages: { type: "number" },
                    media: { type: "array", items: { type: "object" } }
                  }
                }
              }
            }
          }
        }
      },
      404: { description: "No se han encontrado resultados." }
    }
  }
});
