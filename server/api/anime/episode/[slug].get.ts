import { getEpisode } from "animeflv-scraper";

export default defineCachedEventHandler(async (event) => {
  // 1. CONFIGURACIÓN DE CORS
  setResponseHeaders(event, {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "*",
    "Access-Control-Max-Age": "86400",
  });

  // Respuesta rápida para pre-flight
  if (getMethod(event) === 'OPTIONS') {
    event.node.res.statusCode = 204;
    return 'ok';
  }

  // 2. OBTENCIÓN DEL SLUG
  const { slug } = getRouterParams(event) as { slug: string };

  try {
    // 3. CONSULTA AL SCRAPER ORIGINAL
    const episode = await getEpisode(slug);
    
    if (!episode) {
      throw createError({
        statusCode: 404,
        message: "No se ha encontrado el episodio",
        data: { success: false, error: "No se ha encontrado el episodio" }
      });
    }
    
    return {
      success: true,
      data: episode
    };
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || "Error al obtener los servidores del episodio",
    });
  }
}, {
  // Configuración de Caché (1 día)
  swr: false,
  maxAge: 86400,
  name: "episode",
  group: "anime",
  getKey: (event) => {
    const { slug } = getRouterParams(event) as { slug: string };
    return slug;
  }
});

// --- DOCUMENTACIÓN OPENAPI ---
defineRouteMeta({
  openAPI: {
    tags: ["Anime"],
    summary: "Episodio por Slug",
    description: "Obtiene los servidores de video de un episodio usando su slug de AnimeFLV.",
    parameters: [
      {
        name: "slug",
        in: "path",
        required: true,
        schema: { type: "string" },
        example: "boruto-naruto-next-generations-tv-65"
      }
    ]
  }
});
