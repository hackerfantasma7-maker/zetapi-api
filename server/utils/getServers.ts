// 🔥 SOLO proxear si es necesario
function needsProxy(url: string) {
  return (
    url.includes("jkanime") ||
    url.includes("animelhd") ||
    url.includes("monoschinos")
  );
}

servers = servers.map(s => ({
  ...s,
  embed: needsProxy(s.embed)
    ? `/api/proxy?url=${encodeURIComponent(s.embed)}`
    : s.embed
}));

return Array.from(new Map(servers.map(s => [s.embed, s])).values());
