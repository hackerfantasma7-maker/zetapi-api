import { getEpisode } from "animeflv-scraper";

// 🔹 detectar nombre real del server
function detectServer(url: string) {
  if (!url) return "unknown";

  if (url.includes("streamtape")) return "streamtape";
  if (url.includes("filemoon")) return "filemoon";
  if (url.includes("mp4upload")) return "mp4upload";
  if (url.includes("dood")) return "doodstream";
  if (url.includes("ok.ru")) return "okru";

  return "external";
}

// 🔹 eliminar basura real (SIN romper)
function isBadEmbed(url: string) {
  return (
    !url ||
    url.startsWith("data:") ||
    url.includes(".dtd") ||
    url.includes("schema") ||
    url.includes("pdf")
  );
}

// 🔹 ANIMEFLV (estable)
export async function getAnimeFLVServers(slug: string, number: number) {
  try {
    const res = await getEpisode(slug, number);

    return (res?.servers || []).map((s: any) => ({
      name: detectServer(s.url || s.embed),
      embed: s.url || s.embed
    }));
  } catch {
    return [];
  }
}

// 🔹 JKANIME (scraping mejorado)
export async function getJKAnimeServers(slug: string, number: number) {
  try {
    const url = `https://jkanime.net/${slug}/${number}/`;
    const html = await $fetch(url);

    const matches = html.match(/https?:\/\/[^"]+/g) || [];

    return matches
      .filter((link: string) => !isBadEmbed(link))
      .map((link: string) => ({
        name: detectServer(link),
        embed: link
      }));
  } catch {
    return [];
  }
}

// 🔹 ANIMELHD (latino)
export async function getAnimeLHDServers(query: string) {
  try {
    const html = await $fetch(`https://animelhd.com/?s=${encodeURIComponent(query)}`);
    const links = html.match(/https?:\/\/[^"]+/g) || [];

    return links
      .filter((link: string) => !isBadEmbed(link))
      .map((link: string) => ({
        name: detectServer(link),
        embed: link
      }));
  } catch {
    return [];
  }
}

// 🔹 MONOSCHINOS (inestable)
export async function getMonosChinosServers(query: string) {
  try {
    const html = await $fetch(`https://monoschinos2.com/search/${query}`);
    const links = html.match(/https?:\/\/[^"]+/g) || [];

    return links
      .filter((link: string) => !isBadEmbed(link))
      .map((link: string) => ({
        name: detectServer(link),
        embed: link
      }));
  } catch {
    return [];
  }
}
