import { getLatest } from "animeflv-scraper";

export default defineEventHandler(async (event) => {
  // 1. CONFIGURACIÓN DE CABECERAS (CORS para Base44)
  setResponseHeaders(event, {
    "Access-Control-Allow-Origin": "*", 
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "*",
    "Access-Control-Max-Age": "86400" 
  });

  // 2. MANEJO DE PRE-CONSULTA
  if (getMethod(event) === 'OPTIONS') {
    event.node.res.statusCode = 204;
    return 'ok';
  }

  // 3. LÓGICA ORIGINAL (AnimeFLV Exclusivamente)
  try {
    const results = await getLatest();

    if (!results || results.length === 0) {
      throw createError({
        statusCode: 404,
        message: "No se encontraron episodios recientes",
      });
    }

    return {
      success: true,
      data: results
    };

  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || "Error al obtener los últimos episodios",
    });
  }
});

// --- DOCUMENTACIÓN OPENAPI ---
defineRouteMeta({
  openAPI: {
    tags: ["List"],
    summary: "Lista de últimos episodios lanzados",
    description: "Obtiene los episodios más recientes directamente de AnimeFLV.",
    responses: {
      200: {
        description: "Arreglo de episodios obtenido con éxito.",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: true },
                data: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string" },
                      number: { type: "number" },
                      cover: { type: "string" },
                      slug: { type: "string" },
                      url: { type: "string" }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
});
