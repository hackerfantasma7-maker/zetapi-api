export async function filterWorkingServers(servers: any[]) {
  return servers.filter(s => s.embed && s.embed.startsWith("http"));
}
