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

export async function createMaterialService(materialData) {
    try {
        const response = await axios.post("/materiales/crear/", materialData);
        return Object.assign(response.data, { status: response.status });
    } catch (error) {
        console.error("Error al crear material:", error);
        throw error;
    }
}

export async function patchMaterialService(materialId, materialData) {
    try {
        const response = await axios.patch(`/materiales/editar/${materialId}`, materialData);
        return Object.assign(response.data, { status: response.status });
    } catch (error) {
        console.error("Error al editar material:", error);
        throw error;
    }
}

export async function deleteMaterialService(materialId) {
    try {
        const response = await axios.delete(`/materiales/eliminar/${materialId}`);
        return Object.assign(response.data ?? {}, { status: response.status });
    } catch (error) {
        console.error("Error al eliminar material:", error);
        throw error;
    }
}
