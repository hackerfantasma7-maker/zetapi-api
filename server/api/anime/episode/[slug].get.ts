edita:import { getEpisode } from "animeflv-scraper";

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

  // 2. EXTRACCIÓN DE PARÁMETROS
  const { slug, number } = getRouterParams(event) as { slug: string, number: string };
  
  try {
    // 3. CONSULTA AL SCRAPER ORIGINAL (AnimeFLV Subtitulado)
    // Se elimina la bifurcación por 'lang' y el motor manual
    const episodeData = await getEpisode(slug, Number(number));

    if (!episodeData || (episodeData.servers && episodeData.servers.length === 0)) {
      throw createError({
        statusCode: 404,
        message: "No se han encontrado servidores disponibles para este episodio",
      });
    }

    return {
      success: true,
      data: episodeData
    };

  } catch (error: any) {
    // 4. CAPTURA DE ERRORES
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || "Error al cargar los servidores del episodio",
    });
  }
}, {
  // Configuración de Caché (1 día)
  swr: false,
  maxAge: 86400,
  name: "episode",
  group: "anime",
  getKey: (event) => {
    const { slug, number } = getRouterParams(event);
    return `${slug}-${number}`; // Simplificado: ya no requiere diferenciar por idioma
  }
});

// --- DOCUMENTACIÓN OPENAPI ---
defineRouteMeta({
  openAPI: {
    tags: ["Anime"],
    summary: "Servidores de Video del Episodio",
    description: "Obtiene los enlaces de reproducción (iframes) directamente de AnimeFLV.",
    parameters: [
      {
        name: "slug",
        in: "path",
        required: true,
        description: "Slug del anime (ej: black-clover-tv)",
        schema: { type: "string" }
      },
      {
        name: "number",
        in: "path",
        required: true,
        description: "Número del episodio",
        schema: { type: "string" }
      }
    ],
    responses: {
      200: { 
        description: "Lista de servidores obtenida con éxito",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean" },
                data: { type: "object" }
              }
            }
          }
        }
      },
      404: { description: "Episodio no encontrado" }
    }
  }
});
