export async function filterWorkingServers(servers: any[]) {
  // 🔥 NO validar con fetch directo (rompe embeds)
  return servers.filter(s => s.embed && s.embed.startsWith("http"));
}
