import { 
  getAnimeFLVServers, 
  getJKAnimeServers, 
  getMonosChinosServers, 
  getGogoServers 
} from "../../utils/sources";

export default defineEventHandler(async (event) => {
  // 🔥 CORS FIX
  setHeader(event, "Access-Control-Allow-Origin", "*");
  setHeader(event, "Access-Control-Allow-Methods", "GET, OPTIONS");
  setHeader(event, "Access-Control-Allow-Headers", "Content-Type, x-api-key");

  if (event.method === "OPTIONS") return "";

  // 🔑 API KEY CHECK
  const apiKey = getHeader(event, "x-api-key");
  const envKey = process.env.API_KEY || event.context.cloudflare?.env?.API_KEY;

  if (envKey && apiKey !== envKey) {
    throw createError({ statusCode: 401, statusMessage: "No autorizado" });
  }

  // 📂 OBTENER PARÁMETROS
  const { slug } = getRouterParams(event);
  const query = getQuery(event);
  
  // Extraemos el número de episodio y el idioma (por defecto 'sub')
  const number = Number(query.number) || 1;
  const lang = query.lang || 'sub'; 

  let servers = [];

  try {
    // 🔍 LÓGICA DE SELECCIÓN DE FUENTE POR IDIOMA
    if (lang === 'latino' || lang === 'spanish') {
      // Fuente validada en el test: MonosChinos
      servers = await getMonosChinosServers(slug, number);
    } 
    else if (lang === 'jp' || lang === 'japanese') {
      // Fuente validada en el test: GogoAnime (Anitaku)
      servers = await getGogoServers(slug, number);
    } 
    else {
      // Por defecto: Subtitulado (JKAnime o AnimeFLV)
      // Intentamos primero con JKAnime que es más ligero para Cloudflare
      servers = await getJKAnimeServers(slug, number);
      
      // Si JK no devuelve nada, intentamos con AnimeFLV (opcional)
      if (servers.length === 0) {
        servers = await getAnimeFLVServers(slug, number);
      }
    }

    return {
      success: true,
      slug,
      episode: number,
      language: lang,
      servers: servers
    };

  } catch (error) {
    throw createError({ 
      statusCode: 500, 
      statusMessage: "Error al obtener servidores de video" 
    });
  }
});
