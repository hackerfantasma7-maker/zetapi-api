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

  if (!url) {
    throw createError({
      statusCode: 400,
      message: "URL requerida",
    });
  }

  try {

    const response = await fetch(url as string, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Referer": "https://www.google.com/"
      }
    });

    const contentType = response.headers.get("content-type") || "";

    return new Response(response.body, {
      headers: {
        "Content-Type": contentType,
        "Access-Control-Allow-Origin": "*",
      }
    });

  } catch (err) {
    throw createError({
      statusCode: 500,
      message: "Error en proxy",
    });
  }

});
