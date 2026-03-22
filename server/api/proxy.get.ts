export default defineEventHandler(async (event) => {

  setResponseHeaders(event, {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "*",
  });

  if (getMethod(event) === "OPTIONS") {
    event.node.res.statusCode = 204;
    return "ok";
  }

  const { url } = getQuery(event);

  // 🔥 VALIDACIÓN FUERTE
  if (!url || typeof url !== "string") {
    throw createError({
      statusCode: 400,
      message: "URL requerida",
    });
  }

  try {

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Referer": "https://www.google.com/",
      },
    });

    // 🔥 SI EL SERVER FALLA, PROPAGAMOS STATUS
    if (!response.ok) {
      throw createError({
        statusCode: response.status,
        message: "Error al obtener recurso externo",
      });
    }

    const contentType = response.headers.get("content-type") || "text/html";

    // 🔥 IMPORTANTE: usar sendStream (mejor para Cloudflare)
    return sendStream(event, response.body as any, {
      headers: {
        "Content-Type": contentType,
        "Access-Control-Allow-Origin": "*",
      },
    });

  } catch (err: any) {
    throw createError({
      statusCode: err.statusCode || 500,
      message: err.message || "Error en proxy",
    });
  }

});
