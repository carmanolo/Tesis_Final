import axios from "./root.service.js";

export async function getRespaldosService(carreraId) {
    try {
        const url = carreraId ? `/respaldos?carreraId=${carreraId}` : "/respaldos";
        const response = await axios.get(url);
        return response.data?.data ?? [];
    } catch (error) {
        console.error("Error al obtener respaldos:", error);
        return [];
    }
}

export async function getRespaldoByIdService(respaldoId) {
    try {
        const response = await axios.get(`/respaldos/${respaldoId}`);
        return response.data?.data ?? null;
    } catch (error) {
        console.error("Error al obtener respaldo:", error);
        return null;
    }
}

export async function createRespaldoService(respaldoData) {
    try {
        const response = await axios.post("/respaldos/crear", respaldoData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
        return Object.assign(response.data, { status: response.status });
    } catch (error) {
        console.error("Error al crear respaldo:", error);
        throw error;
    }
}

export async function patchRespaldoService(respaldoId, respaldoData) {
    try {
        const response = await axios.patch(`/respaldos/editar/${respaldoId}`, respaldoData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
        return Object.assign(response.data, { status: response.status });
    } catch (error) {
        console.error("Error al editar respaldo:", error);
        throw error;
    }
}

export async function deleteRespaldoService(respaldoId) {
    try {
        const response = await axios.delete(`/respaldos/eliminar/${respaldoId}`);
        return Object.assign(response.data ?? {}, { status: response.status });
    } catch (error) {
        console.error("Error al eliminar respaldo:", error);
        throw error;
    }
}

export async function deleteImagenPublicacionService(respaldoId, imagenUrl) {
    try {
        const response = await axios.delete(`/respaldos/${respaldoId}/imagen`, {
            data: { imagenUrl },
        });
        return Object.assign(response.data ?? {}, { status: response.status });
    } catch (error) {
        console.error("Error al eliminar imagen de respaldo:", error);
        throw error;
    }
}