export default {
  async fetch(request: Request) {

    const url = new URL(request.url);
    const target = url.searchParams.get("url");

    if (!target) {
      return new Response("URL requerida", { status: 400 });
    }

    try {

      const res = await fetch(target, {
        method: "GET",
        redirect: "follow",
        headers: {
          // 🔥 Simulación real de navegador
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",

          "Accept":
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",

          "Accept-Language": "en-US,en;q=0.9",

          "Accept-Encoding": "identity",

          // 🔥 CLAVE para evitar bloqueos
          "Referer": target,
          "Origin": new URL(target).origin,

          // 🔥 headers tipo navegador real
          "Sec-Fetch-Dest": "iframe",
          "Sec-Fetch-Mode": "navigate",
          "Sec-Fetch-Site": "same-origin",
          "Sec-Fetch-User": "?1",

          "Upgrade-Insecure-Requests": "1",

          // algunos servers requieren esto
          "Connection": "keep-alive",
        }
      });

      // 🔥 copiar headers importantes
      const headers = new Headers();

      headers.set(
        "Content-Type",
        res.headers.get("content-type") || "text/html"
      );

      headers.set("Access-Control-Allow-Origin", "*");
      headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
      headers.set("Access-Control-Allow-Headers", "*");

      // 🔥 evitar bloqueos por X-Frame
      headers.delete("x-frame-options");
      headers.delete("content-security-policy");

      return new Response(res.body, {
        status: res.status,
        headers
      });

    } catch (err) {
      return new Response("Error en proxy", { status: 500 });
    }
  }
};
