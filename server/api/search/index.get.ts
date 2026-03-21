import { searchAnime } from "animeflv-scraper";

export default defineEventHandler(async (event) => {
  // 1. Cabeceras CORS para que Lovable no bloquee la petición
  setResponseHeaders(event, {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "*",
    "Access-Control-Max-Age": "86400",
  });

  // Responder rápido a las peticiones OPTIONS
  if (getMethod(event) === 'OPTIONS') {
    return 'ok';
  }

  // 2. Obtener parámetros de la URL
  const { query, page } = getQuery(event) as { query: string, page: string };
  
  if (!query) {
    throw createError({ 
      statusCode: 400, 
      message: "Falta el parámetro de búsqueda (query)" 
    });
  }

  try {
    // 3. Ejecutar búsqueda original (AnimeFLV)
    const results = await searchAnime(query, Number(page) || 1);
    
    return { 
      success: true, 
      data: results 
    };

  } catch (error: any) {
    // 4. Captura de errores
    throw createError({ 
      statusCode: 500, 
      message: error.message || "Error interno en el servidor de búsqueda" 
    });
  }
});
