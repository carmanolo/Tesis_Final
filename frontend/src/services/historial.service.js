import axios from "./root.service.js";

export async function getHistorialService(filtros = {}) {
  try {
    const params = new URLSearchParams();
    if (filtros.buscar) params.append("buscar", filtros.buscar);
    if (filtros.soloSospechosos) params.append("soloSospechosos", "true");
    if (filtros.fecha) params.append("fecha", filtros.fecha);
    if (filtros.modulo) params.append("modulo", filtros.modulo);

    const queryString = params.toString() ? `?${params.toString()}` : "";
    const response = await axios.get(`/historial${queryString}`);
    return response.data?.data || [];
  } catch (error) {
    console.error("Error al obtener historial de actividades:", error);
    throw error;
  }
}

export async function deleteHistorialItemService(id) {
  try {
    const response = await axios.delete(`/historial/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error al eliminar item de historial:", error);
    throw error;
  }
}

export async function deleteHistorialLoteService(ids) {
  try {
    const response = await axios.delete("/historial/lote", {
      data: { ids },
    });
    return response.data;
  } catch (error) {
    console.error("Error al eliminar lote de historial:", error);
    throw error;
  }
}
