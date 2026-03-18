import { searchAnimesByURL } from "animeflv-scraper";

export default defineEventHandler(async (event) => {
  // --- LIBERACIÓN DE CORS (AUTORIDAD TOTAL) ---
  setResponseHeaders(event, {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "*",
    "Access-Control-Max-Age": "86400",
  });

  // Respuesta rápida para el navegador (Pre-consulta)
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

defineRouteMeta({
  openAPI: {
    tags: ["Search"],
    summary: "Busca con URL de búsqueda",
    description: "Ejecuta una búsqueda de animes utilizando una URL de búsqueda.",
    parameters: [
      {
        name: "url",
        in: "query",
        summary: "La URL de consulta.",
        example: "https://www3.animeflv.net/browse?genre%5B%5D=shounen&type%5B%5D=tv&order=default&page=2",
        required: true,
        schema: {
          type: "string",
          format: "uri"
        }
      }
    ],
    responses: {
      200: {
        description: "Retorna los resultados paginados del anime.",
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
                    media: { type: "array", items: { type: "object" } }
                  }
                }
              }
            }
          }
        }
      },
      404: {
        description: "No se han encontrado resultados."
      }
    }
  }
});
