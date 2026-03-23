import { getEpisode } from "animeflv-scraper";

// ==========================================
// 🛠️ UTILIDADES DE DETECCIÓN Y LIMPIEZA
// ==========================================

function detectServer(url: string): string {
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
    u.includes(".js") || u.includes(".css") || u.includes("track")
  );
}

function cleanLinks(links: string[]) {
  return links
    .filter(l => !isBadEmbed(l) && (l.includes("embed") || l.includes("stream") || l.includes(".m3u8") || l.includes(".mp4")))
    .map(l => ({
      name: detectServer(l),
      embed: l
    }));
}

function generateVariants(title: string) {
  const base = title.toLowerCase();
  return [
    base,
    base.replace(/ /g, "-"),
    `${base}-latino`,
    base.replace("season", ""),
  ];
}

function sortServers(servers: any[]) {
  return servers.sort((a, b) => {
    // 🥇 Prioridad 1: JKAnime
    if (a.embed?.includes("jkanime")) return -1;
    if (b.embed?.includes("jkanime")) return 1;
    // 🥈 Prioridad 2: Streamwish
    if (a.name === "streamwish") return -1;
    if (b.name === "streamwish") return 1;
    return 0;
  });
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
    const html: string = await $fetch(`https://jkanime.net/${slug}/${number}/`);
    const links = html.match(/https?:\/\/[^"]+/g) || [];
    return cleanLinks(links);
  } catch { return []; }
}

export async function getGogoServers(slug: string, number: number) {
  try {
    const html: string = await $fetch(`https://gogoanime3.co/search.html?keyword=${slug}`);
    const links = html.match(/https?:\/\/[^"]+/g) || [];
    return cleanLinks(links);
  } catch { return []; }
}

// ==========================================
// 🇲🇽 FUENTES: LATINO
// ==========================================

export async function getMonosChinosServers(query: string, number: number) {
  try {
    const search: string = await $fetch(`https://monoschinos2.com/search?q=${query}`);
    const match = search.match(/href="\/anime\/([^"]+)"/);
    if (!match) return [];
    const html: string = await $fetch(`https://monoschinos2.com/ver/${match[1]}-episodio-${number}`);
    const videoData = html.match(/var\s+videos\s*=\s*([^;]+)/);
    return videoData ? JSON.parse(videoData[1]).map((v: any) => ({ name: detectServer(v.url), embed: v.url })) : [];
  } catch { return []; }
}

export async function getTioAnimeServers(query: string, number: number) {
  try {
    const search: string = await $fetch(`https://tioanime.com/buscar?q=${query}`);
    const match = search.match(/href="\/anime\/([^"]+)"/);
    if (!match) return [];
    const html: string = await $fetch(`https://tioanime.com/ver/${match[1]}-${number}`);
    const links = html.match(/https?:\/\/[^"]+/g) || [];
    return cleanLinks(links);
  } catch { return []; }
}

// ==========================================
// 🚀 ORQUESTADOR ÚNICO (getAllServers)
// ==========================================

export async function getAllServers({ slug, number, title, lang }: any) {
  let servers: any[] = [];
  const variants = generateVariants(title || slug);

  // 1. LÓGICA SUBTITULADO
  if (lang === "sub") {
    const results = await Promise.all([
      getAnimeFLVServers(slug, number),
      getJKAnimeServers(slug, number)
    ]);
    servers.push(...results.flat());
  } 
  
  // 2. LÓGICA LATINO
  else if (lang === "latino" || lang === "spanish") {
    const results = await Promise.all([
      getMonosChinosServers(title || slug, number),
      getTioAnimeServers(`${title || slug} latino`, number)
    ]);
    servers.push(...results.flat());

    // Fallback con variantes si no hay resultados
    if (servers.length < 2) {
      for (const v of variants) {
        const fb = await getMonosChinosServers(v, number);
        if (fb.length > 0) { servers.push(...fb); break; }
      }
    }
  }

  // 3. LÓGICA JAPONÉS / GLOBAL
  else if (lang === "jp" || lang === "japanese") {
    servers = await getGogoServers(slug, number);
  }

  // 🔥 Limpiar duplicados por URL y ordenar
  const unique = Array.from(
    new Map(servers.filter(s => s?.embed).map(s => [s.embed, s])).values()
  );

  return sortServers(unique);
}
