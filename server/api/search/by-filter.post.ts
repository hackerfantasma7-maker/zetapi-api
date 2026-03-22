export default defineEventHandler(async (event) => {

  setResponseHeaders(event, {
    "Access-Control-Allow-Origin": "*",
  });

  const body = await readBody(event);

  return {
    success: true,
    filters: body
  };
});
