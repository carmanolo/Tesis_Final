import axios from "./root.service.js";

export async function getAportesService() {
    try {
        const response = await axios.get("/aportes");
        return response.data?.data ?? [];
    } catch (error) {
        console.error("Error al obtener aportes:", error);
        return [];
    }
}

export async function createAporteService(aporteData) {
    try {
        const response = await axios.post("/aportes/crear/", aporteData);
        return Object.assign(response.data, { status: response.status });
    } catch (error) {
        console.error("Error al crear aporte:", error);
        throw error;
    }
}

export async function patchAporteService(aporteId, aporteData) {
    try {
        const response = await axios.patch(`/aportes/editar/${aporteId}`, aporteData);
        return Object.assign(response.data, { status: response.status });
    } catch (error) {
        console.error("Error al editar aporte:", error);
        throw error;
    }
}

export async function deleteAporteService(aporteId) {
    try {
        const response = await axios.delete(`/aportes/eliminar/${aporteId}`);
        return Object.assign(response.data ?? {}, { status: response.status });
    } catch (error) {
        console.error("Error al eliminar aporte:", error);
        throw error;
    }
}

