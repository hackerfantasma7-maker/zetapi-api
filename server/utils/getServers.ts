import {
  getAnimeFLVServers,
  getJKAnimeServers,
  getGogoServers,
  getHiAnimeServers,
  getAnimeFenixServers,
  getAnimeLHDServers,
  getMonosChinosServers,
  getTioAnimeServers,
  getAnimeIDServers
} from "./sources";

// =====================
// 🔥 VARIANTES
// =====================
function generateVariants(title: string) {
  const base = title.toLowerCase();

  return [
    base,
    base.replace(/ /g, "-"),
    base.replace(/ /g, "_"),
    base.replace("season", ""),
    base.replace("segunda temporada", ""),
    base.replace("2nd season", ""),
    base.replace(/\d+/g, "")
  ];
}

// =====================
// 🔥 PRIORIDAD
// =====================
function sortServers(servers: any[]) {
  return servers.sort((a, b) => {

    // 🥇 JKANIME
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
