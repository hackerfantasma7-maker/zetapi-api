import { getEpisode } from "animeflv-scraper";

// ==========================================
// 🛠️ UTILIDADES DE DETECCIÓN Y LIMPIEZA
// ==========================================

export function detectServer(url: string): string {
  if (!url) return "unknown";
  const u = url.toLowerCase();

  if (u.includes("streamwish") || u.includes("awish")) return "streamwish";
  if (u.includes("filemoon") || u.includes("fmoon")) return "filemoon";
  if (u.includes("streamtape")) return "streamtape";
  if (u.includes("mp4upload")) return "mp4upload";
  if (u.includes("dood")) return "doodstream";
  if (u.includes("ok.ru") || u.includes("okru")) return "okru";
  if (u.includes("voe.sx")) return "voe";
  if (u.includes("yourupload")) return "yourupload";
  if (u.includes("mixdrop")) return "mixdrop";
  if (u.includes("reproductor") || u.includes("sfast")) return "faststream";

  return "external";
}

function isBadEmbed(url: string): boolean {
  if (!url) return true;
  const u = url.toLowerCase();
  return (
    u.startsWith("data:") || u.includes(".jpg") || u.includes(".png") ||
    u.includes(".gif") || u.includes("ads") || u.includes("doubleclick") ||
    u.includes(".js") || u.includes(".css") || u.includes("track") ||
    u.includes("google") || u.includes("banner")
  );
}

function isLikelyVideo(url: string): boolean {
  const u = url.toLowerCase();
  return (
    u.includes("embed") || u.includes("stream") || u.includes("player") ||
    u.includes(".m3u8") || u.includes(".mp4")
  );
}

export function cleanLinks(links: string[]) {
  return links
    .filter(l => !isBadEmbed(l) && isLikelyVideo(l))
    .map(l => ({
      name: detectServer(l),
      embed: l
    }));
}

// Headers para evitar bloqueos básicos
const myHeaders = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Referer': 'https://google.com'
};

// ==========================================
// 🇯🇵 FUENTES: SUBTITULADO / JAPONÉS
// ==========================================

export async function getAnimeFLVServers(slug: string, number: number) {
  try {
    const res = await getEpisode(slug, number);
    return (res?.servers || []).map((s: any) => ({
      name: detectServer(s.url || s.embed),
      embed: s.url || s.embed
    }));
  } catch { return []; }
}

export async function getJKAnimeServers(slug: string, number: number) {
  try {
    const html: string = await $fetch(`https://jkanime.net/${slug}/${number}/`, { headers: myHeaders });
    const links = html.match(/https?:\/\/[^"]+/g) || [];
    return cleanLinks(links);
  } catch { return []; }
}

export async function getGogoServers(query: string, number: number) {
  try {
    const html: string = await $fetch(`https://anitaku.to/${query}-episode-${number}`, { headers: myHeaders });
    const links = html.match(/https?:\/\/[^"]+/g) || [];
    return cleanLinks(links);
  } catch { return []; }
}

// ==========================================
// 🇲🇽 FUENTES: LATINO / SPANISH
// ==========================================

export async function getTioAnimeServers(query: string, number: number) {
  try {
    const search: string = await $fetch(`https://tioanime.com/buscar?q=${query}`, { headers: myHeaders });
    const match = search.match(/href="\/anime\/([^"]+)"/);
    if (!match) return [];
    const html: string = await $fetch(`https://tioanime.com/ver/${match[1]}-${number}`, { headers: myHeaders });
    const iframe = html.match(/<iframe[^>]+src="([^"]+)"/);
    return iframe ? [{ name: detectServer(iframe[1]), embed: iframe[1] }] : [];
  } catch { return []; }
}

export async function getMonosChinosServers(query: string, number: number) {
  try {
    const search: string = await $fetch(`https://www.monoschinos2.net/search?q=${query}-latino`, { headers: myHeaders });
    const match = search.match(/href="\/anime\/([^"]+)"/);
    if (!match) return [];
    const html: string = await $fetch(`https://www.monoschinos2.net/ver/${match[1]}-episodio-${number}`, { headers: myHeaders });
    const videoData = html.match(/var\s+videos\s*=\s*([^;]+)/);
    if (videoData) {
      return JSON.parse(videoData[1]).map((v: any) => ({ name: detectServer(v.url), embed: v.url }));
    }
    return [];
  } catch { return []; }
}

export async function getAnimeIDServers(query: string, number: number) {
  try {
    const search: string = await $fetch(`https://www.animeid.tv/buscar?q=${query}`, { headers: myHeaders });
    const match = search.match(/href="\/([^"]+)"/);
    if (!match) return [];
    const html: string = await $fetch(`https://www.animeid.tv/v/${match[1]}-${number}`, { headers: myHeaders });
    const iframe = html.match(/<iframe[^>]+src="([^"]+)"/);
    return iframe ? [{ name: detectServer(iframe[1]), embed: iframe[1] }] : [];
  } catch { return []; }
}

export async function getAnimeLHDServers(query: string, number: number) {
  try {
    const searchUrl = `https://animelhd.com/?s=${encodeURIComponent(query + " latino")}`;
    const html: string = await $fetch(searchUrl, { headers: myHeaders });
    const match = html.match(/href="(https:\/\/animelhd\.com\/anime\/[^"]+)"/);
    if (!match) return [];
    const epUrl = `${match[1].replace(/\/$/, "")}-episodio-${number}`;
    const epHtml: string = await $fetch(epUrl, { headers: myHeaders });
    const links = epHtml.match(/https?:\/\/[^"]+/g) || [];
    return cleanLinks(links);
  } catch { return []; }
}
