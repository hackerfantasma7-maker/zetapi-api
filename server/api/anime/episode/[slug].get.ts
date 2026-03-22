import { getEpisode } from "animeflv-scraper";

export default defineCachedEventHandler(async (event) => {
  // 🔐 API KEY
  const apiKey = getHeader(event, "x-api-key");
  if (apiKey !== process.env.API_KEY) {
    throw createError({
      statusCode: 401,
      message: "Unauthorized",
      data: { success: false, error: "Invalid API KEY" }
    });
  }

  // 🌐 CORS
  setHeader(event, "Access-Control-Allow-Origin", "*");
  setHeader(event, "Access-Control-Allow-Methods", "GET,OPTIONS");
  setHeader(event, "Access-Control-Allow-Headers", "*");

  if (event.method === "OPTIONS") return;

  const { slug, number } = getRouterParams(event) as { slug: string, number: string };

  const episode = await getEpisode(slug, Number(number));

  if (!episode) {
    throw createError({
      statusCode: 404,
      message: "No se ha encontrado el episodio",
      data: { success: false, error: "No se ha encontrado el episodio" }
    });
  }

  // 🔥 NORMALIZACIÓN PARA TU PLAYER
  const normalizedServers = (episode.servers || []).map((server: any) => {
    const embed = server?.embed || "";
    const download = server?.download || "";

    let type = "embed";

    if (embed.includes(".m3u8") || download.includes(".m3u8")) {
      type = "hls";
    } else if (embed.includes(".mp4") || download.includes(".mp4")) {
      type = "mp4";
    }

    return {
      name: server?.name,
      type,
      embed,
      download,
      stream:
        type === "hls"
          ? embed || download
          : type === "mp4"
          ? embed || download
          : null
    };
  });

  // 🔥 ORDENAR (MEJOR EXPERIENCIA)
  const sortedServers = [
    ...normalizedServers.filter((s: any) => s.type === "hls"),
    ...normalizedServers.filter((s: any) => s.type === "mp4"),
    ...normalizedServers.filter((s: any) => s.type === "embed")
  ];

  // 🔥 ELIMINAR DUPLICADOS
  const uniqueServers = Array.from(
    new Map(sortedServers.map((s: any) => [s.name + s.stream, s])).values()
  );

  return {
    success: true,
    totalServers: uniqueServers.length,
    data: {
      title: episode.title,
      number: episode.number,
      servers: uniqueServers
    }
  };
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
    summary: "Episodio optimizado para player",
    description: "Obtiene episodio con servidores normalizados (hls/mp4/embed)",
    parameters: [
      {
        name: "slug",
        in: "path",
        required: true,
        schema: { type: "string" }
      },
      {
        name: "number",
        in: "path",
        required: true,
        schema: { type: "number" }
      }
    ],
    responses: {
      200: {
        description: "Servidores listos para reproducción en player"
      }
    }
  }
});
