import { getAllServers } from "../../../../utils/getServers";
import { filterWorkingServers } from "../../../../utils/filter";

export default defineEventHandler(async (event) => {
  // 🔥 CORS FIX
  setHeader(event, "Access-Control-Allow-Origin", "*");
  setHeader(event, "Access-Control-Allow-Methods", "GET, OPTIONS");
  setHeader(event, "Access-Control-Allow-Headers", "Content-Type, x-api-key");

  if (event.method === "OPTIONS") return "";

  // 🔑 Extraer parámetros de la URL y del Query
  const { slug, number } = getRouterParams(event) as { slug: string, number: string };
  const { lang } = getQuery(event) as { lang?: string };

  /**
   * 🌐 LÓGICA DE IDIOMAS
   * Soportamos: 
   * - 'latino' o 'spanish'
   * - 'sub' (Subtitulado)
   * - 'jp' o 'japanese'
   */
  let language = "sub"; 
  
  if (lang === "latino" || lang === "spanish") {
    language = "latino";
  } else if (lang === "jp" || lang === "japanese") {
    language = "jp";
  }

  // 📝 Limpieza del título para el scraper
  const title = slug.replace(/-/g, " ");

  try {
    // 🚀 Buscamos los servidores pasando el idioma validado
    const servers = await getAllServers({
      slug,
      number: Number(number),
      title,
      lang: language 
    });

    // 🛡️ Filtramos solo los servidores que están funcionando
    const working = await filterWorkingServers(servers);

    return {
      success: true,
      info: {
        slug,
        episode: Number(number),
        language_selected: language,
        available_servers: working.length
      },
      data: {
        servers: working
      }
    };

  } catch (error) {
    console.error("Error en API Episode:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Error al obtener los servidores de video"
    });
  }
});
