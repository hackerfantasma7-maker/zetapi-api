import { getEpisode } from "animeflv-scraper";

export default defineCachedEventHandler(async (event) => {
  // 🔐 API KEY
  const apiKey = getHeader(event, "x-api-key");
  if (apiKey !== process.env.API_KEY) {
    throw createError({ statusCode: 401 });
  }

  // 🌐 CORS
  setHeader(event, "Access-Control-Allow-Origin", "*");
  setHeader(event, "Access-Control-Allow-Methods", "GET,OPTIONS");
  setHeader(event, "Access-Control-Allow-Headers", "*");

  if (event.method === "OPTIONS") return;

  const { slug } = getRouterParams(event) as { slug: string };

  const fetchHTML = async (url: string) => {
    try {
      return await $fetch<string>(url, {
        headers: { "user-agent": "Mozilla/5.0" }
      });
    } catch {
      return null;
    }
  };

  // 🔥 BASE (AnimeFLV)
  const base = await getEpisode(slug).catch(() => null);

  // 🔥 EXTRAER NÚMERO DESDE SLUG
  const numberMatch = slug.match(/(\d+)$/);
  const number = numberMatch ? Number(numberMatch[1]) : null;

  // 🔥 MONOSCHINOS
  const monos = await (async () => {
    try {
      if (!number) return [];
      const cleanSlug = slug.replace(/-\d+$/, "");
      const url = `https://monoschinos2.com/ver/${cleanSlug}-${number}`;
      const html = await fetchHTML(url);
      if (!html) return [];

      const matches = [...html.matchAll(/iframe.*?src="(.*?)"/g)];

      return matches.map((m) => ({
        name: "monoschinos",
        embed: m[1]
      }));
    } catch {
      return [];
    }
  })();

  // 🔥 GOGOANIME
  const gogo = await (async () => {
    try {
      if (!number) return [];
      const cleanSlug = slug.replace(/-\d+$/, "");
      const url = `https://gogoanime3.co/${cleanSlug}-episode-${number}`;
      const html = await fetchHTML(url);
      if (!html) return [];

      const matches = [...html.matchAll(/iframe.*?src="(.*?)"/g)];

      return matches.map((m) => ({
        name: "gogoanime",
        embed: m[1]
      }));
    } catch {
      return [];
    }
  })();

  // 🔥 UNIFICAR
  const allServers = [
    ...(base?.servers || []),
    ...monos,
    ...gogo
  ];

  // 🔥 RESOLVER
  let servers = allServers.map((server: any) => {
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

  // 🔥 LIMPIAR
  servers = servers.filter((s) => s.stream || s.embed);

  // 🔥 ORDENAR
  const priority: any = { hls: 1, mp4: 2, embed: 3 };
  servers.sort((a, b) => priority[a.type] - priority[b.type]);

  // 🔥 UNIQUE
  const unique = Array.from(
    new Map(servers.map((s) => [s.name + s.stream, s])).values()
  );

  return {
    success: true,
    total: unique.length,
    data: {
      title: base?.title || slug,
      number,
      servers: unique
    }
  };
});
