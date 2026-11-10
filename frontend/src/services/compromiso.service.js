import axios from "./root.service.js";


export async function getCompromisosService() {
    try {
        const response = await axios.get("/compromisos");
        return response.data?.data ?? [];
    } catch (error) {
        console.error("Error al obtener compromisos:", error);
        return [];
    }
}

export async function createCompromisoService(compromisoData) {
    try {
        const response = await axios.post("compromisos/crear/", compromisoData);
        return Object.assign(response.data, { status: response.status });
    } catch (error) {
        console.error("Error al crear compromiso:", error);
        throw error;
    }
}

export async function patchCompromisoService(compromisoId, compromisoData) {
    try {
        const response = await axios.patch(`compromisos/editar/${compromisoId}`, compromisoData);
        return Object.assign(response.data, { status: response.status });
    } catch (error) {
        console.error("Error al editar compromiso:", error);
        throw error;
    }
}

export async function deleteCompromisoService(compromisoId) {
    try {
        const response = await axios.delete(`compromisos/eliminar/${compromisoId}`);
        return Object.assign(response.data ?? {}, { status: response.status });
    } catch (error) {
        console.error("Error al eliminar compromiso:", error);
        throw error;
    }
}

export async function asignarAporteService(compromisoId, { aporteId, monto_asignado }) {
    try {
        const response = await axios.post(`compromisos/${compromisoId}/aportes`, { aporteId, monto_asignado });
        return Object.assign(response.data, { status: response.status });
    } catch (error) {
        console.error("Error al asignar aporte:", error);
        throw error;
    }
}

export async function quitarAporteService(compromisoId, aporteId) {
    try {
        const response = await axios.delete(`compromisos/${compromisoId}/aportes/${aporteId}`);
        return Object.assign(response.data ?? {}, { status: response.status });
    } catch (error) {
        console.error("Error al quitar aporte:", error);
        throw error;
    }
}

export async function descargarSolicitudService(compromisoId, formato) {
    try {
        const response = await axios.get(`compromisos/${compromisoId}/solicitud/${formato}`, {
            responseType: "blob",
        });
        return response.data;
    } catch (error) {
        console.error("Error al descargar la solicitud de fondos:", error);
        throw error;
    }
}