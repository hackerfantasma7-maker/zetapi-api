import { searchAnime } from "animeflv-scraper";

export default defineEventHandler(async (event) => {
  // 1. CONFIGURACIÓN DE CORS (Se mantiene tu configuración original)
  setResponseHeaders(event, {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "*",
    "Access-Control-Max-Age": "86400",
  });

  if (getMethod(event) === 'OPTIONS') {
    event.node.res.statusCode = 204;
    return 'ok';import { searchAnime } from "animeflv-scraper";

export default defineEventHandler(async (event) => {
  // 1. CONFIGURACIÓN DE CORS (Autoridad Total)
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

  // 2. LÓGICA DE BÚSQUEDA EXTENDIDA
  const { query, page, lang } = getQuery(event) as { query: string, page: string, lang?: string };
  
  try {
    let results;

    // Switch de fuentes por idioma/sitio
    switch (lang) {
      case 'latino':
        results = await searchAnimeLatino(query, page); 
        break;
      
      case 'jkanime':
        results = await searchInJK(query, page);
        break;

      default:
        // Japonés Subtitulado (AnimeFLV)
        results = await searchAnime(query, Number(page) || 1);
        break;
    }
    
    if (!results || (results.media && results.media.length === 0)) {
      throw createError({
        statusCode: 404,
        message: `No se encontraron resultados para "${query}"`,
        data: { success: false }
      });
    }

    return {
      success: true,
      data: results
    };

  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || "Error en el servidor de búsqueda",
    });
  }
});

// --- FUNCIONES MOTORAS (Scrapers Reales con Regex) ---

async function searchAnimeLatino(query: string, page: string) {
  const url = `https://www.animelatinohd.com/busqueda?q=${encodeURIComponent(query)}`;
  
  try {
    const html = await $fetch<string>(url, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" }
    });

    // Regex para capturar: Slug, Cover (Poster) y Título
    const regex = /<div class="anime-card">[\s\S]*?href="\/anime\/(.*?)"[\s\S]*?src="(.*?)"[\s\S]*?<h3.*?>(.*?)<\/h3>/g;
    const media = [];
    let match;

    while ((match = regex.exec(html)) !== null) {
      media.push({
        title: match[3].trim(),
        cover: match[2],
        slug: match[1],
        type: "Anime",
        url: `https://www.animelatinohd.com/anime/${match[1]}`,
        source: "latino"
      });
    }

    return { 
      currentPage: 1, 
      hasNextPage: false, 
      previousPage: null, 
      nextPage: null, 
      foundPages: 1, 
      media 
    };
  } catch (e) {
    return { currentPage: 1, media: [] };
  }
}

async function searchInJK(query: string, page: string) {
  const url = `https://jkanime.net/buscar/${encodeURIComponent(query)}/${page || 1}/`;
  
  try {
    const html = await $fetch<string>(url, {
      headers: { "User-Agent": "Mozilla/5.0" }
    });

    // Regex para capturar la estructura de JKAnime
    const regex = /<div class="anime__item">[\s\S]*?href="(.*?)"[\s\S]*?data-setbg="(.*?)"[\s\S]*?<h5><a.*?>(.*?)<\/a><\/h5>/g;
    const media = [];
    let match;

    while ((match = regex.exec(html)) !== null) {
      const slug = match[1].split('/').filter(Boolean).pop();
      media.push({
        title: match[3].trim(),
        cover: match[2],
        slug: slug,
        type: "Anime",
        url: match[1],
        source: "jkanime"
      });
    }

    return { 
      currentPage: 1, 
      hasNextPage: false, 
      previousPage: null, 
      nextPage: null, 
      foundPages: 1, 
      media 
    };
  } catch (e) {
    return { currentPage: 1, media: [] };
  }
}

// TU DOCUMENTACIÓN OPENAPI SE MANTIENE AQUÍ ABAJO...
// [Pega aquí tu bloque defineRouteMeta que ya tenías]
  }

  // 2. LÓGICA DE BÚSQUEDA EXTENDIDA
  // Añadimos 'lang' para decidir la fuente
  const { query, page, lang } = getQuery(event) as { query: string, page: string, lang?: string };
  
  try {
    let results;

    // Switch de fuentes por idioma
    switch (lang) {
      case 'latino':
        // Aquí llamaremos a AnimeLatinoHD (lo configuraremos en el siguiente paso)
        results = await searchAnimeLatino(query, page); 
        break;
      
      case 'jkanime':
        // Para JKAnime
        results = await searchInJK(query, page);
        break;

      default:
        // Por defecto: AnimeFLV (Japonés Sub)
        results = await searchAnime(query, Number(page) || 1);
        break;
    }
    
    if (!results || (results.media && results.media.length === 0)) {
      throw createError({
        statusCode: 404,
        message: `No se encontraron resultados para "${query}"`,
        data: { success: false }
      });
    }

    return {
      success: true,
      data: results
    };

  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || "Error en el servidor de búsqueda",
    });
  }
});

// --- FUNCIONES MOTORAS (Paso 2: Scrapers Reales) ---

async function searchAnimeLatino(query: string, page: string) {
  // Aquí implementaremos el fetch a animelatinohd.com
  // Por ahora devolvemos un error controlado para probar la ruta
  throw createError({ statusCode: 501, message: "Motor Latino en configuración" });
}

async function searchInJK(query: string, page: string) {
  // Aquí implementaremos el fetch a jkanime.net
  throw createError({ statusCode: 501, message: "Motor JKAnime en configuración" });
}

// TU DOCUMENTACIÓN OPENAPI SE MANTIENE IGUAL...
// (Copia y pega tu bloque defineRouteMeta aquí abajo tal como lo tenías)
