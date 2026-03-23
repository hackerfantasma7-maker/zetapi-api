import { getEpisode } from "animeflv-scraper";

// =====================
// 🛠️ UTILIDADES DE FILTRADO Y DETECCIÓN
// =====================
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
    base.replace(/ /g, "_"),
    `${base}-latino`,
    base.replace("season", ""),
    base.replace(/\d+/g, "")
  ];
}

// =====================
// 🇯🇵 FUENTES JAPONÉS / SUB (AnimeFLV, JK, Gogo)
// =====================
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

export async function getGogoServers(slug: string, number: number) {
  try {
    const html = await $fetch(`https://gogoanime.pe/search.html?keyword=${slug}`);
    const links = html.match(/https?:\/\/[^"]+/g) || [];
    return cleanLinks(links);
  } catch { return []; }
}

// =====================
// 🇲🇽 FUENTES LATINO (TioAnime, MonosChinos, LHD)
// =====================
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

// =====================
// 🚀 FUNCIÓN PRINCIPAL ORQUESTADORA
// =====================
export async function getAllServers({ slug, number, title, lang }: any) {
  let servers: any[] = [];
  const variants = generateVariants(title);

  // 1. Lógica para SUBTITULADO
  if (lang === "sub") {
    const core = await Promise.all([
      getAnimeFLVServers(slug, number),
      getJKAnimeServers(slug, number),
      getTioAnimeServers(title, number)
    ]);
    servers.push(...core.flat());
  }

  // 2. Lógica para LATINO / SPANISH
  else if (lang === "latino" || lang === "spanish") {
    const core = await Promise.all([
      getMonosChinosServers(title, number),
      getTioAnimeServers(`${title} latino`, number)
    ]);
    servers.push(...core.flat());
    
    // Fallback con variantes si no hay servidores
    if (servers.length < 2) {
      for (const v of variants) {
        const fb = await getMonosChinosServers(v, number);
        if (fb.length > 0) { servers.push(...fb); break; }
      }
    }
  }

  // 3. Lógica para JAPONÉS (Raw/Global)
  else if (lang === "jp" || lang === "japanese") {
    const core = await getGogoServers(slug, number);
    servers.push(...core);
  }

  // Limpiar duplicados por URL de embed
  const unique = Array.from(
    new Map(servers.filter(s => s?.embed).map(s => [s.embed, s])).values()
  );

  // Ordenar por prioridad (JKAnime y Streamwish primero)
  return unique.sort((a, b) => {
    if (a.embed.includes("jkanime")) return -1;
    if (a.name === "streamwish") return -1;
    return 0;
  });
}
  }

  // =====================
  // 2️⃣ LATINO / SPANISH
  // =====================
  if (lang === "latino" || lang === "spanish") {
    // Priorizamos fuentes que se especializan en Doblaje
    const core = await Promise.all([
      getAnimeLHDServers(slug, number), // Muy bueno para Latino
      getMonosChinosServers(slug, number)
    ]);

    servers.push(...core.flat());

    // Fallback para latino usando variantes
    if (servers.length < 2) {
      for (const v of variants) {
        const fallback = await Promise.all([
          getAnimeFenixServers(v, number), // Fenix a veces tiene opción doblada
          getAnimeIDServers(v, number)
        ]);
        servers.push(...fallback.flat());
        if (servers.length > 4) break;
      }
    }
  }

  // =====================
  // 3️⃣ JAPONÉS (Audio Original / Global)
  // =====================
  if (lang === "jp" || lang === "japanese") {
    // Usamos fuentes globales que suelen tener el audio original más limpio
    const core = await Promise.all([
      getGogoServers(slug, number),
      getHiAnimeServers(slug, number)
    ]);

    servers.push(...core.flat());
  }

  // =====================
  // 🔥 LIMPIAR DUPLICADOS Y FILTRAR
  // =====================
  const unique = Array.from(
    new Map(
      servers
        .filter(s => s?.embed && s.embed.trim() !== "") // Evita embeds vacíos
        .map(s => [s.embed, s])
    ).values()
  );

  // =====================
  // 🔥 ORDENAR Y RETORNAR
  // =====================
  return sortServers(unique);
}
    if (a.embed?.includes("jkanime")) return -1;
    if (b.embed?.includes("jkanime")) return 1;

    // 🥈 STREAMWISH
    if (a.name === "streamwish") return -1;
    if (b.name === "streamwish") return 1;

    // 🥉 OTROS
    const priority = ["filemoon", "streamtape"];

    return priority.indexOf(a.name) - priority.indexOf(b.name);
  });
}

// =====================
// 🔥 MAIN
// =====================
export async function getAllServers({
  slug,
  number,
  title,
  lang
}: any) {

  let servers: any[] = [];
  const variants = generateVariants(title);

  // =====================
  // 🔥 JAPONES
  // =====================
  if (lang === "sub") {
    const core = await Promise.all([
      getAnimeFLVServers(slug, number),
      getJKAnimeServers(slug, number)
    ]);

    servers.push(...core.flat());

    if (servers.length < 3) {
      for (const v of variants) {
        const fallback = await Promise.all([
          getGogoServers(v),
          getHiAnimeServers(v),
          getAnimeFenixServers(v, number)
        ]);

        servers.push(...fallback.flat());

        if (servers.length > 6) break;
      }
    }
  }

  // =====================
  // 🔥 LATINO
  // =====================
  if (lang === "latino") {

    const core = await Promise.all([
      getTioAnimeServers(title, number),
      getAnimeIDServers(title, number)
    ]);

    servers.push(...core.flat());

    if (servers.length < 3) {
      for (const v of variants) {
        const fallback = await Promise.all([
          getAnimeFenixServers(v, number),
          getMonosChinosServers(v, number),
          getAnimeLHDServers(v, number)
        ]);

        servers.push(...fallback.flat());

        if (servers.length > 6) break;
      }
    }
  }

  // =====================
  // 🔥 LIMPIAR DUPLICADOS
  // =====================
  const unique = Array.from(
    new Map(
      servers
        .filter(s => s?.embed)
        .map(s => [s.embed, s])
    ).values()
  );

  // =====================
  // 🔥 RETURN FINAL
  // =====================
  return sortServers(unique);
}
