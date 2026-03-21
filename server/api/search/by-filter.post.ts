import { searchAnimesByFilter, GenreEnum, StatusEnum, TypeEnum, OrderEnum } from "animeflv-scraper";

// Extraemos los valores válidos para las validaciones
const genres = Object.values(GenreEnum);
const statuses = Object.values(StatusEnum);
const types = Object.values(TypeEnum);
const orders = Object.values(OrderEnum);

export default defineCachedEventHandler(async (event) => {
  // 1. CONFIGURACIÓN DE CORS (Autoridad Total)
  setResponseHeaders(event, {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "*",
    "Access-Control-Max-Age": "86400",
  });

  if (getMethod(event) === 'OPTIONS') {
    event.node.res.statusCode = 204;
    return 'ok';
  }

  // 2. EXTRACCIÓN DE DATOS
  const body = await readBody(event);
  const query = getQuery(event);
  const order = String(query.order || "default");
  const page = Number(query.page) || 1;

  // 3. VALIDACIONES DE SEGURIDAD
  // Mapeo de órdenes para que coincidan con lo que espera el scraper
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
      page: page 
    });
    
    if (!search || (search.media && search.media.length === 0)) {
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
      message: error.message || "Error al filtrar animes",
    });
  }
}, {
  // Configuración de Caché (6 horas)
  swr: true,
  maxAge: 21600,
  name: "filter",
  group: "anime",
  getKey: async (event) => {
    const body = await readBody(event);
    const query = getQuery(event);
    // Creamos una llave única basada en los filtros y la página
    return `filter-${JSON.stringify(body)}-${query.order || 'def'}-${query.page || 1}`;
  }
});

// --- DOCUMENTACIÓN OPENAPI ---
defineRouteMeta({
  openAPI: {
    tags: ["Search"],
    summary: "Busca usando filtros (POST)",
    description: "Filtra animes por género, estado y tipo enviando un JSON en el body.",
    parameters: [
      { 
        name: "order", 
        in: "query", 
        required: false,
        schema: { type: "string", enum: ["default", "updated", "added", "title", "rating"] } 
      },
      { 
        name: "page", 
        in: "query", 
        required: false,
        schema: { type: "number", default: 1 } 
      }
    ],
    requestBody: {
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              genres: { type: "array", items: { type: "string" } },
              types: { type: "array", items: { type: "string" } },
              statuses: { type: "array", items: { type: "string" } }
            }
          }
        }
      }
    },
    responses: {
      200: { description: "Resultados filtrados con éxito" },
      404: { description: "Sin resultados" }
    }
  }
});
