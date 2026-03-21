import { getAnimes } from "animeflv-scraper";

export default defineCachedEventHandler(async (event) => {
  // 1. CONFIGURACIÓN DE CORS (Autoridad Total)
  setResponseHeaders(event, {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "*",
    "Access-Control-Max-Age": "86400",
  });

  // Respuesta rápida para pre-consulta (OPTIONS)
  if (getMethod(event) === 'OPTIONS') {
    event.node.res.statusCode = 204;
    return 'ok';
  }

  // 2. EXTRACCIÓN DE PARÁMETROS (Página opcional)
  const queryParams = getQuery(event);
  const page = Number(queryParams.page) || 1;
  
  try {
    // 3. CONSULTA AL SCRAPER (Filtrado por estado: En emisión)
    // Usamos getAnimes con el filtro de estado '1' (que suele ser 'En emisión')
    const animesOnAir = await getAnimes({ 
      status: ["1"], 
      page: page 
    });

    return {
      success: true,
      data: animesOnAir
    };

  } catch (error: any) {
    // 4. CAPTURA DE ERRORES
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || "Error al obtener animes en emisión",
    });
  }
}, {
  // Configuración de Caché (1 hora para que la lista de emisión se actualice)
  swr: true,
  maxAge: 3600,
  name: "on-air",
  group: "anime",
  getKey: (event) => {
    const query = getQuery(event);
    return `on-air-page-${query.page || 1}`;
  }
});

// --- DOCUMENTACIÓN OPENAPI ---
defineRouteMeta({
  openAPI: {
    tags: ["Anime"],
    summary: "Animes en Emisión",
    description: "Lista de animes que se encuentran actualmente al aire.",
    parameters: [
      {
        name: "page",
        in: "query",
        required: false,
        description: "Número de página para la paginación",
        schema: { type: "integer", default: 1 }
      }
    ],
    responses: {
      200: { 
        description: "Lista obtenida con éxito",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean" },
                data: { type: "array", items: { type: "object" } }
              }
            }
          }
        }
      }
    }
  }
});
