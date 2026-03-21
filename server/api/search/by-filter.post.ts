import { searchAnimesByFilter, GenreEnum, StatusEnum, TypeEnum, OrderEnum } from "animeflv-scraper";

const genres = Object.values(GenreEnum);
const statuses = Object.values(StatusEnum);
const types = Object.values(TypeEnum);
const orders = Object.values(OrderEnum);

export default defineEventHandler(async (event) => {
  // 1. CONFIGURACIÓN DE CABECERAS (CORS Total)
  setResponseHeaders(event, {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "*",
    "Access-Control-Max-Age": "86400",
  });

  // Respuesta rápida para pre-flight
  if (getMethod(event) === 'OPTIONS') {
    event.node.res.statusCode = 204;
    return 'ok';
  }

  const body = await readBody(event);
  const { order, page } = getQuery(event) as { order: string, page: number };

  // 2. VALIDACIONES DE SEGURIDAD
  if (order && !orders?.includes(order)) {
    throw createError({
      statusCode: 400,
      message: `Orden no válido: ${order}`,
    });
  }

  const invalid_types = body?.types?.filter((t: string) => !types?.includes(t));
  if (invalid_types?.length) {
    throw createError({
      statusCode: 400,
      message: `Tipos no válidos: ${invalid_types?.join(", ")}`,
    });
  }

  const invalid_genres = body?.genres?.filter((g: string) => !genres?.includes(g));
  if (invalid_genres?.length) {
    throw createError({
      statusCode: 400,
      message: `Géneros no válidos: ${invalid_genres?.join(", ")}`,
    });
  }

  // 3. MAPEO DE ORDEN
  const orderKeyMap: Record<string, string> = {
    default: "Por Defecto",
    updated: "Recientemente Actualizados",
    added: "Recientemente Agregados",
    title: "Nombre A-Z",
    rating: "Calificación"
  };

  const mappedOrder = orderKeyMap[order] || "Por Defecto";

  try {
    // 4. EJECUCIÓN DE BÚSQUEDA FILTRADA
    const search = await searchAnimesByFilter({ 
      ...body, 
      order: mappedOrder, 
      page: Number(page) || 1 
    });
    
    if (!search || !search?.media?.length) {
      throw createError({
        statusCode: 404,
        message: "No se han encontrado resultados para estos filtros",
      });
    }

    return {
      success: true,
      data: search
    };

  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      message: "Error al filtrar animes en AnimeFLV",
      data: { error: error.message }
    });
  }
});

// --- DOCUMENTACIÓN OPENAPI ---
defineRouteMeta({
  openAPI: {
    tags: ["Search"],
    summary: "Busca usando filtros",
    description: "Filtra animes por género, estado y tipo (Solo AnimeFLV).",
    parameters: [
      { name: "order", in: "query", schema: { type: "string", enum: ["default", "updated", "added", "title", "rating"] } },
      { name: "page", in: "query", schema: { type: "number" } }
    ]
  }
});
