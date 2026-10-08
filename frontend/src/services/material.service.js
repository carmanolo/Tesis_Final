import axios from "./root.service.js";

export async function getMaterialesService() {
    try {
        const response = await axios.get("/materiales");
        return response.data?.data ?? [];
    } catch (error) {
        console.error("Error al obtener materiales:", error);
        return [];
    }
}

export async function createMaterialService(aporteData) {
    try {
        const response = await axios.post("/materiales/crear/", aporteData);
        return Object.assign(response.data, { status: response.status });
    } catch (error) {
        console.error("Error al crear material:", error);
        throw error;
    }
}

export async function patchMaterialService(aporteId, aporteData) {
    try {
        const response = await axios.patch(`/materiales/editar/${aporteId}`, aporteData);
        return Object.assign(response.data, { status: response.status });
    } catch (error) {
        console.error("Error al editar aporte:", error);
        throw error;
    }
}

export async function deleteMaterialService(aporteId) {
    try {
        const response = await axios.delete(`/materiales/eliminar/${aporteId}`);
        return Object.assign(response.data ?? {}, { status: response.status });
    } catch (error) {
        console.error("Error al eliminar aporte:", error);
        throw error;
    }
}
