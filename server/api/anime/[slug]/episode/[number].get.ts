import { getEpisodeServers } from "animeflv-scraper";

export default defineEventHandler(async (event) => {

  const { slug, number } = getRouterParams(event);
  const { lang } = getQuery(event) as { lang?: string };

  const episodeSlug = `${slug}-${number}`;

  if (!lang || lang === "sub") {
    const servers = await getEpisodeServers(episodeSlug);

    return { success: true, lang: "sub", data: servers };
  }

  if (lang === "latino") {
    const html = await $fetch<string>(`https://monoschinos2.com/ver/${episodeSlug}`, {
      headers: { "User-Agent": "Mozilla/5.0" }
    });

    const servers = [];
    const iframeRegex = /<iframe.*?src="(.*?)"/g;

    let match;
    while ((match = iframeRegex.exec(html)) !== null) {
      servers.push({ name: "latino", embed: match[1] });
    }

    return { success: true, lang: "latino", data: servers };
  }

});
