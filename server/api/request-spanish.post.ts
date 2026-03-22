export default defineEventHandler(async (event) => {
  const apiKey = getHeader(event, "x-api-key");

  const envKey =
    process.env.API_KEY ||
    event.context.cloudflare?.env?.API_KEY;

  if (!envKey || apiKey !== envKey) {
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

  const request = {
    slug,
    number,
    title,
    createdAt: new Date().toISOString()
  };

  return {
    success: true,
    message: "Solicitud enviada",
    data: request
  };
});
