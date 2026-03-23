import { getEpisode } from "animeflv-scraper";

// ==========================================
// 🛠️ UTILIDADES DE DETECCIÓN Y LIMPIEZA
// ==========================================

export function detectServer(url: string): string {
  if (!url) return "unknown";
  const u = url.toLowerCase();

  if (u.includes("streamwish") || u.includes("awish")) return "streamwish";
  if (u.includes("filemoon") || u.includes("fmoon")) return "filemoon";
  if (u.includes("voe.sx")) return "voe";
  if (u.includes("mixdrop")) return "mixdrop";
  if (u.includes("reproductor") || u.includes("sfast")) return "faststream";
  if (u.includes("streamtape")) return "streamtape";
  if (u.includes("mp4upload")) return "mp4upload";
  if (u.includes("dood")) return "doodstream";
  if (u.includes("ok.ru") || u.includes("okru")) return "okru";
  if (u.includes("yourupload")) return "yourupload";

  return "external";
}

function isBadEmbed(url: string): boolean {
  if (!url) return true;
  const u = url.toLowerCase();
  return (
    u.startsWith("data:") || u.includes(".jpg") || u.includes(".png") ||
    u.includes(".gif") || u.includes("ads") || u.includes("doubleclick") ||
    u.includes(".js") || u.includes(".css") || u.includes("track") || u.includes("google")
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
    const html = await $fetch(`https://jkanime.net/${slug}/${number}/`);
    const links = html.match(/https?:\/\/[^"]+/g) || [];
    return cleanLinks(links);
  } catch { return []; }
}

export async function getGogoServers(query: string, number: number) {
  try {
    // Nota: Gogoanime suele requerir el slug-episodio-number directamente
    const html = await $fetch(`https://gogoanime3.co/${query}-episode-${number}`);
    const links = html.match(/https?:\/\/[^"]+/g) || [];
    return cleanLinks(links);
  } catch { return []; }
}

export async function getHiAnimeServers(query: string) {
  try {
    const html = await $fetch(`https://hianime.to/search?keyword=${query}`);
    const links = html.match(/https?:\/\/[^"]+/g) || [];
    return cleanLinks(links);
  } catch { return []; }
}

// ==========================================
// 🇲🇽 FUENTES: LATINO / SPANISH
// ==========================================

export async function getTioAnimeServers(query: string, number: number) {
  try {
    const search = await $fetch(`https://tioanime.com/buscar?q=${query}`);
    const match = search.match(/href="\/anime\/([^"]+)"/);
    if (!match) return [];
    const html = await $fetch(`https://tioanime.com/ver/${match[1]}-${number}`);
    const iframe = html.match(/<iframe[^>]+src="([^"]+)"/);
    return iframe ? [{ name: detectServer(iframe[1]), embed: iframe[1] }] : [];
  } catch { return []; }
}

export async function getMonosChinosServers(query: string, number: number) {
  try {
    const search = await $fetch(`https://monoschinos2.com/search/${query}-latino`);
    let match = search.match(/href="\/anime\/([^"]+latino[^"]*)"/i) || search.match(/href="\/anime\/([^"]+)"/);
    if (!match) return [];
    const html = await $fetch(`https://monoschinos2.com/ver/${match[1]}-episodio-${number}`);
    const videoData = html.match(/var\s+videos\s*=\s*([^;]+)/);
    if (videoData) {
      return JSON.parse(videoData[1]).map((v: any) => ({ name: detectServer(v.url), embed: v.url }));
    }
    return [];
  } catch { return []; }
}

export async function getAnimeIDServers(query: string, number: number) {
  try {
    const search = await $fetch(`https://www.animeid.tv/buscar?q=${query}`);
    const match = search.match(/href="\/([^"]+)"/);
    if (!match) return [];
    const html = await $fetch(`https://www.animeid.tv/v/${match[1]}-${number}`);
    const links = html.match(/https?:\/\/[^"]+/g) || [];
    return cleanLinks(links);
  } catch { return []; }
}

export async function getAnimeFenixServers(query: string, number: number) {
  try {
    const search = await $fetch(`https://animefenix.tv/buscar?q=${query}`);
    const match = search.match(/href="https:\/\/animefenix\.tv\/anime\/([^"]+)"/);
    if (!match) return [];
    const html = await $fetch(`https://animefenix.tv/ver/${match[1]}-${number}`);
    const links = html.match(/https?:\/\/[^"]+/g) || [];
    return cleanLinks(links);
  } catch { return []; }
}

export async function getAnimeLHDServers(query: string, number: number) {
  try {
    const searchUrl = `https://animelhd.com/?s=${encodeURIComponent(query + " latino")}`;
    const html = await $fetch(searchUrl);
    const match = html.match(/href="(https:\/\/animelhd\.com\/anime\/[^"]+)"/);
    if (!match) return [];
    const epHtml = await $fetch(`${match[1].replace(/\/$/, "")}-episodio-${number}`);
    const links = epHtml.match(/https?:\/\/[^"]+/g) || [];
    return cleanLinks(links);
  } catch { return []; }
}
  try {
    // AnimeLHD es casi todo latino, pero aseguramos la búsqueda
    const searchUrl = `https://animelhd.com/?s=${encodeURIComponent(query + " latino")}`;
    const html = await $fetch(searchUrl);
    
    // Buscamos el link del post
    const match = html.match(/href="(https:\/\/animelhd\.com\/anime\/[^"]+)"/);
    if (!match) return [];

    const animeUrl = match[1];
    // Generamos la URL del episodio (ajusta según la estructura de la web)
    const epUrl = `${animeUrl.replace(/\/$/, "")}-episodio-${number}`;
    const epHtml = await $fetch(epUrl);

    const links = epHtml.match(/https?:\/\/[^"]+/g) || [];
    return cleanLinks(links);
  } catch {
    return [];
  }
}
    u.includes("doubleclick") ||
    u.includes(".css") ||
    u.includes(".js") ||
    u.includes("json") ||
    u.includes("track")
  );
}

function isLikelyVideo(url: string) {
  const u = url.toLowerCase();

  return (
    u.includes("embed") ||
    u.includes("stream") ||
    u.includes("player") ||
    u.includes(".m3u8") ||
    u.includes(".mp4")
  );
}

function cleanLinks(links: string[]) {
  return links
    .filter(l => !isBadEmbed(l))
    .filter(l => isLikelyVideo(l))
    .map(l => ({
      name: detectServer(l),
      embed: l
    }));
}

// =====================
// 🔥 JAPONES
// =====================

// AnimeFLV
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

// JKAnime
export async function getJKAnimeServers(slug: string, number: number) {
  try {
    const html = await $fetch(`https://jkanime.net/${slug}/${number}/`);
    const links = html.match(/https?:\/\/[^"]+/g) || [];
    return cleanLinks(links);
  } catch {
    return [];
  }
}

// Gogoanime
export async function getGogoServers(query: string) {
  try {
    const html = await $fetch(`https://gogoanime.pe/search.html?keyword=${query}`);
    const links = html.match(/https?:\/\/[^"]+/g) || [];
    return cleanLinks(links);
  } catch {
    return [];
  }
}

// Hianime
export async function getHiAnimeServers(query: string) {
  try {
    const html = await $fetch(`https://hianime.tv/search?keyword=${query}`);
    const links = html.match(/https?:\/\/[^"]+/g) || [];
    return cleanLinks(links);
  } catch {
    return [];
  }
}

// AnimeFenix
export async function getAnimeFenixSearch(query: string) {
  try {
    const html = await $fetch(`https://animefenix.com/search?q=${query}`);
    const links = html.match(/https?:\/\/[^"]+/g) || [];
    return cleanLinks(links);
  } catch {
    return [];
  }
}

// =====================
// 🔥 LATINO REAL (EPISODIO)
// =====================

// 🔥 TIOANIME (CORRECTO)
export async function getTioAnimeServers(query: string, number: number) {
  try {
    const search = await $fetch(`https://tioanime.com/buscar?q=${query}`);

    const match = search.match(/href="\/anime\/([^"]+)"/);
    if (!match) return [];

    const slug = match[1];

    const epUrl = `https://tioanime.com/ver/${slug}-${number}`;
    const html = await $fetch(epUrl);

    const iframe = html.match(/<iframe[^>]+src="([^"]+)"/);
    if (!iframe) return [];

    return [{
      name: detectServer(iframe[1]),
      embed: iframe[1]
    }];

  } catch {
    return [];
  }
}


// 🔥 ANIMEID
export async function getAnimeIDServers(query: string, number: number) {
  try {
    const search = await $fetch(`https://animeid.tv/?s=${query}`);

    const match = search.match(/href="https:\/\/animeid\.tv\/([^"]+)"/);
    if (!match) return [];

    const slug = match[1];

    const epUrl = `https://animeid.tv/${slug}/${number}`;
    const html = await $fetch(epUrl);

    const iframe = html.match(/<iframe[^>]+src="([^"]+)"/);
    if (!iframe) return [];

    return [{
      name: detectServer(iframe[1]),
      embed: iframe[1]
    }];

  } catch {
    return [];
  }
}


// 🔥 ANIMEFENIX (MEJORADO)
export async function getAnimeFenixServers(query: string, number: number) {
  try {
    const search = await $fetch(`https://animefenix.com/search?q=${query}`);

    const match = search.match(/href="\/anime\/([^"]+)"/);
    if (!match) return [];

    const slug = match[1];

    const epUrl = `https://animefenix.com/ver/${slug}/${number}`;
    const html = await $fetch(epUrl);

    const iframe = html.match(/<iframe[^>]+src="([^"]+)"/);
    if (!iframe) return [];

    return [{
      name: detectServer(iframe[1]),
      embed: iframe[1]
    }];

  } catch {
    return [];
  }
}


// 🔥 MONOSCHINOS (LIMITADO PERO FUNCIONAL)
export async function getMonosChinosServers(query: string, number: number) {
  try {
    const search = await $fetch(`https://monoschinos2.com/search/${query}`);

    const match = search.match(/href="\/ver\/([^"]+)"/);
    if (!match) return [];

    const slug = match[1];

    const epUrl = `https://monoschinos2.com/ver/${slug}-${number}`;
    const html = await $fetch(epUrl);

    const iframe = html.match(/<iframe[^>]+src="([^"]+)"/);
    if (!iframe) return [];

    return [{
      name: detectServer(iframe[1]),
      embed: iframe[1]
    }];

  } catch {
    return [];
  }
}


// 🔥 ANIMELHD (fallback simple)
export async function getAnimeLHDServers(query: string, number: number) {
  try {
    const html = await $fetch(`https://animelhd.com/?s=${encodeURIComponent(query)}`);
    const links = html.match(/https?:\/\/[^"]+/g) || [];

    return cleanLinks(links);
  } catch {
    return [];
  }
}
