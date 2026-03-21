import { getEpisode } from "animeflv-scraper";

export default defineCachedEventHandler(async (event) => {
  // --- LIBERACIÓN DE CORS ---
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

  const { slug, number } = getRouterParams(event) as { slug: string, number: string };
  
  try {
    const episode = await getEpisode(slug, Number(number));
    
    if (!episode) {
      throw createError({
        statusCode: 404,
        message: "No se ha encontrado el episodio",
        data: { success: false, error: "No se ha encontrado el episodio" }
      });
    }
    
    return { success: true, data: episode };
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || "Error al obtener episodio",
    });
  }
}, {
  swr: false,
  maxAge: 86400,
  name: "episode",
  group: "anime",
  getKey: (event) => {
    const { slug, number } = getRouterParams(event) as { slug: string, number: string };
    return `${slug}-${number}`;
  }
});

defineRouteMeta({
  openAPI: {
    tags: ["Anime"],
    summary: "Episodio por Slug y Número",
    description: "Obtiene un episodio especificado por \"slug\" y \"number\".",
    parameters: [
      {
        name: "slug",
        in: "path",
        summary: "Slug que identifica el anime.",
        example: "boruto-naruto-next-generations-tv",
        required: true,
        schema: { type: "string" }
      },
      {
        name: "number",
        in: "path",
        summary: "Número de episodio.",
        example: 65,
        required: true,
        schema: { type: "number" }
      }
    ],
    responses: {
      200: {
        description: "Retorna información del episodio...",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: true },
                data: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    number: { type: "number" },
                    servers: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          name: { type: "string" },
                          download: { type: "string" },
                          embed: { type: "string" }
                        },
                        required: ["name"]
                      }
                    }
                  },
                  required: ["title", "number", "servers"]
                }
              },
              required: ["success", "data"]
            }
          }
        }
      },
      404: { description: "No se ha encontrado el episodio." }
    }
  }
});
