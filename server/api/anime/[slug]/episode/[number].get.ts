import { getEpisode } from "animeflv-scraper";

export default defineEventHandler(async (event) => {
  // 1. CONFIGURACIÓN DE CORS (Inyectado en cada respuesta)
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
    "Access-Control-Max-Age": "86400",
  };

  setResponseHeaders(event, corsHeaders);

  // 2. MANEJO DE PRE-CONSULTA (PREFLIGHT)
  // Lovable falla si esto no devuelve un status 200 o 204 limpio.
  if (getMethod(event) === 'OPTIONS') {
    event.node.res.statusCode = 204;
    return 'ok';
  }

  // 3. EXTRACCIÓN DE PARÁMETROS
  const params = getRouterParams(event);
  const slug = params.slug;
  const number = params.number;

  if (!slug || !number) {
    throw createError({
      statusCode: 400,
      message: "Faltan parámetros: slug y number son requeridos",
    });
  }

  try {
    // 4. CONSULTA AL SCRAPER
    // Usamos Number(number) para asegurar que el scraper reciba un entero
    const episodeData = await getEpisode(slug, Number(number));

    if (!episodeData || !episodeData.servers || episodeData.servers.length === 0) {
      throw createError({
        statusCode: 404,
        message: `No se encontraron servidores para ${slug} episodio ${number}`,
      });
    }

    return {
      success: true,
      data: episodeData
    };

  } catch (error: any) {
    // 5. CAPTURA DE ERRORES
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || "Error al cargar los servidores del episodio",
    });
  }
});
