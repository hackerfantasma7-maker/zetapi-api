import { getEpisodeServers } from "animeflv-scraper";

export default defineCachedEventHandler(async (event) => {

  const { slug } = getRouterParams(event);
  const { lang } = getQuery(event) as { lang?: string };

  let servers;

  if (!lang || lang === "sub") {
    servers = await getEpisodeServers(slug);
  }

  if (lang === "latino") {
    const html = await $fetch<string>(`https://monoschinos2.com/ver/${slug}`, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept": "text/html",
      }
    });

    servers = [];

    const base64Match = html.match(/atob\("(.*?)"\)/);

    if (base64Match) {
      try {
        servers.push({
          name: "latino",
          embed: atob(base64Match[1])
        });
      } catch {}
    }

    const iframeRegex = /<iframe.*?src="(.*?)"/g;
    let match;

    while ((match = iframeRegex.exec(html)) !== null) {
      servers.push({ name: "latino", embed: match[1] });
    }
  }

  if (!servers || servers.length === 0) {
    throw createError({ statusCode: 404, message: "No servers" });
  }

  return {
    success: true,
    lang: lang || "sub",
    data: servers
  };

}, { maxAge: 1800 });
