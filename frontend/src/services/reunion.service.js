import axios from "./root.service.js";

export async function getReunionesService() {
    try {
        const response = await axios.get("/reuniones");
        // console.log(response);
        return response.data.data;
    } catch (error) {
        console.error("Error al obtener carreras:", error);
    }
}

export async function createReunionService(reunionData) {
    try {
        const response = await axios.post("/reuniones/crear/",reunionData);
        return Object.assign(response.data, {status: response.status});
    } catch (error) {
        console.error("Error al crear reuniones",error);
        throw error; 
    }
}

export async function patchReunionService(reunionId, reunionData) { 
    try {
        const response = await axios.patch(`/reuniones/editar/${reunionId}`, reunionData);
        return Object.assign(response.data, {status: response.status});
    } catch (error) {
        console.error("Error al editar reunion:", error);
        throw error; 
    }
}

export async function deleteReunionService(reunionId) {
    try {
        const response = await axios.delete(`/reuniones/eliminar/${reunionId}`);
        return response.data;
    } catch (error) {
        console.error("Error al eliminar reunion:", error);
    }
}

export async function getContenidoActaService(idReunion) {
    const response = await axios.get(`/reuniones/${idReunion}/acta/contenido`);
    return response.data.data; // { contenido, acta_estado }
}

export async function guardarContenidoActaService(idReunion, contenido) {
    const response = await axios.patch(`/reuniones/${idReunion}/acta/contenido`, { contenido });
    return Object.assign(response.data, { status: response.status });
}

export async function finalizarActaService(idReunion) {
    const response = await axios.post(`/reuniones/${idReunion}/acta/finalizar`);
    return Object.assign(response.data, { status: response.status });
}

// Devuelve un Blob (pdf o docx) generado a partir del borrador guardado
export async function exportarActaService(idReunion, formato = "pdf") {
    const response = await axios.get(`/reuniones/${idReunion}/acta/exportar`, {
        params: { formato },
        responseType: "blob",
    });
    const contentType = response.headers["content-type"] || "application/octet-stream";
    return new Blob([response.data], { type: contentType });
}

