import { getAnimeInfo } from "animeflv-scraper";

export default defineCachedEventHandler(async (event) => {

  const { slug } = getRouterParams(event);
  const { lang } = getQuery(event) as { lang?: string };

  if (!lang || lang === "sub") {
    const info = await getAnimeInfo(slug).catch(() => null);

    if (!info) {
      throw createError({ statusCode: 404, message: "Anime no encontrado" });
    }

    return {
      success: true,
      lang: "sub",
      data: info
    };
  }

  if (lang === "latino") {
    const html = await $fetch<string>(`https://monoschinos2.com/anime/${slug}`, {
      headers: { "User-Agent": "Mozilla/5.0" }
    });

    const title = html.match(/<h1.*?>(.*?)<\/h1>/)?.[1] || slug;
    const cover = html.match(/<img.*?src="(.*?)"/)?.[1] || "";

    return {
      success: true,
      lang: "latino",
      data: { title, cover }
    };
  }

});
