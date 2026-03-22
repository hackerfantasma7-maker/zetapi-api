export default defineEventHandler(async (event) => {
  const apiKey = getHeader(event, "x-api-key");

  if (apiKey !== process.env.API_KEY) {
    throw createError({ statusCode: 401 });
  }

  setHeader(event, "Access-Control-Allow-Origin", "*");
  setHeader(event, "Access-Control-Allow-Methods", "POST,OPTIONS");
  setHeader(event, "Access-Control-Allow-Headers", "*");

  if (event.method === "OPTIONS") return;

  const body = await readBody(event);

  const { slug, number, title } = body || {};

  if (!slug) {
    throw createError({
      statusCode: 400,
      message: "Faltan datos"
    });
  }

  // 🔥 AQUÍ PUEDES CAMBIAR A DB (esto es básico)
  const request = {
    slug,
    number,
    title,
    createdAt: new Date().toISOString()
  };

  // ⚠️ ahora mismo solo devuelve (puedes luego guardar en DB)
  return {
    success: true,
    message: "Solicitud enviada",
    data: request
  };
});
