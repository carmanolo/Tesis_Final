import axios from "./root.service.js";

export async function getPublicacionesService(carreraId) {
    try {
        const url = carreraId ? `/publicaciones?carreraId=${carreraId}` : "/publicaciones";
        const response = await axios.get(url);
        return response.data?.data ?? [];
    } catch (error) {
        console.error("Error al obtener publicaciones:", error);
        return [];
    }
}

export async function getPublicacionByIdService(publicacionId) {
    try {
        const response = await axios.get(`/publicaciones/${publicacionId}`);
        return response.data?.data ?? null;
    } catch (error) {
        console.error("Error al obtener publicación:", error);
        return null;
    }
}

export async function createPublicacionService(publicacionData) {
    try {
        const response = await axios.post("/publicaciones/crear", publicacionData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
        return Object.assign(response.data, { status: response.status });
    } catch (error) {
        console.error("Error al crear publicación:", error);
        throw error;
    }
}

export async function patchPublicacionService(publicacionId, publicacionData) {
    try {
        const response = await axios.patch(`/publicaciones/editar/${publicacionId}`, publicacionData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
        return Object.assign(response.data, { status: response.status });
    } catch (error) {
        console.error("Error al editar publicación:", error);
        throw error;
    }
}

export async function deletePublicacionService(publicacionId) {
    try {
        const response = await axios.delete(`/publicaciones/eliminar/${publicacionId}`);
        return Object.assign(response.data ?? {}, { status: response.status });
    } catch (error) {
        console.error("Error al eliminar publicación:", error);
        throw error;
    }
}

export async function deleteImagenPublicacionService(publicacionId, imagenUrl) {
    try {
        const response = await axios.delete(`/publicaciones/${publicacionId}/imagen`, {
            data: { imagenUrl },
        });
        return Object.assign(response.data ?? {}, { status: response.status });
    } catch (error) {
        console.error("Error al eliminar imagen de publicación:", error);
        throw error;
    }
}