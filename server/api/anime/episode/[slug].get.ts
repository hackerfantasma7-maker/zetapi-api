import { getAnimeEpisodeServers } from "animeflv-scraper";

export default defineCachedEventHandler(async (event) => {
  // 1. CONFIGURACIÓN DE CORS
  setResponseHeaders(event, {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "*",
    "Access-Control-Max-Age": "86400",
  });

  if (getMethod(event) === 'OPTIONS') {
    event.node.res.statusCode = 204;
    return 'ok';
  }

  // 2. OBTENER SLUG DE LOS PARÁMETROS
  const slug = getRouterParam(event, 'slug');

  try {
    if (!slug) {
      throw createError({
        statusCode: 400,
        message: "El parámetro 'slug' es requerido",
      });
    }

    // 3. LÓGICA PARA OBTENER SERVIDORES
    const servers = await getAnimeEpisodeServers(slug);

    if (!servers || servers.length === 0) {
      throw createError({
        statusCode: 404,
        message: `No se encontraron servidores para el episodio: ${slug}`,
      });
    }

    return {
      success: true,
      data: servers
    };

  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || "Error al obtener servidores del episodio",
    });
  }
}, {
  // Configuración de Caché (1 hora para episodios)
  swr: true,
  maxAge: 3600,
  name: "episode-servers",
  group: "anime",
  getKey: (event) => {
    const slug = getRouterParam(event, 'slug');
    return `episode-${slug}`;
  }
});
