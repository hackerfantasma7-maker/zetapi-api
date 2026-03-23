export default defineEventHandler(async (event) => {
  // 🔥 CORS FIX
  setHeader(event, "Access-Control-Allow-Origin", "*");
  setHeader(event, "Access-Control-Allow-Methods", "GET, POST, OPTIONS"); // Añadido POST
  setHeader(event, "Access-Control-Allow-Headers", "Content-Type, x-api-key");

  if (event.method === "OPTIONS") return "";

  // 🛡️ AUTH CHECK
  const apiKey = getHeader(event, "x-api-key");
  const envKey = process.env.API_KEY || event.context.cloudflare?.env?.API_KEY;

  if (!envKey || apiKey !== envKey) {
    throw createError({ 
      statusCode: 401, 
      statusMessage: "No autorizado" 
    });
  }

  // 📥 LEER DATOS (Query o Body)
  const body = await readBody(event);
  const { query, language } = body; 

  // 🔍 LÓGICA DE FILTRADO POR IDIOMA
  // Aquí es donde defines a qué fuente ir según el idioma solicitado
  let results = [];
  
  try {
    switch (language) {
      case 'spanish':
        // Lógica para buscar animes doblados al español
        // results = await searchSpanishAnime(query);
        break;
      case 'japanese':
        // Lógica para buscar animes en audio original (sin subs o raw)
        break;
      case 'sub_spanish':
        // Lógica para buscar animes subtitulados
        break;
      default:
        // Búsqueda general si no se especifica idioma
        break;
    }

    return {
      success: true,
      timestamp: Date.now(),
      filters: {
        search: query,
        lang: language || 'all'
      },
      data: body // Aquí cambiarías 'body' por 'results' una vez conectes los scrapers
    };

  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: "Error interno al procesar la búsqueda"
    });
  }
});
