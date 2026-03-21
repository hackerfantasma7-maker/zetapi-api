import { getEpisode } from "animeflv-scraper";

export default defineCachedEventHandler(async (event) => {
  // 1. CONFIGURACIÓN DE CORS (AUTORIDAD TOTAL)
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

  // 2. PARÁMETROS: Slug, Número y ahora 'lang'
  const { slug, number } = getRouterParams(event) as { slug: string, number: string };
  const { lang } = getQuery(event) as { lang?: string };
  
  try {
    let episodeData;

    if (lang === 'latino') {
      // Motor para obtener servidores de AnimeLatinoHD
      episodeData = await getLatinoEpisode(slug, number);
    } else {
      // Por defecto usa AnimeFLV
      episodeData = await getEpisode(slug, Number(number));
    }

    if (!episodeData) {
      throw createError({
        statusCode: 404,
        message: "No se ha encontrado el episodio",
      });
    }

    return {
      success: true,
      data: episodeData
    };

  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || "Error al cargar el episodio",
    });
  }
}, {
  swr: false,
  maxAge: 86400,
  name: "episode",
  group: "anime",
  getKey: (event) => {
    const { slug, number } = getRouterParams(event);
    const { lang } = getQuery(event);
    return `${slug}-${number}-${lang || 'sub'}`;
  }
});

// --- MOTOR DE EPISODIOS LATINO ---

async function getLatinoEpisode(slug: string, number: string) {
  const url = `https://www.animelatinohd.com/ver/${slug}/${number}`;
  
  try {
    const html = await $fetch<string>(url, {
      headers: { "User-Agent": "Mozilla/5.0" }
    });

    // Buscamos la variable que contiene los videos en el HTML
    // AnimeLatinoHD suele usar un JSON dentro del script o cargarlos dinámicamente
    const videoDataMatch = html.match(/var video = (\[.*?\]);/);
    const servers = [];

    if (videoDataMatch) {
      const videos = JSON.parse(videoDataMatch[1]);
      for (const vid of videos) {
        servers.push({
          name: vid.server.toUpperCase(),
          embed: vid.code,
          download: ""
        });
      }
    } else {
      // Intento secundario: buscar iframes directos si el JSON falla
      const iframeMatch = html.match(/<iframe.*?src="(.*?)"/);
      if (iframeMatch) {
        servers.push({
          name: "LATINO-MAIN",
          embed: iframeMatch[1],
          download: ""
        });
      }
    }

    return {
      title: `${slug} - Episodio ${number}`,
      number: Number(number),
      servers: servers
    };
  } catch (e) {
    return null;
  }
}

// TU DOCUMENTACIÓN OPENAPI SE MANTIENE ABAJO...
