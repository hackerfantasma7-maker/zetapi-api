// =====================
// 🔥 MAIN CON 3 IDIOMAS
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
  // 1️⃣ SUBTITULADO (Standard)
  // =====================
  if (lang === "sub") {
    const core = await Promise.all([
      getAnimeFLVServers(slug, number),
      getJKAnimeServers(slug, number),
      getTioAnimeServers(title, number) // TioAnime suele ser muy estable en subs
    ]);

    servers.push(...core.flat());

    // Fallback si hay pocos servidores
    if (servers.length < 3) {
      for (const v of variants) {
        const fallback = await Promise.all([
          getAnimeFenixServers(v, number),
          getAnimeIDServers(v, number)
        ]);
        servers.push(...fallback.flat());
        if (servers.length > 5) break;
      }
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
