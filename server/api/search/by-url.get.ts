export default defineEventHandler(async (event) => {

  const { url } = getQuery(event);

  return {
    success: true,
    data: { url }
  };
});
