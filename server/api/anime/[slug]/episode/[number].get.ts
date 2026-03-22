import { getEpisode } from "animeflv-scraper";

export default defineCachedEventHandler(async (event) => {
  const apiKey = getHeader(event, "x-api-key");
  if (apiKey !== process.env.API_KEY) {
    throw createError({ statusCode: 401 });
  }

  setHeader(event, "Access-Control-Allow-Origin", "*");
  setHeader(event, "Access-Control-Allow-Methods", "GET,OPTIONS");
  setHeader(event, "Access-Control-Allow-Headers", "*");

  if (event.method === "OPTIONS") return;

  const { slug, number } = getRouterParams(event) as { slug: string, number: string };

  const episode = await getEpisode(slug, Number(number)).catch(() => null);

  if (!episode) {
    throw createError({ statusCode: 404 });
  }

  // 🔥 RESOLVER REALISTA
  const resolveServers = (servers: any[]) => {
    return servers.map((server: any) => {
      const embed = server?.embed || "";
      const download = server?.download || "";

      let type = "embed";
      let stream = null;

      if (embed.includes(".m3u8") || download.includes(".m3u8")) {
        type = "hls";
        stream = embed || download;
      } else if (embed.includes(".mp4") || download.includes(".mp4")) {
        type = "mp4";
        stream = embed || download;
      }

      return {
        name: server?.name,
        type,
        stream,
        embed
      };
    });
  };

  let servers = resolveServers(episode.servers || []);

  // 🔥 FILTRAR BASURA
  servers = servers.filter((s) => s.stream || s.embed);

  // 🔥 ORDEN PRIORIDAD
  servers.sort((a, b) => {
    const priority = { hls: 1, mp4: 2, embed: 3 };
    return priority[a.type] - priority[b.type];
  });

  // 🔥 UNIQUE
  const unique = Array.from(
    new Map(servers.map((s) => [s.name + s.stream, s])).values()
  );

  return {
    success: true,
    total: unique.length,
    data: {
      title: episode.title,
      number: episode.number,
      servers: unique
    }
  };
});
