import { searchAnime } from "animeflv-scraper";

export default defineEventHandler(async (event) => {
  // 1. CONFIGURACIÓN DE CORS
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

  // 2. EXTRACCIÓN DE PARÁMETROS
  const { query, page, lang } = getQuery(event) as { query: string, page: string, lang?: string };
  
  if (!query) {
    throw createError({
      statusCode: 400,
      message: "El parámetro 'query' es obligatorio para la búsqueda",
    });
  }

  try {
    let results;

    // 3. SWITCH HÍBRIDO DE FUENTES
    switch (lang) {
      case 'latino':
        results = await searchAnimeLatino(query, page); 
        break;
      
      case 'jkanime':
        results = await searchInJK(query, page);
        break;

      default:
        results = await searchAnime(query, Number(page) || 1);
        break;
    }
    
    if (!results || (results.media && results.media.length === 0)) {
      throw createError({
        statusCode: 404,
        message: `No se encontraron resultados para "${query}" en la fuente seleccionada`,
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
      message: error.message || "Error interno en el motor de búsqueda",
    });
  }
});

// --- FUNCIONES MOTORAS ---

async function searchAnimeLatino(query: string, page: string) {
  const url = `https://www.animelatinohd.com/busqueda?q=${encodeURIComponent(query)}`;
  
  try {
    const html = await $fetch<string>(url, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
      timeout: 10000 
    });

    const regex = /<div class="anime-card">[\s\S]*?href="\/anime\/(.*?)"[\s\S]*?src="(.*?)"[\s\S]*?<h3.*?>(.*?)<\/h3>/g;
    const media = [];
    let match;

    while ((match = regex.exec(html)) !== null) {
      media.push({
        title: match[3].trim(),
        cover: match[2].startsWith('http') ? match[2] : `https://www.animelatinohd.com${match[2]}`,
        slug: match[1],
        type: "Anime",
        url: `/anime/${match[1]}?lang=latino`,
        source: "latino"
      });
    }

    return { currentPage: 1, hasNextPage: false, media };
  } catch (e) {
    return { currentPage: 1, media: [] };
  }
}

async function searchInJK(query: string, page: string) {
  const url = `https://jkanime.net/buscar/${encodeURIComponent(query)}/${page || 1}/`;
  
  try {
    const html = await $fetch<string>(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      timeout: 10000
    });

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
        url: `/anime/${slug}?lang=jkanime`,
        source: "jkanime"
      });
    }

    return { 
      currentPage: Number(page) || 1, 
      hasNextPage: html.includes('Next'), 
      media 
    };
  } catch (e) {
    return { currentPage: 1, media: [] };
  }
}

// --- DOCUMENTACIÓN OPENAPI (Esto es lo que faltaba para el despliegue) ---
defineRouteMeta({
  openAPI: {
    tags: ["Search"],
    summary: "Buscador Global Híbrido",
    description: "Busca animes por texto. Soporta AnimeFLV (default), AnimeLatinoHD (latino) y JKAnime (jkanime).",
    parameters: [
      {
        name: "query",
        in: "query",
        required: true,
        description: "Nombre del anime a buscar",
        schema: { type: "string" }
      },
      {
        name: "page",
        in: "query",
        description: "Número de página",
        schema: { type: "string", default: "1" }
      },
      {
        name: "lang",
        in: "query",
        description: "Idioma/Fuente: latino, jkanime o dejar vacío para subtitulado",
        schema: { type: "string", enum: ["latino", "jkanime", ""] }
      }
    ],
    responses: {
      200: { description: "Resultados encontrados" },
      404: { description: "Sin resultados" }
    }
  }
});
